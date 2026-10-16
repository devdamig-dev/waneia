# Embedded Signup: pending database security contract

**Not deployed, not database-tested, not approved for activation.** The existing Supabase project was unavailable during implementation. Generated TypeScript types describe `configure_whatsapp_credentials`, but its SQL body, grants, encryption, tenant isolation and concurrency constraints could not be inspected. The application deliberately returns `ready: false` until the live database has been restored and the requirements below have been implemented and audited.

This is an extension of the existing Waneia backend and its `whatsapp_accounts` / private credentials storage. Do not create another Supabase project, duplicate the credential store, replace the existing integration, or run DDL based only on generated types. First retrieve the actual schema and function bodies.

## Server environment

| Variable | Purpose |
| --- | --- |
| `META_APP_SECRET` | Secret of app `1438387948226800`; secure server environment only. |
| `META_WEBHOOK_VERIFY_TOKEN` | Random platform webhook verification secret; same value as the existing webhook implementation. |
| `SUPABASE_SERVICE_ROLE_KEY` | Existing project's server credential; never `NEXT_PUBLIC_*`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Existing project URL. Existing code defaults to `ologbtksnlzlncpftmde`. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Existing project public client key. |

App, configuration, Graph version and origin are pinned in `constants.ts`. The config ID identifies the Facebook Login for Business flow; it does not imply that `sessionInfoVersion: 4` is valid. Configure and verify the exact Meta dashboard flow before activation.

## Required database security contract

`meta_embedded_signup_security()` is a **service-role-only**, read-only function returning one JSON object:

```json
{
  "contract": "waneia-meta-embedded-signup-v1",
  "storage_encrypted": true,
  "restrictive_grants": true,
  "tenant_constraints": true,
  "durable_sessions": true
}
```

These values must be derived from the actual reviewed database implementation, not hard-coded true flags, environment switches or an editable workspace row. The function must check the required routine signatures and privileges, tenant constraints and the secure credential storage implementation. No environment variable can bypass this contract. Its implementation is deliberately absent until the live credential SQL can be inspected. A missing routine or any incomplete requirement keeps onboarding disabled.

Before implementing this routine, verify:

- Access token, app secret and verify token are encrypted at rest using the existing private storage/Vault implementation. Decrypting getters cannot be called by browser `anon` or `authenticated` users. Check `get_whatsapp_send_credentials` and `get_whatsapp_webhook_credentials`, not only the setter.
- Public metadata has RLS for the actual tenant membership, and only server-controlled paths can set credential references, identifiers, `status`, `webhook_subscribed` or verification timestamps. An admin must not be able to forge another workspace's association.
- The private schema is unexposed, has restrictive schema/table/sequence/function privileges and RLS as defense in depth. Revoke `PUBLIC` / `anon` / `authenticated` EXECUTE from privileged routines; include default privileges and function owner checks.
- The existing `configure_whatsapp_credentials` is reused transactionally by the finalizer below. Inspect its authorization semantics before wrapping it. Do not blindly remove `auth.uid()` checks to make a service-role caller work. If adaptation is needed, preserve explicit actor/membership validation and restrict invocation to the trusted server role.
- Unique tenant ownership of a WABA and phone ID is enforced in the database under concurrency. Do not move a phone or overwrite another tenant's credentials. Reconnecting a different number in the same workspace also requires a separate explicit replacement flow; this implementation must reject it.
- Session and claim state is durable, limited in lifetime and atomically changed. A serverless process-local Map, signed cookie alone, or read-then-update without a lock is insufficient.
- Existing webhook/send database operations are tenant-scoped and idempotent; a metadata status alone cannot prove message delivery or app approval.

## Required service-only RPCs

All routines return one JSON object (not a SQL `SETOF` array). All take the explicit actor only from the authenticated server after `auth.getUser()` and an active owner/admin membership check; the routines must repeat that authorization against `workspace_members` in the transaction. They must reject inactive, missing or removed memberships. Their API must reject calls by `anon`/`authenticated`, including direct REST calls from a logged-in browser. Never log secrets or raw OAuth codes.

1. `begin_meta_embedded_signup(p_workspace_id uuid, p_user_id uuid, p_cookie_hash text, p_csrf_hash text, p_expires_at timestamptz)`
   - Validate SHA-256 hashes, actor and expiry (at most 10 minutes in the future, using the database clock).
   - Persist a randomly generated UUID session, workspace, user, cookie/CSRF hashes, expiry and `pending` state in the existing project private schema.
   - Invalidate previous pending sessions for that actor/workspace. Rate-limit creation and cap pending attempts. Do not invalidate a processing lease.
   - Return `{ "accepted": true, "session_id": "<uuid>" }`, otherwise `{ "accepted": false }`.
