# Communal Repair — SQL Migration Notes

For the demo/MVP we use an in-memory store (`lib/db/community/store.ts`).
Production would apply the migrations below to Supabase.

---

## 1. `helper_requests` (extended from Agent Council Diagnose)

If the Agent Council lane has not already created this table, apply the full create.
Otherwise apply the additive `ALTER TABLE` to add missing columns and widen the status check constraint.

```sql
-- Full create (if table does not exist yet)
create table helper_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  run_id uuid references case_runs(id) on delete set null,
  user_id uuid not null references auth.users(id),

  title text not null,
  public_summary text not null,
  helper_request_template text,
  category text not null,
  urgency text not null default 'normal',
  campus_area text,
  preferred_time text,
  skill_tags jsonb not null default '[]',
  safety_flags jsonb not null default '[]',

  status text not null default 'open'
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
    )),

  diagnosis_snapshot jsonb not null default '{}',
  verdict_snapshot   jsonb not null default '{}',
  action_plan_snapshot jsonb not null default '{}',

  accepted_offer_id uuid,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index helper_requests_board_idx
  on helper_requests(status, category, created_at desc);
create index helper_requests_case_idx
  on helper_requests(case_id);
create index helper_requests_owner_idx
  on helper_requests(user_id, created_at desc);
```

**Snapshot rule:** Store board-safe copies of diagnosis/verdict/action-plan at publish time.
The public board reads the snapshot; only owners and participants may see `latest_case_context`.

---

## 2. `helper_request_offers` (new table)

```sql
create table helper_request_offers (
  id uuid primary key default gen_random_uuid(),
  helper_request_id uuid not null references helper_requests(id) on delete cascade,
  helper_user_id uuid not null references auth.users(id),
  technician_profile_id uuid references technician_profiles(id) on delete set null,

  offer_message text not null,
  availability text,
  skill_tags jsonb not null default '[]',
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','withdrawn')),

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(helper_request_id, helper_user_id)
);

create index helper_request_offers_request_idx
  on helper_request_offers(helper_request_id, status, created_at desc);
create index helper_request_offers_helper_idx
  on helper_request_offers(helper_user_id, created_at desc);
```

---

## 3. `conversations` (additive columns for Communal Repair)

```sql
alter table conversations
  add column if not exists case_id uuid references cases(id) on delete cascade,
  add column if not exists helper_request_id uuid references helper_requests(id) on delete cascade,
  add column if not exists helper_request_offer_id uuid references helper_request_offers(id) on delete cascade,
  add column if not exists conversation_type text not null default 'case_helper'
    check (conversation_type in ('case_helper','listing'));

-- One conversation per offer (private thread before acceptance)
create unique index conversations_helper_offer_pair_idx
  on conversations(helper_request_offer_id)
  where helper_request_offer_id is not null;
```

---

## 4. Public board read model (optional view)

Create as a DB view or implement inline in the repository query layer.

```sql
create or replace view community_helper_request_cards as
select
  hr.id,
  hr.case_id,
  hr.title,
  hr.public_summary,
  hr.category,
  hr.urgency,
  hr.campus_area,
  hr.preferred_time,
  hr.skill_tags,
  hr.safety_flags,
  hr.status,
  hr.verdict_snapshot->>'label' as verdict_label,
  (hr.verdict_snapshot->>'rrr_score')::numeric as rrr_score,
  count(hro.id) filter (where hro.status = 'pending') as pending_offer_count,
  hr.created_at,
  hr.updated_at
from helper_requests hr
left join helper_request_offers hro on hro.helper_request_id = hr.id
group by hr.id;
```

---

## RLS Policy Intent

| Table | Read | Insert | Update |
|---|---|---|---|
| `helper_requests` | All auth users (public fields). Owner for private metadata. | Case owner only. | Owner only. |
| `helper_request_offers` | Request owner + offer author. Public sees aggregate counts only. | Auth non-owner helper. | Owner accepts/declines; offer author withdraws. |
| `conversations` | Participants only. | Server/service path. | Server/service path. |
| `conversation_participants` | Participant rows for current user. | Server/service path. | Server/service path. |
| `messages` | Participants only via conversation membership. | Participants only. | Sender or server path. |
