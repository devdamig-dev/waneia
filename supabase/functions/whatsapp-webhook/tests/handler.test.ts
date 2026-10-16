// Fixtures exercise application code only. They are NOT Meta delivery evidence.
import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createWebhookHandler } from "../handler.ts";

type Row = Record<string, any>;
const SECRET = "unit-test-app-secret";
const T0 = 1792108800;
class MemoryDatabase {
  tables: Record<string, Row[]> = {
    whatsapp_accounts: [
      { id: "account-a", workspace_id: "tenant-a", phone_number_id: "111", waba_id: "501" },
      { id: "account-b", workspace_id: "tenant-b", phone_number_id: "222", waba_id: "502" },
    ], contacts: [], conversations: [], messages: [],
  };
  writes: { table: string; action: string; values: Row; filters: [string, unknown][] }[] = [];
  credentials: Record<string, Row> = {
    "111": { workspace_id: "tenant-a", app_secret: SECRET },
    "222": { workspace_id: "tenant-b", app_secret: SECRET },
  };
  failure?: (table: string, action: string) => boolean;
  count = 0;
  from(table: string) { return new Query(this, table); }
  async rpc(name: string, args: Row) {
    if (name === "match_whatsapp_verify_token") return { data: args.p_verify_token === "known-verify" ? [{ workspace_id: "tenant-a" }] : [], error: null };
    if (name === "get_whatsapp_webhook_credentials") return { data: this.credentials[args.p_phone_number_id] ? [this.credentials[args.p_phone_number_id]] : [], error: null };
    throw new Error(`Unexpected RPC: ${name}`);
  }
}
class Query {
  db: MemoryDatabase; table: string; action = "select"; values: Row = {}; filters: [string, unknown][] = [];
  conditions: ((row: Row) => boolean)[] = []; selected = false; one = false; required = false; max = Infinity;
  constructor(db: MemoryDatabase, table: string) { this.db = db; this.table = table; }
  select(_columns: string) { this.selected = true; return this; }
  eq(key: string, value: unknown) { this.filters.push([key, value]); this.conditions.push(row => row[key] === value); return this; }
  in(key: string, values: unknown[]) { this.conditions.push(row => values.includes(row[key])); return this; }
  or(expression: string) { const [key, time] = expression.split(",")[1].split(".lte."); this.conditions.push(row => row[key] == null || row[key] <= time); return this; }
  order(_key: string, _options: unknown) { return this; }
  limit(n: number) { this.max = n; return this; }
  insert(values: Row) { this.action = "insert"; this.values = values; return this; }
  upsert(values: Row, options: Row) { assert.equal(options.onConflict, "whatsapp_message_id"); assert.equal(options.ignoreDuplicates, true); this.action = "upsert"; this.values = values; return this; }
  update(values: Row) { this.action = "update"; this.values = values; return this; }
  maybeSingle() { this.one = true; return this; }
  single() { this.one = true; this.required = true; return this; }
  async execute() {
    if (this.db.failure?.(this.table, this.action)) return { data: null, error: { message: "fixture database failure" } };
    const table = this.db.tables[this.table];
    if (!table) throw new Error(`Unexpected table ${this.table}`);
    let rows = table.filter(row => this.conditions.every(condition => condition(row))).slice(0, this.max);
    if (this.action !== "select") {
      this.db.writes.push({ table: this.table, action: this.action, values: this.values, filters: this.filters });
      if (this.action === "insert" || this.action === "upsert") {
        const duplicate = this.action === "upsert" && table.some(row => row.whatsapp_message_id === this.values.whatsapp_message_id);
        if (duplicate) rows = [];
        else { const row = { id: `row-${++this.db.count}`, ...this.values }; table.push(row); rows = [row]; }
      } else rows.forEach(row => Object.assign(row, this.values));
    }
    if (this.one && (rows.length > 1 || (this.required && rows.length !== 1))) return { data: null, error: { message: "fixture cardinality error" } };
    return { data: this.one ? structuredClone(rows[0] ?? null) : structuredClone(rows), error: null };
  }
  then(resolve: (value: any) => any, reject: (error: any) => any) { return this.execute().then(resolve, reject); }
}
function entry(phone = "111", waba = "501", id = "wamid.a", time = T0) {
  return { id: waba, changes: [{ field: "messages", value: { metadata: { phone_number_id: phone }, contacts: [{ wa_id: "5491100000000", profile: { name: "Fixture contact" } }], messages: [{ from: "5491100000000", id, timestamp: String(time), type: "text", text: { body: id } }] } }] };
}
function request(entries: Row[], secret = SECRET) {
  const body = JSON.stringify({ object: "whatsapp_business_account", entry: entries });
  return new Request("https://fixture.invalid/webhook", { method: "POST", body, headers: { "x-hub-signature-256": `sha256=${createHmac("sha256", secret).update(body).digest("hex")}` } });
}
function statusEntry(id: string, status: string, phone = "111", waba = "501") {
  return { id: waba, changes: [{ field: "messages", value: { metadata: { phone_number_id: phone }, statuses: [{ id, status, timestamp: String(T0) }] } }] };
}
function handler(db: MemoryDatabase, appSecret?: string) { return createWebhookHandler({ admin: db, appSecret }); }

