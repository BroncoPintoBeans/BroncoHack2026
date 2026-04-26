-- Bronco Repair Desk demo repair cases for the /home Cases panel.
--
-- Run this in the Supabase SQL Editor. It uses the SQL Editor's database role,
-- not a service-role key in app code.
--
-- Choose the target authenticated user in the DO block below:
--   Option A: set target_user_id to the user's auth.users.id UUID.
--   Option B: leave target_user_id null and set target_email to the user's email.
--
-- The seed is idempotent. It derives stable UUIDs from the target user id and
-- marks rows with model_number = 'BRD_DEMO_HOME_CASES_V1:<slug>'.
-- Rerunning updates these demo rows and only removes events carrying the same
-- seed marker in their JSON payload.
--
-- Media is intentionally not seeded here. The case-media bucket is private and
-- expects real uploaded storage objects, so placeholder storage paths would
-- produce broken signed/public URLs in the app.

do $$
declare
  -- Option A: paste a Supabase auth user UUID here.
  target_user_id uuid := null;

  -- Option B: or paste the user's email here and the script will look it up.
  target_email text := null;

  seed_marker constant text := 'BRD_DEMO_HOME_CASES_V1';
  now_ts timestamptz := now();

  laptop_case_id uuid;
  bicycle_case_id uuid;
  fridge_case_id uuid;
  laptop_run_id uuid;
  fridge_run_id uuid;
