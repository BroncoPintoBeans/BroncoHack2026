-- Agent Verdict Repair MVP: case_reports is the canonical private report.

create table if not exists public.case_reports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  run_id uuid not null unique references public.case_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  report_json jsonb not null,
  board_summary_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint case_reports_report_json_object check (jsonb_typeof(report_json) = 'object'),
  constraint case_reports_board_summary_json_object check (jsonb_typeof(board_summary_json) = 'object')
);

create index if not exists case_reports_case_created_idx
  on public.case_reports(case_id, created_at desc);
create index if not exists case_reports_owner_created_idx
  on public.case_reports(user_id, created_at desc);

create or replace function public.enforce_case_report_run_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case_id uuid;
  v_user_id uuid;
begin
  select case_id, user_id
    into v_case_id, v_user_id
  from public.case_runs
  where id = new.run_id;

  if v_case_id is null then
    raise exception 'case report run_id does not exist' using errcode = '23503';
  end if;
  if new.case_id <> v_case_id or new.user_id <> v_user_id then
    raise exception 'case report run_id, case_id, and user_id must match case_runs' using errcode = '23514';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists case_reports_run_consistency on public.case_reports;
create trigger case_reports_run_consistency
  before insert or update on public.case_reports
  for each row execute function public.enforce_case_report_run_consistency();

alter table public.case_reports enable row level security;
drop policy if exists "case_reports owner select" on public.case_reports;
drop policy if exists "case_reports owner insert" on public.case_reports;
drop policy if exists "case_reports owner update" on public.case_reports;
create policy "case_reports owner select" on public.case_reports
  for select to authenticated using (user_id = (select auth.uid()));
create policy "case_reports owner insert" on public.case_reports
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "case_reports owner update" on public.case_reports
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

alter table public.helper_requests
  add column if not exists report_id uuid references public.case_reports(id) on delete set null,
  add column if not exists public_summary text,
  add column if not exists helper_request_template text,
  add column if not exists category text,
  add column if not exists urgency text,
  add column if not exists skill_tags text[] not null default '{}'::text[],
  add column if not exists safety_flags text[] not null default '{}'::text[],
  add column if not exists verdict_label text,
  add column if not exists rrr_score numeric,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  alter table public.helper_requests
    drop constraint if exists helper_requests_status_check;
  alter table public.helper_requests
    add constraint helper_requests_status_check check (
      status in (
        'draft',
        'open',
        'helper_offered',
        'helper_accepted',
        'in_progress',
        'resolved',
        'cancelled',
        'expired',
        'no_helper_found'
      )
    );
exception when duplicate_object then
  null;
end $$;

create index if not exists helper_requests_report_idx
  on public.helper_requests(report_id);

create or replace view public.community_helper_request_cards as
  select
    id,
    case_id,
    report_id,
    title,
    public_summary,
    helper_request_template,
    category,
    urgency,
    campus_area,
    preferred_time,
    skill_tags,
    safety_flags,
    verdict_label,
    rrr_score,
    status,
    created_at,
    updated_at
  from public.helper_requests
  where status in ('open', 'helper_offered', 'helper_accepted', 'in_progress');

insert into storage.buckets (id, name, public)
values ('case-media', 'case-media', false)
on conflict (id) do update set public = false;

drop policy if exists "case-media owner read" on storage.objects;
drop policy if exists "case-media owner upload" on storage.objects;
drop policy if exists "case-media owner update" on storage.objects;
create policy "case-media owner read" on storage.objects
  for select to authenticated using (
    bucket_id = 'case-media'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );
create policy "case-media owner upload" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'case-media'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );
create policy "case-media owner update" on storage.objects
  for update to authenticated using (
    bucket_id = 'case-media'
    and split_part(name, '/', 1) = (select auth.uid())::text
  ) with check (
    bucket_id = 'case-media'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );
