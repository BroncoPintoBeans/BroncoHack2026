-- Green Points backend schema.
-- Apply this to Supabase before enabling persistent rewards.
-- Without Supabase service-role env vars, the app uses the isolated demo ledger
-- in lib/db/demo-store.ts and the default demo user from lib/rewards/data.ts.

create table if not exists public.reward_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  action_id text not null,
  kind text not null check (kind in ('repair', 'trade', 'recycle', 'learn', 'marketplace', 'redeem')),
  label text not null,
  detail text not null,
  tokens integer not null check (tokens <> 0),
  source_type text,
  source_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists reward_ledger_user_created_idx
  on public.reward_ledger (user_id, created_at desc);

create unique index if not exists reward_ledger_one_off_action_idx
  on public.reward_ledger (user_id, action_id)
  where source_id is null and tokens > 0;

create unique index if not exists reward_ledger_source_action_idx
  on public.reward_ledger (user_id, action_id, source_type, source_id)
  where source_id is not null and tokens > 0;

alter table public.reward_ledger enable row level security;

drop policy if exists "Users can read their own reward ledger" on public.reward_ledger;
create policy "Users can read their own reward ledger"
  on public.reward_ledger
  for select
  to authenticated
  using (auth.uid()::text = user_id);

grant select on public.reward_ledger to authenticated;