test("challenge validates token without declaring subscription or writing accounts", async () => {
  const db = new MemoryDatabase();
  const response = await handler(db)(new Request("https://fixture.invalid/?hub.mode=subscribe&hub.verify_token=known-verify&hub.challenge=123"));
  assert.equal(response.status, 200); assert.equal(await response.text(), "123"); assert.equal(db.writes.length, 0);
  assert.equal(db.tables.whatsapp_accounts[0].status, undefined);
});

test("platform challenge uses its configured token and rejects a different one", async () => {
  const db = new MemoryDatabase();
  const run = createWebhookHandler({ admin: db, verifyToken: "platform-verify" });
  assert.equal((await run(new Request("https://fixture.invalid/?hub.mode=subscribe&hub.verify_token=platform-verify&hub.challenge=123"))).status, 200);
  assert.equal((await run(new Request("https://fixture.invalid/?hub.mode=subscribe&hub.verify_token=known-verify&hub.challenge=123"))).status, 403);
  assert.equal(db.writes.length, 0);
});

test("routes a two-tenant batch by each entry's phone and WABA", async () => {
  const db = new MemoryDatabase();
  const response = await handler(db, SECRET)(request([entry(), entry("222", "502", "wamid.b")]));
  assert.equal(response.status, 200);
  assert.deepEqual(db.tables.messages.map(m => [m.whatsapp_message_id, m.workspace_id]), [["wamid.a", "tenant-a"], ["wamid.b", "tenant-b"]]);
  assert.equal(db.tables.whatsapp_accounts.every(a => a.status === undefined && a.webhook_subscribed === undefined), true);
  assert.equal(db.tables.contacts.every(c => c.opt_in === false), true);
});

test("legacy mixed-app batch verifies every app signature before any write", async () => {
  const db = new MemoryDatabase(); db.credentials["222"].app_secret = "another-app-secret";
  const response = await handler(db)(request([entry(), entry("222", "502", "wamid.b")]));
  assert.equal(response.status, 401); assert.equal(db.writes.length, 0);
});

test("unknown second tenant rejects whole batch before first tenant mutations", async () => {
  const db = new MemoryDatabase(); delete db.credentials["222"];
  const response = await handler(db, SECRET)(request([entry(), entry("222", "502", "wamid.b")]));
  assert.equal(response.status, 403); assert.equal(db.writes.length, 0);
});

test("valid signature cannot route a phone under the wrong WABA", async () => {
  const db = new MemoryDatabase();
  assert.equal((await handler(db, SECRET)(request([entry("111", "502")]))).status, 403);
  assert.equal(db.writes.length, 0);
});

