-- STAGING ONLY. NOT APPLIED OR TESTED AGAINST THE LIVE DATABASE.
-- This transaction intentionally rolls back. Do not change ROLLBACK to COMMIT
-- until the existing schema, grants and credential RPC have been inspected.
-- No credentials are stored here. configure_whatsapp_credentials is untouched.
-- complete_meta_embedded_signup and meta_embedded_signup_security are deliberately
-- absent, so this SQL alone CANNOT enable onboarding.
--
-- Existing dependencies from generated Waneia types:
-- public.workspaces(id), public.workspace_members(workspace_id,user_id,role,active),
-- public.whatsapp_accounts(workspace_id,waba_id,phone_number_id).
-- Supabase roles: service_role, authenticated, anon.

begin;

-- Fail rather than overwrite a schema or routine created by another executor.
create schema waneia_onboarding_private;
revoke all on schema waneia_onboarding_private from public, anon, authenticated;
grant usage on schema waneia_onboarding_private to service_role;

create table waneia_onboarding_private.sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  cookie_hash text not null check (cookie_hash ~ '^[a-f0-9]{64}$'),
  csrf_hash text not null check (csrf_hash ~ '^[a-f0-9]{64}$'),
  code_hash text unique check (code_hash is null or code_hash ~ '^[a-f0-9]{64}$'),
  state text not null default 'pending' check (state in ('pending','processing','complete','expired')),
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  completed_at timestamptz,
  check (expires_at > created_at and expires_at <= created_at + interval '10 minutes'),
  check ((state = 'pending' and consumed_at is null and code_hash is null)
    or state = 'expired'
    or (state in ('processing','complete') and consumed_at is not null and code_hash is not null)),
  check ((state = 'complete') = (completed_at is not null))
);
create index sessions_actor_created on waneia_onboarding_private.sessions (user_id, created_at desc);
create index sessions_workspace_actor on waneia_onboarding_private.sessions (workspace_id, user_id, state);

create table waneia_onboarding_private.asset_claims (
  waba_id text primary key check (waba_id ~ '^[0-9]{5,30}$'),
  phone_number_id text not null unique check (phone_number_id ~ '^[0-9]{5,30}$'),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  session_id uuid not null unique references waneia_onboarding_private.sessions(id) on delete cascade,
  expires_at timestamptz not null
);

alter table waneia_onboarding_private.sessions enable row level security;
alter table waneia_onboarding_private.sessions force row level security;
alter table waneia_onboarding_private.asset_claims enable row level security;
alter table waneia_onboarding_private.asset_claims force row level security;
-- Deliberately no browser policies. Supabase service_role bypasses RLS, while
-- explicit grants still limit the objects accessible through these routines.
revoke all on all tables in schema waneia_onboarding_private from public, anon, authenticated;
grant select, insert, update, delete on waneia_onboarding_private.sessions,
  waneia_onboarding_private.asset_claims to service_role;

create function public.begin_meta_embedded_signup(
  p_workspace_id uuid, p_user_id uuid, p_cookie_hash text,
  p_csrf_hash text, p_expires_at timestamptz
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
  v_now timestamptz := clock_timestamp();
begin
  if current_user <> 'service_role' then raise insufficient_privilege; end if;
  if p_workspace_id is null or p_user_id is null
    or p_cookie_hash is null or p_cookie_hash !~ '^[a-f0-9]{64}$'
    or p_csrf_hash is null or p_csrf_hash !~ '^[a-f0-9]{64}$'
    or p_expires_at is null or p_expires_at <= v_now
    or p_expires_at > v_now + interval '10 minutes' then
    return jsonb_build_object('accepted', false);
  end if;
  -- Serializes new attempts for this actor/workspace, including the rate checks.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 1438387948226800));
  perform 1 from public.workspace_members
    where workspace_id = p_workspace_id and user_id = p_user_id
      and active and role in ('owner','admin') for share;
  if not found then return jsonb_build_object('accepted', false); end if;
  if (select count(*) from waneia_onboarding_private.sessions
      where user_id = p_user_id and workspace_id = p_workspace_id
        and created_at > v_now - interval '10 minutes') >= 5
    or (select count(*) from waneia_onboarding_private.sessions
      where user_id = p_user_id and created_at > v_now - interval '1 hour') >= 20 then
    return jsonb_build_object('accepted', false);
  end if;
  update waneia_onboarding_private.sessions set state = 'expired'
    where user_id = p_user_id and workspace_id = p_workspace_id and state = 'pending';
  insert into waneia_onboarding_private.sessions
    (workspace_id,user_id,cookie_hash,csrf_hash,created_at,expires_at)
    values (p_workspace_id,p_user_id,p_cookie_hash,p_csrf_hash,v_now,p_expires_at)
    returning id into v_id;
  return jsonb_build_object('accepted', true, 'session_id', v_id);
end;
$$;

