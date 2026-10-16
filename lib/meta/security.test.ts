import test from "node:test";
import assert from "node:assert/strict";
import { createMetaGraph, hasAppSubscription, verifyTokenData } from "./graph";
import { META_APP_ID, META_APP_ORIGIN, META_REQUIRED_SCOPES } from "./constants";
import { MetaSetupError, publicMetaError } from "./errors";
import { hashSecret, newSecret, readJson, requireSameOrigin, requireSecret, safeEqual } from "./validation";

// Synthetic unit fixtures only. These are not Meta/WABA or App Review evidence.
const wabaId = "123456789012345";
const phoneId = "987654321098765";
const fixture = () => ({
  data: {
    is_valid: true,
    app_id: META_APP_ID,
    expires_at: 0,
    data_access_expires_at: 0,
    scopes: [...META_REQUIRED_SCOPES],
    granular_scopes: META_REQUIRED_SCOPES.map((scope) => ({ scope, target_ids: [wabaId] })),
  },
});

test("tokens must belong to Waneia, include both permissions and target the selected WABA", () => {
  assert.deepEqual(verifyTokenData(fixture(), wabaId).scopes, [...META_REQUIRED_SCOPES]);
  const wrongApp = fixture(); wrongApp.data.app_id = "000000000000000";
  assert.throws(() => verifyTokenData(wrongApp, wabaId), { code: "TOKEN_APP_MISMATCH" });
  const invalid = fixture(); invalid.data.is_valid = false;
  assert.throws(() => verifyTokenData(invalid, wabaId), { code: "TOKEN_APP_MISMATCH" });
  const missingScope = fixture(); missingScope.data.scopes.pop();
  assert.throws(() => verifyTokenData(missingScope, wabaId), { code: "WABA_NOT_AUTHORIZED" });
  const wrongWaba = fixture(); wrongWaba.data.granular_scopes[1].target_ids = ["222222222222222"];
  assert.throws(() => verifyTokenData(wrongWaba, wabaId), { code: "WABA_NOT_AUTHORIZED" });
  assert.throws(() => verifyTokenData({ data: { ...fixture().data, granular_scopes: [] } }, wabaId), { code: "WABA_NOT_AUTHORIZED" });
});

test("expired and unparseable access lifetimes fail closed", () => {
  const expired = fixture(); expired.data.expires_at = 99;
  assert.throws(() => verifyTokenData(expired, wabaId, 100), { code: "TOKEN_EXPIRED" });
  const dataExpired = fixture(); dataExpired.data.data_access_expires_at = 99;
  assert.throws(() => verifyTokenData(dataExpired, wabaId, 100), { code: "TOKEN_EXPIRED" });
  assert.throws(() => verifyTokenData({ data: { ...fixture().data, expires_at: "0" } }, wabaId), { code: "TOKEN_EXPIRED" });
  assert.throws(() => verifyTokenData({ data: { ...fixture().data, expires_at: null } }, wabaId), { code: "TOKEN_EXPIRED" });
});

test("same-origin JSON gate rejects cross-site and forged hosts before side effects", () => {
  const post = (url: string, origin: string, contentType = "application/json", site = "same-origin") => new Request(url, {
    method: "POST", headers: { origin, "content-type": contentType, "sec-fetch-site": site }, body: "{}",
  });
  assert.doesNotThrow(() => requireSameOrigin(post(`${META_APP_ORIGIN}/api/meta/embedded-signup/start`, META_APP_ORIGIN)));
  assert.throws(() => requireSameOrigin(post(`${META_APP_ORIGIN}/api/meta/embedded-signup/start`, "https://attacker.example")), { code: "INVALID_ORIGIN" });
  assert.throws(() => requireSameOrigin(post("https://attacker.example/api/meta", META_APP_ORIGIN)), { code: "INVALID_ORIGIN" });
  assert.throws(() => requireSameOrigin(post(`${META_APP_ORIGIN}/api/meta`, META_APP_ORIGIN, "text/plain")), { status: 415 });
  assert.throws(() => requireSameOrigin(post(`${META_APP_ORIGIN}/api/meta`, META_APP_ORIGIN, "application/json", "cross-site")), { code: "INVALID_ORIGIN" });
});

test("nonce entropy and comparison use validated independent secrets", () => {
  const cookieSecret = newSecret(); const csrf = newSecret();
  assert.equal(requireSecret(cookieSecret), cookieSecret);
  assert.equal(cookieSecret.length, 43);
  assert.notEqual(cookieSecret, csrf);
  assert.equal(safeEqual(hashSecret(cookieSecret), hashSecret(cookieSecret)), true);
  assert.equal(safeEqual(hashSecret(cookieSecret), hashSecret(csrf)), false);
  assert.equal(safeEqual("short", "longer"), false);
  assert.throws(() => requireSecret("predictable"), { code: "INVALID_SESSION" });
});

