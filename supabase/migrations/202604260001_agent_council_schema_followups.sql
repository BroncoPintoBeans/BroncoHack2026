-- Agent Council Diagnose follow-ups.
-- Apply after the core Diagnose tables and community helper tables exist.

-- 1. Keep diagnosis follow-up questions with the diagnosis output unless this
-- feature is intentionally removed from the product.
alter table public.diagnoses
  add column if not exists technician_questions jsonb not null default '[]'::jsonb;

-- 2. Helper-routing agent output is not the same thing as the community repair
-- board. The agent's private match output lives here; users can later publish
-- selected context into helper_requests if they want community help.
create table if not exists public.helper_routing_results (
  run_id uuid primary key references public.case_runs(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  matches jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists helper_routing_results_case_idx
  on public.helper_routing_results(case_id);
create index if not exists helper_routing_results_owner_idx
  on public.helper_routing_results(user_id, updated_at desc);

-- 3. Current read model includes diagnosis questions and helper-routing output.
create or replace view public.current_case_outputs as
  select
    c.id as case_id,
    c.user_id,
    r.id as run_id,
    d.top_causes,
    d.confidence,
    d.safety_flags,
    d.technician_questions as diagnosis_technician_questions,
    v.rrr_score,
    v.rrr_breakdown,
    v.label,
    v.rationale,
    v.uncertainty_note,
    v.repair_low_cents,
    v.repair_high_cents,
    v.replacement_value_cents,
    a.steps,
    a.technician_questions as action_plan_technician_questions,
    a.safety_preamble,
    h.matches as helper_matches
  from public.cases c
  join public.case_runs r on r.case_id = c.id and r.is_current
  left join public.diagnoses d on d.run_id = r.id
  left join public.verdicts v on v.run_id = r.id
  left join public.action_plans a on a.run_id = r.id
  left join public.helper_routing_results h on h.run_id = r.id;

-- 4. Owner-scoped RLS for direct client Supabase reads/writes.
alter table public.cases enable row level security;
alter table public.case_media enable row level security;
alter table public.case_runs enable row level security;
alter table public.case_events enable row level security;
alter table public.diagnoses enable row level security;
alter table public.verdicts enable row level security;
alter table public.action_plans enable row level security;
alter table public.helper_routing_results enable row level security;

drop policy if exists "cases owner select" on public.cases;
drop policy if exists "cases owner insert" on public.cases;
drop policy if exists "cases owner update" on public.cases;
create policy "cases owner select" on public.cases
  for select using (user_id = auth.uid());
create policy "cases owner insert" on public.cases
  for insert with check (user_id = auth.uid());
create policy "cases owner update" on public.cases
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "case_media owner select" on public.case_media;
drop policy if exists "case_media owner insert" on public.case_media;
drop policy if exists "case_media owner update" on public.case_media;
create policy "case_media owner select" on public.case_media
  for select using (user_id = auth.uid());
create policy "case_media owner insert" on public.case_media
  for insert with check (user_id = auth.uid());
create policy "case_media owner update" on public.case_media
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "case_runs owner select" on public.case_runs;
drop policy if exists "case_runs owner insert" on public.case_runs;
drop policy if exists "case_runs owner update" on public.case_runs;
create policy "case_runs owner select" on public.case_runs
  for select using (user_id = auth.uid());
create policy "case_runs owner insert" on public.case_runs
  for insert with check (user_id = auth.uid());
create policy "case_runs owner update" on public.case_runs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "case_events owner select" on public.case_events;
drop policy if exists "case_events owner insert" on public.case_events;
drop policy if exists "case_events owner update" on public.case_events;
create policy "case_events owner select" on public.case_events
  for select using (user_id = auth.uid());
create policy "case_events owner insert" on public.case_events
  for insert with check (user_id = auth.uid());
create policy "case_events owner update" on public.case_events
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "diagnoses owner select" on public.diagnoses;
drop policy if exists "diagnoses owner insert" on public.diagnoses;
drop policy if exists "diagnoses owner update" on public.diagnoses;
create policy "diagnoses owner select" on public.diagnoses
  for select using (user_id = auth.uid());
create policy "diagnoses owner insert" on public.diagnoses
  for insert with check (user_id = auth.uid());
create policy "diagnoses owner update" on public.diagnoses
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "verdicts owner select" on public.verdicts;
drop policy if exists "verdicts owner insert" on public.verdicts;
drop policy if exists "verdicts owner update" on public.verdicts;
create policy "verdicts owner select" on public.verdicts
  for select using (user_id = auth.uid());
create policy "verdicts owner insert" on public.verdicts
  for insert with check (user_id = auth.uid());
create policy "verdicts owner update" on public.verdicts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "action_plans owner select" on public.action_plans;
drop policy if exists "action_plans owner insert" on public.action_plans;
drop policy if exists "action_plans owner update" on public.action_plans;
create policy "action_plans owner select" on public.action_plans
  for select using (user_id = auth.uid());
create policy "action_plans owner insert" on public.action_plans
  for insert with check (user_id = auth.uid());
create policy "action_plans owner update" on public.action_plans
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "helper_routing_results owner select" on public.helper_routing_results;
drop policy if exists "helper_routing_results owner insert" on public.helper_routing_results;
drop policy if exists "helper_routing_results owner update" on public.helper_routing_results;
create policy "helper_routing_results owner select" on public.helper_routing_results
  for select using (user_id = auth.uid());
create policy "helper_routing_results owner insert" on public.helper_routing_results
  for insert with check (user_id = auth.uid());
create policy "helper_routing_results owner update" on public.helper_routing_results
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 5. Community repair board RLS. helper_requests is public-to-auth for board
-- discovery, while writes stay with the owning case user.
alter table public.helper_requests enable row level security;

drop policy if exists "helper_requests authenticated select" on public.helper_requests;
drop policy if exists "helper_requests case owner insert" on public.helper_requests;
drop policy if exists "helper_requests owner update" on public.helper_requests;
create policy "helper_requests authenticated select" on public.helper_requests
  for select to authenticated using (true);
create policy "helper_requests case owner insert" on public.helper_requests
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.cases c
      where c.id = helper_requests.case_id
        and c.user_id = auth.uid()
    )
  );
