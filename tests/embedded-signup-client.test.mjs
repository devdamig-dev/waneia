import test from "node:test";
import assert from "node:assert/strict";
import { parseSignupMessage } from "../lib/meta/embedded-signup-client.ts";
import { safeReturnPath } from "../lib/auth/return-path.ts";

const finish = {
  type: "WA_EMBEDDED_SIGNUP", event: "FINISH",
  data: { waba_id: "123456789012345", phone_number_id: "234567890123456" },
};

test("accepts documented Facebook origins and valid signup IDs", () => {
  for (const origin of ["https://www.facebook.com", "https://web.facebook.com"]) {
    assert.deepEqual(parseSignupMessage(origin, JSON.stringify(finish)), {
      kind: "finish", wabaId: finish.data.waba_id, phoneNumberId: finish.data.phone_number_id,
    });
  }
});

test("rejects suffix tricks, subdomains, insecure and null origins", () => {
  for (const origin of ["https://evilfacebook.com", "https://www.facebook.com.attacker.test", "https://attacker.facebook.com", "http://www.facebook.com", "null", "https://www.facebook.com:443"]) {
    assert.equal(parseSignupMessage(origin, finish), null, origin);
  }
});

test("rejects malformed, incomplete, numeric and oversized event data", () => {
  for (const data of [null, "not json", "x".repeat(33_000), { ...finish, type: "OTHER" },
    { ...finish, data: {} }, { ...finish, data: { ...finish.data, waba_id: 123456789012345 } },
    { ...finish, data: { ...finish.data, phone_number_id: "123abc" } },
    { ...finish, data: { ...finish.data, phone_number_id: "1".repeat(31) } }]) {
    assert.equal(parseSignupMessage("https://www.facebook.com", data), null);
  }
});

test("migration, coexistence and account-only flows cannot finish a normal connection", () => {
  for (const event of ["FINISH_OBO_MIGRATION", "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING", "FINISH_ONLY_WABA", "FINISH_GRANT_ONLY_API_ACCESS"]) {
    assert.deepEqual(parseSignupMessage("https://www.facebook.com", { ...finish, event }), { kind: "unsupported" });
  }
});

test("cancellation and Meta errors have explicit outcomes without trusting error text", () => {
  assert.deepEqual(parseSignupMessage("https://www.facebook.com", { type: finish.type, event: "CANCEL" }), { kind: "cancel" });
  assert.deepEqual(parseSignupMessage("https://www.facebook.com", { type: finish.type, event: "ERROR", data: { error_message: "secret" } }), { kind: "error" });
});

test("auth callback preserves local paths and rejects open redirects", () => {
  const origin = "https://app.waneia.com";
  assert.equal(safeReturnPath("/dashboard/integracion-whatsapp?from=meta#connection", origin), "/dashboard/integracion-whatsapp?from=meta#connection");
  for (const path of [null, "https://attacker.test", "//attacker.test", "/\\attacker.test", "/%5cattacker.test", "/%2fattacker.test", "/%zz", "javascript:alert(1)", "/\n/attacker.test"]) {
    assert.equal(safeReturnPath(path, origin), "/dashboard", path);
  }
});