test("JSON body reader enforces limits even without Content-Length", async () => {
  const request = (body: string) => new Request(`${META_APP_ORIGIN}/api/meta`, { method: "POST", body });
  assert.deepEqual(await readJson(request('{"workspace_id":"sample"}')), { workspace_id: "sample" });
  await assert.rejects(() => readJson(request("{")), { code: "INVALID_REQUEST" });
  await assert.rejects(() => readJson(request("[]")), { code: "INVALID_REQUEST" });
  await assert.rejects(() => readJson(request(`{"value":"${"x".repeat(20000)}"}`)), { status: 413 });
});

test("subscription proof must contain this app's nested WhatsApp metadata", () => {
  assert.equal(hasAppSubscription({ data: [{ whatsapp_business_api_data: { id: META_APP_ID } }] }), true);
  assert.equal(hasAppSubscription({ data: [{ whatsapp_business_api_data: { id: "other" } }] }), false);
  assert.equal(hasAppSubscription({ data: [{ id: META_APP_ID }] }), false);
  assert.equal(hasAppSubscription({ success: true }), false);
});

test("Graph ownership uses only customer token and fixed-host cursor pagination", async () => {
  const calls: { url: URL; init: RequestInit }[] = [];
  const responses = [fixture(), {
    data: [{ id: "000000000000000" }],
    paging: { next: "https://attacker.example/steal-token", cursors: { after: "cursor-2" } },
  }, { data: [{ id: phoneId, verified_name: "Synthetic unit fixture", display_phone_number: "+0" }] }];
  const injected = (async (url, init) => {
    calls.push({ url: new URL(String(url)), init: init ?? {} });
    return Response.json(responses.shift());
  }) as typeof fetch;
  const graph = createMetaGraph({ appSecret: "unit-test-app-secret", fetch: injected });
  const account = await graph.verifyAccount("unit-test-customer-token", wabaId, phoneId);
  assert.equal(account.phoneNumberId, phoneId);
  assert.equal(calls.length, 3);
  assert.ok(calls.every((call) => call.url.host === "graph.facebook.com"));
  assert.equal(calls[2].url.searchParams.get("after"), "cursor-2");
  assert.equal(new Headers(calls[1].init.headers).get("authorization"), "Bearer unit-test-customer-token");
  assert.ok(calls[1].url.searchParams.get("appsecret_proof"));
  assert.ok(calls.every((call) => call.init.redirect === "error" && call.init.cache === "no-store"));
});

test("phone mismatch prevents use of the selected number", async () => {
  const responses = [fixture(), { data: [{ id: "222222222222222" }] }];
  const graph = createMetaGraph({ appSecret: "unit-test", fetch: (async () => Response.json(responses.shift())) as typeof fetch });
  await assert.rejects(() => graph.verifyAccount("unit-test-token", wabaId, phoneId), { code: "PHONE_WABA_MISMATCH" });
});

test("subscribing is insufficient unless a subsequent GET confirms the same app", async () => {
  const calls: string[] = [];
  const responses = [{ success: true }, { data: [] }];
  const graph = createMetaGraph({ appSecret: "unit-test", fetch: (async (_url, init) => {
    calls.push(init?.method ?? "GET");
    return Response.json(responses.shift());
  }) as typeof fetch });
  await assert.rejects(() => graph.subscribeAndVerify("unit-test-token", wabaId), { code: "SUBSCRIPTION_UNVERIFIED" });
  assert.deepEqual(calls, ["POST", "GET"]);
});

test("Graph/network/database errors cannot disclose secrets", async () => {
  const secret = "unit-test-hidden-app-secret";
  const graph = createMetaGraph({ appSecret: secret, fetch: (async (url) => { throw new Error(`request failed: ${String(url)}`); }) as typeof fetch });
  try { await graph.exchangeCode("unit-test-authorization-code"); assert.fail("expected rejection"); }
  catch (error) {
    assert.ok(error instanceof MetaSetupError);
    assert.equal(String(error).includes(secret), false);
    assert.equal(JSON.stringify(publicMetaError(error)).includes(secret), false);
  }
  assert.equal(JSON.stringify(publicMetaError(new Error(`Database token: ${secret}`))).includes(secret), false);
});
