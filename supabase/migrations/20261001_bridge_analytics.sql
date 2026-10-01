-- Nexo WhatsApp Bridge — analytics events
-- Versioned for the manager-analytics-v2 prototype.

create extension if not exists pgcrypto;

create table if not exists public.bridge_devices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  seller_label text,
  secret_hash text not null,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table if not exists public.bridge_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  bridge_device_id uuid not null references public.bridge_devices(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'heartbeat',
      'chat_seen',
      'tag_snapshot',
      'tag_added',
      'tag_removed',
      'outbound_observed'
    )
  ),
  conversation_key text,
  conversation_title text,
  tags text[] not null default '{}',
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists bridge_events_workspace_occurred_idx
  on public.bridge_events (workspace_id, occurred_at desc);

create index if not exists bridge_events_device_occurred_idx
  on public.bridge_events (bridge_device_id, occurred_at desc);

create index if not exists bridge_events_conversation_key_idx
  on public.bridge_events (workspace_id, conversation_key)
  where conversation_key is not null;

alter table public.bridge_devices enable row level security;
alter table public.bridge_events enable row level security;

drop policy if exists "workspace members can read bridge devices" on public.bridge_devices;
create policy "workspace members can read bridge devices"
on public.bridge_devices
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = bridge_devices.workspace_id
      and wm.user_id = auth.uid()
      and wm.active = true
  )
);

drop policy if exists "workspace members can read bridge events" on public.bridge_events;
create policy "workspace members can read bridge events"
on public.bridge_events
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = bridge_events.workspace_id
      and wm.user_id = auth.uid()
      and wm.active = true
  )
);

comment on table public.bridge_devices is
  'Browser bridge installations used only for attribution/analytics. Does not send WhatsApp messages.';

comment on table public.bridge_events is
  'Observed WhatsApp Web UI events used to correlate manual labels/device activity with official Meta webhooks.';