2. `consume_meta_embedded_signup(p_session_id uuid, p_workspace_id uuid, p_user_id uuid, p_cookie_hash text, p_csrf_hash text, p_code_hash text)`
   - In **one transaction**, compare session/workspace/user/hash/expiry, lock the row, transition `pending` → `processing`, and store a unique code SHA-256 hash. Only one contender may succeed.
   - Enforce that the same code hash cannot be consumed under another session or workspace; retain used hashes at least beyond the maximum authorization-code lifetime.
   - Return `{ "accepted": true }` only for the winning transition. All mismatches, expiry and replay return `{ "accepted": false }`.
3. `claim_meta_embedded_signup_assets(p_session_id uuid, p_workspace_id uuid, p_user_id uuid, p_waba_id text, p_phone_number_id text)`
   - Accept only an unexpired consumed session. Persist a bounded processing lease and acquire database-enforced unique claims on WABA and phone before the app subscribes with Meta.
   - Reject assets held by another tenant, concurrent in-flight claims, or attempts to replace a different existing number in this workspace. Permit same-workspace/same-asset reconnect after the previous lease ends.
   - Return `{ "accepted": true }` only for the winning claim; otherwise false.
4. `complete_meta_embedded_signup(p_session_id uuid, p_workspace_id uuid, p_user_id uuid, p_waba_id text, p_phone_number_id text, p_display_phone_number text, p_verified_name text, p_access_token text, p_app_secret text, p_verify_token text, p_token_expires_at bigint, p_data_access_expires_at bigint, p_granted_scopes text[])`
   - Lock and recheck consumed session, actor, membership, asset lease and uniqueness.
   - **In one transaction**, call the existing `configure_whatsapp_credentials` with the verified account/token; encrypt secrets using the audited existing storage; set public metadata to `pending_webhook` and `webhook_subscribed=true`; persist token expiry/scopes as non-secret metadata; mark the session complete.
   - `webhook_subscribed=true` means the Graph WABA subscriptions edge contained app `1438387948226800`, not that incoming delivery or messaging was proven.
   - Never set `connected` here. Preserve a previous verified connection only when there is an explicit matching-asset reconnect policy reviewed together with the webhook implementation.
   - Return `{ "saved": true, "status": "pending_webhook" }` only after commit. Any exception must roll back **all** credential and metadata writes.

Do not implement these routines as unconditional stubs just to satisfy readiness. Keep the gate closed until permissions, encryption, two-tenant denial and concurrent replay tests pass against the real restored database.

`onboarding-sessions.staging.sql` supplies an unapplied implementation of the independent durable sessions, atomic consumption and asset reservations. It deliberately does not create `complete_meta_embedded_signup` or `meta_embedded_signup_security`, because neither can safely be implemented from generated types without inspecting the existing private credential schema and function bodies. It also does not change `configure_whatsapp_credentials`, create a second credential store, or grant new access to existing sensitive tables. Audit and adapt the staged SQL to the restored schema before generating an actual migration.

## API behavior and tests

- `GET /api/meta/embedded-signup?workspace_id=<uuid>` reports readiness and public IDs. It only exposes account metadata after verified admin authorization and storage readiness.
- `POST /api/meta/embedded-signup/start` accepts `{workspace_id}` only from `https://app.waneia.com` with JSON content type. It creates an HttpOnly/Secure/Strict `__Host-` cookie plus a separate CSRF value for the browser to keep in memory.
- `POST /api/meta/embedded-signup/complete` accepts `{workspace_id,sessionId,code,waba_id,phone_number_id}` plus `X-Waneia-CSRF`. It consumes the durable attempt before any Meta calls, exchanges the code server-side, verifies app/scopes/granular WABA grants and expiry, verifies phone membership, claims assets, subscribes and reads the subscription back, then persists atomically.
- A failure after Meta subscription but before database commit may leave this app subscribed. The UI reports failure, never connected. The next attempt must reconnect the same assets; do not automatically remove a potentially pre-existing customer's subscription.
- Code and tokens are never returned to the UI. Exceptions from Graph/DB are replaced with allowlisted messages so request URLs and credentials cannot leak.
- No phone registration, number migration, system-user reassignment, credit-line sharing, or message sending is performed by this code.

The accompanying tests are unit tests with synthetic payloads and injected fetch behavior. They verify rejection rules, headers and sequencing only. They are **not** successful WhatsApp tests, onboarding evidence, webhook evidence, or App Review evidence. Real OAuth, live SQL, multi-tenant concurrency, a signed real webhook, inbound/outbound messages and recordings remain necessary after access is restored.