test("missing or forged signature never persists customer data", async () => {
  const db = new MemoryDatabase(); const run = handler(db, SECRET);
  assert.equal((await run(new Request("https://fixture.invalid", { method: "POST", body: "{}" }))).status, 401);
  assert.equal((await run(request([entry()], "wrong-secret"))).status, 401);
  assert.equal(db.writes.length, 0);
});

test("sequential replay does not duplicate messages or reopen closed conversations", async () => {
  const db = new MemoryDatabase(); const run = handler(db);
  assert.equal((await run(request([entry()]))).status, 200);
  db.tables.conversations[0].status = "cerrado";
  assert.equal((await run(request([entry()]))).status, 200);
  assert.equal(db.tables.messages.length, 1); assert.equal(db.tables.contacts.length, 1); assert.equal(db.tables.conversations.length, 1);
  assert.equal(db.tables.conversations[0].status, "cerrado");
});

test("a replay never rewinds the conversation preview", async () => {
  const db = new MemoryDatabase(); const run = handler(db);
  await run(request([entry()])); await run(request([entry("111", "501", "wamid.newer", T0 + 60)]));
  assert.equal((await run(request([entry()]))).status, 200);
  assert.equal(db.tables.conversations[0].last_message, "wamid.newer");
});

test("failed message persistence returns 500 so Meta can retry", async () => {
  const db = new MemoryDatabase(); db.failure = (table, action) => table === "messages" && action === "upsert";
  assert.equal((await handler(db)(request([entry()]))).status, 500);
  assert.equal(db.tables.messages.length, 0);
});

test("retry repairs preview after a partial persistence failure without another message", async () => {
  const db = new MemoryDatabase(); const run = handler(db);
  await run(request([entry()]));
  db.failure = (table, action) => table === "conversations" && action === "update";
  assert.equal((await run(request([entry("111", "501", "wamid.newer", T0 + 60)]))).status, 500);
  assert.equal(db.tables.messages.length, 2); assert.equal(db.tables.conversations[0].last_message, "wamid.a");
  db.failure = undefined;
  assert.equal((await run(request([entry("111", "501", "wamid.newer", T0 + 60)]))).status, 200);
  assert.equal(db.tables.messages.length, 2); assert.equal(db.tables.conversations[0].last_message, "wamid.newer");
});

test("status cannot update a message from another workspace", async () => {
  const db = new MemoryDatabase(); db.tables.messages.push({ id: "outbound-b", workspace_id: "tenant-b", whatsapp_message_id: "wamid.b", status: "sent" });
  assert.equal((await handler(db)(request([statusEntry("wamid.b", "read")]))).status, 500);
  assert.equal(db.tables.messages[0].status, "sent");
});

test("status persistence failure returns 500 instead of acknowledging loss", async () => {
  const db = new MemoryDatabase(); db.tables.messages.push({ id: "outbound-a", workspace_id: "tenant-a", whatsapp_message_id: "wamid.out", status: "sent" });
  db.failure = (table, action) => table === "messages" && action === "update";
  assert.equal((await handler(db)(request([statusEntry("wamid.out", "read")]))).status, 500);
  assert.equal(db.tables.messages[0].status, "sent");
});

test("out-of-order statuses never downgrade a read message", async () => {
  const db = new MemoryDatabase(); db.tables.messages.push({ id: "outbound-a", workspace_id: "tenant-a", whatsapp_message_id: "wamid.out", status: "read" });
  assert.equal((await handler(db)(request([statusEntry("wamid.out", "delivered")]))).status, 200);
  assert.equal(db.tables.messages[0].status, "read"); assert.equal(db.writes.length, 0);
});

test("unsupported event types are explicit and never falsely acknowledged", async () => {
  const db = new MemoryDatabase(); const e = entry(); e.changes[0].field = "smb_message_echoes";
  assert.equal((await handler(db, SECRET)(request([e]))).status, 422); assert.equal(db.writes.length, 0);
});


