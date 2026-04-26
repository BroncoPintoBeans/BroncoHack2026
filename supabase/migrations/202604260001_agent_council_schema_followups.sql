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

-- 3. Canonical private Agent Verdict report. This is the only saved source of
-- truth for completed verdict artifacts; helper_requests only caches board-safe
-- fields for community discovery.
create table if not exists public.case_reports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  run_id uuid not null references public.case_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  report_version integer not null default 1,
  report_json jsonb not null,
  board_summary_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(run_id),
  constraint case_reports_report_json_object
    check (jsonb_typeof(report_json) = 'object'),
  constraint case_reports_board_summary_json_object
    check (jsonb_typeof(board_summary_json) = 'object')
);

create index if not exists case_reports_case_created_idx
  on public.case_reports(case_id, created_at desc);
create index if not exists case_reports_owner_created_idx
  on public.case_reports(user_id, created_at desc);

create or replace function public.case_reports_match_run_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.case_runs r
    where r.id = new.run_id
      and r.case_id = new.case_id
      and r.user_id = new.user_id
  ) then
    raise exception 'case_reports run_id, case_id, and user_id must match case_runs';
  end if;
  return new;
end;
$$;

drop trigger if exists case_reports_match_run_owner_trigger on public.case_reports;
create trigger case_reports_match_run_owner_trigger
  before insert or update of run_id, case_id, user_id
  on public.case_reports
  for each row
  execute function public.case_reports_match_run_owner();

-- 4. Current read model includes diagnosis questions, helper-routing output,
-- and the canonical report for owner-scoped workspace reads.
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
    h.matches as helper_matches,
    cr.report_json,
    cr.board_summary_json
  from public.cases c
  join public.case_runs r on r.case_id = c.id and r.is_current
  left join public.diagnoses d on d.run_id = r.id
  left join public.verdicts v on v.run_id = r.id
  left join public.action_plans a on a.run_id = r.id
  left join public.helper_routing_results h on h.run_id = r.id
  left join public.case_reports cr on cr.run_id = r.id;

-- 5. Owner-scoped RLS for direct client Supabase reads/writes.
alter table public.cases enable row level security;
alter table public.case_media enable row level security;
alter table public.case_runs enable row level security;
alter table public.case_events enable row level security;
alter table public.diagnoses enable row level security;
alter table public.verdicts enable row level security;
alter table public.action_plans enable row level security;
alter table public.helper_routing_results enable row level security;
alter table public.case_reports enable row level security;

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

drop policy if exists "case_reports owner select" on public.case_reports;
drop policy if exists "case_reports owner insert" on public.case_reports;
drop policy if exists "case_reports owner update" on public.case_reports;
create policy "case_reports owner select" on public.case_reports
  for select to authenticated using (user_id = (select auth.uid()));
create policy "case_reports owner insert" on public.case_reports
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "case_reports owner update" on public.case_reports
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 6. Community repair board RLS. helper_requests is public-to-auth for board
-- discovery, while writes stay with the owning case user.
alter table public.helper_requests
  add column if not exists report_id uuid references public.case_reports(id) on delete set null,
  add column if not exists title text,
  add column if not exists public_summary text,
  add column if not exists helper_request_template text,
  add column if not exists category text,
  add column if not exists urgency text not null default 'normal',
  add column if not exists skill_tags jsonb not null default '[]'::jsonb,
  add column if not exists safety_flags jsonb not null default '[]'::jsonb,
  add column if not exists verdict_label text,
  add column if not exists rrr_score numeric,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  alter table public.helper_requests
    drop constraint if exists helper_requests_status_check;
end $$;

alter table public.helper_requests
  add constraint helper_requests_status_check
  check (status in (
    'draft',
    'open',
    'helper_offered',
    'helper_accepted',
    'in_progress',
    'resolved',
    'cancelled',
    'expired',
    'no_helper_found'
  ));

create index if not exists helper_requests_report_idx
  on public.helper_requests(report_id);

do $$
begin
  if to_regclass('public.helper_request_offers') is not null then
    execute $view$
      create or replace view public.community_helper_request_cards as
      select
        hr.id,
        hr.case_id,
        hr.report_id,
        hr.title,
        hr.public_summary,
        hr.category,
        hr.urgency,
        hr.campus_area,
        hr.preferred_time,
        hr.skill_tags,
        hr.safety_flags,
        hr.status,
        hr.verdict_label,
        hr.rrr_score,
        count(hro.id) filter (where hro.status = 'pending') as pending_offer_count,
        hr.created_at,
        hr.updated_at
      from public.helper_requests hr
      left join public.helper_request_offers hro on hro.helper_request_id = hr.id
      group by hr.id
    $view$;
  else
    execute $view$
      create or replace view public.community_helper_request_cards as
      select
        hr.id,
        hr.case_id,
        hr.report_id,
        hr.title,
        hr.public_summary,
        hr.category,
        hr.urgency,
        hr.campus_area,
        hr.preferred_time,
        hr.skill_tags,
        hr.safety_flags,
        hr.status,
        hr.verdict_label,
        hr.rrr_score,
        0::bigint as pending_offer_count,
        hr.created_at,
        hr.updated_at
      from public.helper_requests hr
    $view$;
  end if;
end $$;

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

-- 7. Private repair media bucket. New repair uploads use case-media; the older
-- empty cases-media bucket is intentionally left alone for a later cleanup.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'case-media',
  'case-media',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "case-media owner upload" on storage.objects;
drop policy if exists "case-media owner read" on storage.objects;

create policy "case-media owner upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'case-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1
      from public.cases c
      where c.id::text = (storage.foldername(name))[2]
        and c.user_id = (select auth.uid())
    )
  );

create policy "case-media owner read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'case-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1
      from public.cases c
      where c.id::text = (storage.foldername(name))[2]
        and c.user_id = (select auth.uid())
    )
  );

-- 8. Direct Supabase Realtime subscription support for case_events.
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