begin
  if target_user_id is null and nullif(target_email, '') is not null then
    select u.id
      into target_user_id
      from auth.users u
     where lower(u.email) = lower(target_email)
     order by u.created_at desc
     limit 1;
  end if;

  if target_user_id is null then
    raise exception 'Set target_user_id or target_email near the top of scripts/supabase-seed-demo-cases.sql';
  end if;

  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'No auth.users row found for target_user_id %', target_user_id;
  end if;

  laptop_case_id := (
    substr(md5(target_user_id::text || ':' || seed_marker || ':laptop'), 1, 8) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':laptop'), 9, 4) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':laptop'), 13, 4) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':laptop'), 17, 4) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':laptop'), 21, 12)
  )::uuid;

  bicycle_case_id := (
    substr(md5(target_user_id::text || ':' || seed_marker || ':bicycle'), 1, 8) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':bicycle'), 9, 4) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':bicycle'), 13, 4) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':bicycle'), 17, 4) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':bicycle'), 21, 12)
  )::uuid;

  fridge_case_id := (
    substr(md5(target_user_id::text || ':' || seed_marker || ':mini_fridge'), 1, 8) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':mini_fridge'), 9, 4) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':mini_fridge'), 13, 4) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':mini_fridge'), 17, 4) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':mini_fridge'), 21, 12)
  )::uuid;

  laptop_run_id := (
    substr(md5(target_user_id::text || ':' || seed_marker || ':laptop:run'), 1, 8) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':laptop:run'), 9, 4) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':laptop:run'), 13, 4) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':laptop:run'), 17, 4) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':laptop:run'), 21, 12)
  )::uuid;

  fridge_run_id := (
    substr(md5(target_user_id::text || ':' || seed_marker || ':mini_fridge:run'), 1, 8) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':mini_fridge:run'), 9, 4) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':mini_fridge:run'), 13, 4) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':mini_fridge:run'), 17, 4) || '-' ||
    substr(md5(target_user_id::text || ':' || seed_marker || ':mini_fridge:run'), 21, 12)
  )::uuid;

  if exists (
    select 1
      from public.cases c
     where c.id in (laptop_case_id, bicycle_case_id, fridge_case_id)
       and (
         c.user_id <> target_user_id
         or coalesce(c.model_number, '') not like seed_marker || ':%'
       )
  ) then
    raise exception 'A deterministic demo UUID already belongs to a non-demo case. Aborting without changes.';
  end if;

  if exists (
    select 1
      from public.case_runs r
     where r.id in (laptop_run_id, fridge_run_id)
       and (
         r.user_id <> target_user_id
         or r.input_snapshot->>'seed_marker' is distinct from seed_marker
       )
  ) then
    raise exception 'A deterministic demo run UUID already belongs to a non-demo run. Aborting without changes.';
  end if;

  insert into public.cases (
    id,
    user_id,
    title,
    symptoms,
    category,
    urgency,
    status,
    model_number,
    created_at,
    updated_at
  )
  values
    (
      laptop_case_id,
      target_user_id,
      'Dorm laptop screen flicker',
      'Display flickers and briefly blacks out when the lid angle changes during class.',
      'laptop',
      'urgent',
      'running',
      seed_marker || ':laptop',
      now_ts - interval '2 minutes',
      now_ts
    ),
    (
      bicycle_case_id,
      target_user_id,
      'Bike chain slips under load',
      'Chain skips on hills and under hard pedaling, especially after shifting into higher gears.',
      'bicycle',
      'normal',
      'draft',
      seed_marker || ':bicycle',
      now_ts - interval '4 minutes',
      now_ts
    ),
    (
      fridge_case_id,
      target_user_id,
      'Mini fridge not cooling',
      'Compressor hums and the light turns on, but drinks stay room temperature overnight.',
      'mini_fridge',
      'low',
      'awaiting_user',
      seed_marker || ':mini_fridge',
      now_ts - interval '6 minutes',
      now_ts
    )
  on conflict (id) do update
     set user_id = excluded.user_id,
         title = excluded.title,
         symptoms = excluded.symptoms,
         category = excluded.category,
         urgency = excluded.urgency,
         status = excluded.status,
         model_number = excluded.model_number,
         created_at = excluded.created_at,
         updated_at = excluded.updated_at
   where public.cases.user_id = target_user_id
     and coalesce(public.cases.model_number, '') like seed_marker || ':%';

  insert into public.case_runs (
    id,
    case_id,
    user_id,
    run_number,
    input_snapshot,
    is_current,
    status,
    current_phase,
    next_phase,
    awaiting_question,
    followup_count,
    trigger_reason,
    created_at,
    updated_at
  )
  values
    (
      laptop_run_id,
      laptop_case_id,
      target_user_id,
      1,
      jsonb_build_object(
        'seed_marker', seed_marker,
        'category', 'laptop',
        'symptoms', 'Display flickers and briefly blacks out when the lid angle changes during class.',
        'urgency', 'urgent'
      ),
      true,
      'running',
      'diagnosis',
      'economics',
      null,
      0,
      'initial',
      now_ts - interval '110 seconds',
      now_ts
    ),
    (
      fridge_run_id,
      fridge_case_id,
      target_user_id,
      1,
      jsonb_build_object(
        'seed_marker', seed_marker,
        'category', 'mini_fridge',
        'symptoms', 'Compressor hums and the light turns on, but drinks stay room temperature overnight.',
        'urgency', 'low'
      ),
      true,
      'awaiting_user',
      'diagnosis',
      'economics',
      'Has the mini fridge been left upright and unplugged for at least 4 hours before testing?',
      0,
      'initial',
      now_ts - interval '90 seconds',
      now_ts
    )
  on conflict (id) do update
     set case_id = excluded.case_id,
         user_id = excluded.user_id,
         run_number = excluded.run_number,
         input_snapshot = excluded.input_snapshot,
         is_current = excluded.is_current,
         status = excluded.status,
         current_phase = excluded.current_phase,
         next_phase = excluded.next_phase,
         awaiting_question = excluded.awaiting_question,
         followup_count = excluded.followup_count,
         trigger_reason = excluded.trigger_reason,
         created_at = excluded.created_at,
         updated_at = excluded.updated_at
   where public.case_runs.user_id = target_user_id
     and public.case_runs.input_snapshot->>'seed_marker' = seed_marker;

  insert into public.diagnoses (
    run_id,
    case_id,
    user_id,
    top_causes,
    confidence,
    safety_flags,
    technician_questions,
    created_at
  )
  values
    (
      laptop_run_id,
      laptop_case_id,
      target_user_id,
      jsonb_build_array(
        jsonb_build_object(
          'description', 'Loose or worn display flex cable near the hinge',
          'confidence', 0.72
        ),
        jsonb_build_object(
          'description', 'Failing LCD panel backlight or connector',
          'confidence', 0.21
        )
      ),
      0.72,
      '[]'::jsonb,
      jsonb_build_array(
        'Does the flicker change when the lid angle changes?',
        'Has the laptop been dropped or repaired recently?'
      ),
      now_ts - interval '65 seconds'
    ),
    (
      fridge_run_id,
      fridge_case_id,
      target_user_id,
      jsonb_build_array(
        jsonb_build_object(
          'description', 'Thermostat setting, ventilation, or recent transport preventing cooling',
          'confidence', 0.58
        ),
        jsonb_build_object(
          'description', 'Compressor start relay or sealed-system cooling fault',
          'confidence', 0.32
        )
      ),
      0.58,
      jsonb_build_array('appliance_electrical'),
      jsonb_build_array(
        'Has the mini fridge been left upright and unplugged for at least 4 hours before testing?',
        'Is the back of the fridge warm while the inside remains room temperature?'
      ),
      now_ts - interval '35 seconds'
    )
  on conflict (run_id) do update
     set case_id = excluded.case_id,
         user_id = excluded.user_id,
         top_causes = excluded.top_causes,
         confidence = excluded.confidence,
         safety_flags = excluded.safety_flags,
         technician_questions = excluded.technician_questions,
         created_at = excluded.created_at
   where public.diagnoses.user_id = target_user_id
     and public.diagnoses.case_id in (laptop_case_id, fridge_case_id);

  insert into public.helper_routing_results (
    run_id,
    case_id,
    user_id,
    matches,
    created_at,
    updated_at
  )
  values
    (
      laptop_run_id,
      laptop_case_id,
      target_user_id,
      jsonb_build_array(
        jsonb_build_object(
          'name', 'Campus Repair Desk',
          'contactUrl', '/community-repair',
          'specialization', 'Laptop display diagnosis and safe triage'
        )
      ),
      now_ts - interval '30 seconds',
      now_ts
    ),
    (
      fridge_run_id,
      fridge_case_id,
      target_user_id,
      jsonb_build_array(
        jsonb_build_object(
          'name', 'Facilities Appliance Check',
          'contactUrl', '/community-repair',
          'specialization', 'Mini fridge ventilation and cooling checks'
        )
      ),
      now_ts - interval '25 seconds',
      now_ts
    )
  on conflict (run_id) do update
     set case_id = excluded.case_id,
         user_id = excluded.user_id,
         matches = excluded.matches,
         created_at = excluded.created_at,
         updated_at = excluded.updated_at
   where public.helper_routing_results.user_id = target_user_id;

  delete from public.case_events
   where case_id in (laptop_case_id, fridge_case_id)
     and payload->>'seed_marker' = seed_marker;

  insert into public.case_events (
    case_id,
    run_id,
    user_id,
    phase,
    status,
    payload,
    created_at
  )
  values
    (
      laptop_case_id,
      laptop_run_id,
      target_user_id,
      'intake',
      'complete',
      jsonb_build_object(
        'seed_marker', seed_marker,
        'message', 'Demo intake captured the laptop symptoms and urgency.'
      ),
      now_ts - interval '100 seconds'
    ),
    (
      laptop_case_id,
      laptop_run_id,
      target_user_id,
      'diagnosis',
      'running',
      jsonb_build_object(
        'seed_marker', seed_marker,
        'message', 'Demo diagnosis agent is checking display cable and panel failure patterns.'
      ),
      now_ts - interval '70 seconds'
    ),
    (
      fridge_case_id,
      fridge_run_id,
      target_user_id,
      'intake',
      'complete',
      jsonb_build_object(
        'seed_marker', seed_marker,
        'message', 'Demo intake captured cooling symptoms and safe appliance context.'
      ),
      now_ts - interval '80 seconds'
    ),
    (
      fridge_case_id,
      fridge_run_id,
      target_user_id,
      'diagnosis',
      'awaiting_user',
      jsonb_build_object(
        'seed_marker', seed_marker,
        'question', 'Has the mini fridge been left upright and unplugged for at least 4 hours before testing?'
      ),
      now_ts - interval '40 seconds'
    );

  raise notice 'Seeded Bronco Repair Desk demo cases for user %: %, %, %',
    target_user_id,
    laptop_case_id,
    bicycle_case_id,
    fridge_case_id;