create policy "helper_requests owner update" on public.helper_requests
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

do $$
begin
  if to_regclass('public.helper_request_offers') is not null then
    alter table public.helper_request_offers enable row level security;

    drop policy if exists "helper_request_offers participant select" on public.helper_request_offers;
    drop policy if exists "helper_request_offers helper insert" on public.helper_request_offers;
    drop policy if exists "helper_request_offers participant update" on public.helper_request_offers;
    create policy "helper_request_offers participant select" on public.helper_request_offers
      for select using (
        helper_user_id = auth.uid()
        or exists (
          select 1 from public.helper_requests hr
          where hr.id = helper_request_offers.helper_request_id
            and hr.user_id = auth.uid()
        )
      );
    create policy "helper_request_offers helper insert" on public.helper_request_offers
      for insert with check (
        helper_user_id = auth.uid()
        and exists (
          select 1 from public.helper_requests hr
          where hr.id = helper_request_offers.helper_request_id
            and hr.user_id <> auth.uid()
            and hr.status in ('open', 'helper_offered')
        )
      );
    create policy "helper_request_offers participant update" on public.helper_request_offers
      for update using (
        helper_user_id = auth.uid()
        or exists (
          select 1 from public.helper_requests hr
          where hr.id = helper_request_offers.helper_request_id
            and hr.user_id = auth.uid()
        )
      ) with check (
        helper_user_id = auth.uid()
        or exists (
          select 1 from public.helper_requests hr
          where hr.id = helper_request_offers.helper_request_id
            and hr.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- 6. Direct Supabase Realtime subscription support for case_events.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'case_events'
  ) then
    alter publication supabase_realtime add table public.case_events;
  end if;
end $$;