test("new inbound messages preserve a pending conversation until a transactional workflow exists", async () => {
  const db = new MemoryDatabase(); const run = handler(db);
  await run(request([entry()]));
  db.tables.conversations[0].status = "pendiente";
  assert.equal((await run(request([entry("111", "501", "wamid.newer", T0 + 60)]))).status, 200);
  assert.equal(db.tables.messages.length, 2);
  assert.equal(db.tables.conversations[0].last_message, "wamid.newer");
  assert.equal(db.tables.conversations[0].status, "pendiente");
  assert.equal(db.writes.some(write => write.table === "conversations" && write.action === "update" && "status" in write.values), false);
});

test("retry after insert and preview failure preserves a later manual close", async () => {
  const db = new MemoryDatabase(); const run = handler(db);
  await run(request([entry()]));
  db.tables.conversations[0].status = "pendiente";
  db.failure = (table, action) => table === "conversations" && action === "update";
  assert.equal((await run(request([entry("111", "501", "wamid.newer", T0 + 60)]))).status, 500);
  assert.equal(db.tables.messages.length, 2);
  assert.equal(db.tables.conversations[0].status, "pendiente");
  db.tables.conversations[0].status = "cerrado";
  db.failure = undefined;
  assert.equal((await run(request([entry("111", "501", "wamid.newer", T0 + 60)]))).status, 200);
  assert.equal(db.tables.messages.length, 2); assert.equal(db.tables.conversations.length, 1);
  assert.equal(db.tables.conversations[0].last_message, "wamid.newer");
  assert.equal(db.tables.conversations[0].status, "cerrado");
});


test("a delayed sent status cannot erase a failed delivery", async () => {
  const db = new MemoryDatabase();
  db.tables.messages.push({ id: "outbound-a", workspace_id: "tenant-a", whatsapp_message_id: "wamid.out", status: "failed", payload: { status: "failed", timestamp: String(T0 + 30) } });
  assert.equal((await handler(db)(request([statusEntry("wamid.out", "sent")]))).status, 200);
  assert.equal(db.tables.messages[0].status, "failed"); assert.equal(db.writes.length, 0);
});

test("delivered and read provide delivery evidence after a failed status", async () => {
  for (const state of ["delivered", "read"]) {
    const db = new MemoryDatabase();
    db.tables.messages.push({ id: "outbound-a", workspace_id: "tenant-a", whatsapp_message_id: "wamid.out", status: "failed", payload: { status: "failed", timestamp: String(T0 + 30) } });
    assert.equal((await handler(db)(request([statusEntry("wamid.out", state)]))).status, 200);
    assert.equal(db.tables.messages[0].status, state);
  }
});

test("an older failure event cannot replace a newer persisted sent event", async () => {
  const db = new MemoryDatabase();
  db.tables.messages.push({ id: "outbound-a", workspace_id: "tenant-a", whatsapp_message_id: "wamid.out", status: "sent", payload: { status: "sent", timestamp: String(T0 + 30) } });
  assert.equal((await handler(db)(request([statusEntry("wamid.out", "failed")]))).status, 200);
  assert.equal(db.tables.messages[0].status, "sent"); assert.equal(db.writes.length, 0);
});

test("status timestamps are validated before any batch persistence", async () => {
  const db = new MemoryDatabase(); const e = statusEntry("wamid.out", "read");
  e.changes[0].value.statuses[0].timestamp = "not-a-timestamp";
  assert.equal((await handler(db)(request([entry(), e]))).status, 400);
  assert.equal(db.writes.length, 0);
});

test("oversized streamed bodies are cancelled without buffering the whole request", async () => {
  const db = new MemoryDatabase(); let pulled = 0; let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulled += 1;
      controller.enqueue(new Uint8Array(1024 * 1024));
      if (pulled === 10) controller.close();
    },
    cancel() { cancelled = true; },
  });
  const req = new Request("https://fixture.invalid", {
    method: "POST", body: stream, duplex: "half",
    headers: { "x-hub-signature-256": "sha256=" + "0".repeat(64) },
  } as RequestInit & { duplex: "half" });
  assert.equal((await handler(db, SECRET)(req)).status, 413);
  assert.equal(cancelled, true); assert.ok(pulled < 10); assert.equal(db.writes.length, 0);
});