end $$;

-- Verification result grid for Supabase SQL Editor.
-- If this returns 3 rows, the seed is present in the database where you ran it.
select
  c.id,
  u.email as user_email,
  c.title,
  c.symptoms,
  c.category,
  c.urgency,
  c.status,
  c.created_at
from public.cases c
join auth.users u on u.id = c.user_id
where c.model_number like 'BRD_DEMO_HOME_CASES_V1:%'
order by c.created_at desc;

-- Verify the view used by repair detail/current-output flows.
select
  c.title,
  cco.case_id,
  cco.run_id,
  cco.top_causes,
  cco.confidence,
  cco.safety_flags,
  cco.diagnosis_technician_questions,
  cco.helper_matches
from public.current_case_outputs cco
join public.cases c on c.id = cco.case_id
where c.model_number like 'BRD_DEMO_HOME_CASES_V1:%'
order by c.created_at desc;

-- Debug the view's underlying joins if current_case_outputs shows NULL outputs.
select
  c.title,
  r.id as run_id,
  r.is_current,
  r.status as run_status,
  d.run_id is not null as has_diagnosis,
  d.top_causes as diagnosis_top_causes,
  h.run_id is not null as has_helper_routing,
  h.matches as helper_matches
from public.cases c
left join public.case_runs r
  on r.case_id = c.id
 and r.is_current
left join public.diagnoses d
  on d.case_id = c.id
 and d.run_id = r.id
left join public.helper_routing_results h
  on h.case_id = c.id
 and h.run_id = r.id
where c.model_number like 'BRD_DEMO_HOME_CASES_V1:%'
order by c.created_at desc;
