import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

// Synthetic handler tests only; no Meta requests or production database calls.
const source = (await readFile(new URL('../supabase/functions/whatsapp-send/index.ts', import.meta.url), 'utf8'))
  .split('// Edge runtime bootstrap.')[0]
  .replace(/^import .*;\r?\n/gm, '');
const javascript = stripTypeScriptTypes(source, { mode: 'strip' });
const { createSendHandler } = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`);
const workspace = '11111111-1111-4111-8111-111111111111';
const conversation = '22222222-2222-4222-8222-222222222222';
const phone = '123456789012345';
const wamid = 'wamid.synthetic-test-only';

function environment(overrides = {}) {
  const queries = [];
  let graphCalls = 0;
  const rows = {
    workspace_members: { id: 'member' },
    whatsapp_accounts: { phone_number_id: phone, waba_id: '555555555555555', status: 'pending_webhook', webhook_subscribed: true },
    conversations: { id: conversation, contact_id: 'contact', status: 'nuevo', channel: 'whatsapp' },
    contacts: { phone: '+54 9 11 5555 0000' },
    ...overrides.rows,
  };
  const admin = {
    from(table) {
      const query = { table, operation: 'read', filters: [], value: null };
      queries.push(query);
      const result = () => ({ data: rows[table] ?? null, error: (table === 'messages' && overrides.persistenceError) ? { message: 'secret DB detail' } : null });
      const builder = {
        select() { return builder; },
        eq(...filter) { query.filters.push(filter); return builder; },
        or(...filter) { query.filters.push(['or', ...filter]); return builder; },
        insert(value) { query.operation = 'insert'; query.value = value; return builder; },
        update(value) { query.operation = 'update'; query.value = value; return builder; },
        async maybeSingle() { return result(); },
        then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
      };
      return builder;
    },
    async rpc() { return { data: [{ phone_number_id: overrides.credentialPhone ?? phone, access_token: 'secret-unit-test-token' }], error: null }; },
  };
  const handler = createSendHandler({
    admin,
    authenticate: async () => ({ id: 'user' }),
    graphVersion: 'v26.0',
    graphFetch: async (_url, init) => {
      graphCalls++;
      assert.equal(init.redirect, 'error');
      assert.ok(init.signal instanceof AbortSignal);
      if (overrides.networkError) throw new Error('secret-token-in-fetch-url');
      return Response.json(overrides.graphData ?? { messages: [{ id: wamid }] }, { status: overrides.graphStatus ?? 200 });
    },
  });
  return { handler, queries, graphCalls: () => graphCalls };
}
const request = (body = { workspace_id: workspace, conversation_id: conversation, text: 'Synthetic test only' }) => new Request('https://test.example/whatsapp-send', {
  method: 'POST', headers: { authorization: 'Bearer synthetic-user-token', 'content-type': 'application/json' }, body: JSON.stringify(body),
});

test('unverified account or mismatched credential prevents all Graph calls', async () => {
  for (const overrides of [
    { rows: { whatsapp_accounts: { phone_number_id: phone, waba_id: '555555555555555', status: 'pending', webhook_subscribed: true } } },
    { rows: { whatsapp_accounts: { phone_number_id: phone, waba_id: '555555555555555', status: 'connected', webhook_subscribed: false } } },
    { credentialPhone: '000000000000000' },
  ]) {
    const env = environment(overrides);
    assert.equal((await env.handler(request())).status, 409);
    assert.equal(env.graphCalls(), 0);
    assert.equal(env.queries.some(q => q.operation === 'insert'), false);
  }
});

test('internal conversations cannot send WhatsApp messages', async () => {
  const env = environment({ rows: { conversations: { id: conversation, contact_id: 'contact', status: 'nuevo', channel: 'internal' } } });
  assert.equal((await env.handler(request())).status, 409);
  assert.equal(env.graphCalls(), 0);
});

test('Graph 2xx without a valid wamid cannot persist sent or report success', async () => {
  for (const graphData of [{ success: true }, { messages: [{ id: '' }] }, { messages: [{ id: 'invalid-id' }] }]) {
    const env = environment({ graphData });
    const response = await env.handler(request());
    const data = await response.json();
    assert.equal(response.status, 502);
    assert.equal(data.error, 'meta_send_unconfirmed');
    assert.equal(data.meta_accepted, 'unknown');
    assert.equal(data.retryable, false);
    assert.equal(env.queries.some(q => q.operation === 'insert'), false);
  }
});

test('accepted message records real id and scopes preview to workspace', async () => {
  const env = environment();
  const data = await (await env.handler(request())).json();
  assert.equal(data.ok, true);
  assert.equal(data.message_id, wamid);
  assert.equal(data.status, 'accepted');
  const inserted = env.queries.find(q => q.table === 'messages' && q.operation === 'insert');
  assert.equal(inserted.value.whatsapp_message_id, wamid);
  assert.equal(inserted.value.workspace_id, workspace);
  const updated = env.queries.find(q => q.table === 'conversations' && q.operation === 'update');
  assert.ok(updated.filters.some(f => f[0] === 'workspace_id' && f[1] === workspace));
  assert.ok(updated.filters.some(f => f[0] === 'id' && f[1] === conversation));
});

test('database failure after Meta acceptance reports uncertainty without duplicate-send advice', async () => {
  const env = environment({ persistenceError: true });
  const response = await env.handler(request());
  const data = await response.json();
  assert.equal(response.status, 502);
  assert.equal(data.ok, false);
  assert.equal(data.meta_accepted, true);
  assert.equal(data.message_id, wamid);
  assert.equal(data.retryable, false);
  assert.equal(JSON.stringify(data).includes('secret'), false);
});

test('network and Graph errors do not return sensitive provider details', async () => {
  for (const overrides of [{ networkError: true }, { graphStatus: 400, graphData: { error: { message: 'secret-unit-test-token' } } }]) {
    const env = environment(overrides);
    const response = await env.handler(request());
    assert.equal(response.status, 502);
    assert.equal((await response.text()).includes('secret'), false);
    assert.equal(env.queries.some(q => q.operation === 'insert'), false);
  }
});

test('body and text limits reject oversized requests before lookup or send', async () => {
  const env = environment();
  const oversized = await env.handler(request({ workspace_id: workspace, conversation_id: conversation, text: 'x'.repeat(40000) }));
  assert.equal(oversized.status, 413);
  const textLimit = await env.handler(request({ workspace_id: workspace, conversation_id: conversation, text: 'x'.repeat(4097) }));
  assert.equal(textLimit.status, 400);
  assert.equal(env.graphCalls(), 0);
  assert.equal(env.queries.length, 0);
});