create function public.consume_meta_embedded_signup(
  p_session_id uuid, p_workspace_id uuid, p_user_id uuid,
  p_cookie_hash text, p_csrf_hash text, p_code_hash text
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if current_user <> 'service_role' then raise insufficient_privilege; end if;
  if p_code_hash is null or p_code_hash !~ '^[a-f0-9]{64}$' then
    return jsonb_build_object('accepted', false);
  end if;
  perform 1 from public.workspace_members
    where workspace_id = p_workspace_id and user_id = p_user_id
      and active and role in ('owner','admin') for share;
  if not found then return jsonb_build_object('accepted', false); end if;
  -- This one statement is the compare-and-swap. It locks the winning session,
  -- checks all bindings, and rejects a code consumed under any other session.
  begin
    update waneia_onboarding_private.sessions
      set state = 'processing', code_hash = p_code_hash, consumed_at = clock_timestamp()
      where id = p_session_id and workspace_id = p_workspace_id and user_id = p_user_id
        and cookie_hash = p_cookie_hash and csrf_hash = p_csrf_hash
        and state = 'pending' and expires_at > clock_timestamp()
      returning id into v_id;
  exception when unique_violation then
    return jsonb_build_object('accepted', false);
  end;
  return jsonb_build_object('accepted', v_id is not null);
end;
$$;

create function public.claim_meta_embedded_signup_assets(
  p_session_id uuid, p_workspace_id uuid, p_user_id uuid,
  p_waba_id text, p_phone_number_id text
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_session waneia_onboarding_private.sessions%rowtype;
  v_existing waneia_onboarding_private.asset_claims%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if current_user <> 'service_role' then raise insufficient_privilege; end if;
  if p_waba_id is null or p_waba_id !~ '^[0-9]{5,30}$'
    or p_phone_number_id is null or p_phone_number_id !~ '^[0-9]{5,30}$' then
    return jsonb_build_object('accepted', false);
  end if;
  perform 1 from public.workspace_members
    where workspace_id = p_workspace_id and user_id = p_user_id
      and active and role in ('owner','admin') for share;
  if not found then return jsonb_build_object('accepted', false); end if;
  select * into v_session from waneia_onboarding_private.sessions
    where id = p_session_id and workspace_id = p_workspace_id and user_id = p_user_id
      and state = 'processing' and expires_at > v_now for update;
  if not found then return jsonb_build_object('accepted', false); end if;

  -- Serialize reservations; no HTTP calls occur in this short transaction.
  -- The finalizer must use the same lock protocol plus permanent account constraints.
  lock table waneia_onboarding_private.asset_claims in share row exclusive mode;
  delete from waneia_onboarding_private.asset_claims where expires_at <= v_now;

  -- Reject both cross-tenant associations and silent replacement of a workspace number.
  if exists (select 1 from public.whatsapp_accounts where
      (workspace_id = p_workspace_id and
        (phone_number_id <> p_phone_number_id or waba_id is distinct from p_waba_id))
      or (workspace_id <> p_workspace_id and
        (phone_number_id = p_phone_number_id or waba_id = p_waba_id))) then
    return jsonb_build_object('accepted', false);
  end if;
  select * into v_existing from waneia_onboarding_private.asset_claims
    where session_id = p_session_id;
  if found then
    return jsonb_build_object('accepted',
      v_existing.workspace_id = p_workspace_id and v_existing.waba_id = p_waba_id
      and v_existing.phone_number_id = p_phone_number_id);
  end if;
  begin
    insert into waneia_onboarding_private.asset_claims
      (waba_id,phone_number_id,workspace_id,session_id,expires_at)
      values (p_waba_id,p_phone_number_id,p_workspace_id,p_session_id,
        least(v_session.expires_at,v_now + interval '2 minutes'));
  exception when unique_violation then
    return jsonb_build_object('accepted', false);
  end;
  return jsonb_build_object('accepted', true);
end;
$$;

revoke all on function public.begin_meta_embedded_signup(uuid,uuid,text,text,timestamptz)
  from public, anon, authenticated;
revoke all on function public.consume_meta_embedded_signup(uuid,uuid,uuid,text,text,text)
  from public, anon, authenticated;
revoke all on function public.claim_meta_embedded_signup_assets(uuid,uuid,uuid,text,text)
  from public, anon, authenticated;
grant execute on function public.begin_meta_embedded_signup(uuid,uuid,text,text,timestamptz) to service_role;
grant execute on function public.consume_meta_embedded_signup(uuid,uuid,uuid,text,text,text) to service_role;
grant execute on function public.claim_meta_embedded_signup_assets(uuid,uuid,uuid,text,text) to service_role;

-- Missing by design: real credential finalizer and security readiness routine.
-- Do not expire/delete completed code hashes inside the token lifetime. Plan a
-- retention job after measuring the actual OAuth lifetime; no scheduled deletion
-- is installed by this staged file.
rollback;
