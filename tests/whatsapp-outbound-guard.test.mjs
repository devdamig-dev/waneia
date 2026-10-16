import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// Exercise the real CRM callback with isolated dependencies. These tests do not
// connect to Meta or establish that an actual WhatsApp message was delivered.
const source = ts.createSourceFile("crm-store.tsx", readFileSync(new URL("../lib/crm-store.tsx", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let sendCallback;
let messageMapper;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === "sendMessage" && ts.isCallExpression(node.initializer)) sendCallback = node.initializer.arguments[0];
  if (ts.isFunctionDeclaration(node) && node.name?.text === "dbMessageToEntity") messageMapper = node;
  ts.forEachChild(node, visit);
}
visit(source);
assert.ok(sendCallback);
assert.ok(messageMapper);
function evaluate(node, context = {}) {
  const js = ts.transpileModule(`(${node.getText(source)})`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  return vm.runInNewContext(js, context);
}
function harness({ account = { status: "pending_webhook", webhook_subscribed: true }, accountError = null, result = { ok: true, message_id: "wamid.unit-test" }, functionError = null } = {}) {
  const calls = [];
  const supabase = {
    from(table) {
      calls.push(["table", table]);
      assert.equal(table, "whatsapp_accounts", "Client must not write a message or conversation as a send fallback");
      const query = {
        select() { return query; }, eq() { return query; },
        maybeSingle: async () => ({ data: account, error: accountError }),
      };
      return query;
    },
    functions: { invoke: async (name, payload) => { calls.push(["invoke", name, payload]); return { data: result, error: functionError }; } },
  };
  return {
    calls,
    send: evaluate(sendCallback, {
      conversations: [{ id: "conversation-a", workspaceId: "tenant-a" }], activeWorkspaceId: "tenant-a", supabase, Response,
      refresh: async () => { calls.push(["refresh"]); },
    }),
  };
}

test("unconfigured or unsubscribed account never creates a fake outbound message", async () => {
  for (const account of [null, { status: "pending_webhook", webhook_subscribed: false }, { status: "connected", webhook_subscribed: false }, { status: "ready", webhook_subscribed: true }, { status: "disabled", webhook_subscribed: true }]) {
    const { send, calls } = harness({ account });
    await assert.rejects(send("conversation-a", "Hola"), /todavía no está autorizada y suscripta/);
    assert.equal(calls.some(([name]) => name === "invoke" || name === "refresh"), false);
  }
});

test("a database error cannot fall back to a local sent state", async () => {
  const { send, calls } = harness({ accountError: new Error("DB unavailable") });
  await assert.rejects(send("conversation-a", "Hola"), /No se pudo verificar/);
  assert.equal(calls.some(([name]) => name === "invoke"), false);
});

test("subscribed pending_webhook and connected accounts request a real server send", async () => {
  for (const status of ["pending_webhook", "connected"]) {
    const { send, calls } = harness({ account: { status, webhook_subscribed: true } });
    await send("conversation-a", " Hola ");
    const invocation = calls.find(([name]) => name === "invoke");
    assert.equal(invocation[1], "whatsapp-send");
    assert.equal(invocation[2].body.workspace_id, "tenant-a");
    assert.equal(invocation[2].body.conversation_id, "conversation-a");
    assert.equal(invocation[2].body.text, "Hola");
    assert.equal(calls.at(-1)[0], "refresh");
  }
});

test("a successful HTTP response without a Meta message ID is not accepted as sent", async () => {
  for (const result of [null, {}, { ok: false, message_id: "wamid.unit" }, { ok: true }, { ok: true, message_id: null }, { ok: true, message_id: "  " }]) {
    const { send, calls } = harness({ result });
    await assert.rejects(send("conversation-a", "Hola"), /no confirmó un identificador/);
    assert.equal(calls.some(([name]) => name === "refresh"), false);
  }
});

test("server send errors cannot become locally successful messages", async () => {
  const { send, calls } = harness({ functionError: new Error("network error") });
  await assert.rejects(send("conversation-a", "Hola"), /No se pudo confirmar el envío/);
  assert.equal(calls.some(([name]) => name === "refresh"), false);
});

test("only a real read status maps to read, never sent or delivered", () => {
  const mapMessage = evaluate(messageMapper);
  for (const status of ["sent", "delivered", "failed", "received"]) {
    assert.equal(mapMessage({ id: "1", direction: "outbound", body: "Hola", sent_at: "2026-10-16T00:00:00Z", status }).read, false);
  }
  assert.equal(mapMessage({ id: "1", direction: "outbound", body: "Hola", sent_at: "2026-10-16T00:00:00Z", status: "read" }).read, true);
});
