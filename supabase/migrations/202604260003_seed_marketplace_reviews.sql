-- Seed sample marketplace seller reviews.
--
-- Notes:
-- - Uses existing `public.user_profiles` rows so FK references to `auth.users` stay valid.
-- - Inserts a few reviews per user (as seller) from other existing users.
-- - Safe to run multiple times (skips if a marketplace review already exists for that pair).

with sellers as (
  select id as seller_id
  from public.user_profiles
),
seed_targets as (
  select
    sellers.seller_id,
    gs.n as review_index,
    (
      select p.id
      from public.user_profiles p
      where p.id <> sellers.seller_id
      order by md5(p.id::text || sellers.seller_id::text || gs.n::text)
      limit 1
    ) as reviewer_id
  from sellers
  cross join generate_series(1, 3) as gs(n)
),
prepared as (
  select
    reviewer_id,
    seller_id as reviewed_user_id,
    case (abs(('x' || substr(md5(reviewer_id::text || seller_id::text || review_index::text), 1, 8))::bit(32)::int) % 6)
      when 0 then 5
      when 1 then 5
      when 2 then 4
      when 3 then 5
      when 4 then 4
      else 3
    end as rating,
    (
      array[
        'Quick responses and exactly as described.',
        'Easy pickup and super friendly.',
        'Great communication — would buy again.',
        'Item was clean and worked perfectly.',
        'Smooth exchange, no issues at all.',
        'Fair price and honest description.'
      ]
    )[1 + (abs(('x' || substr(md5(seller_id::text || reviewer_id::text || review_index::text), 1, 8))::bit(32)::int) % 6)] as comment,
    now()
      - make_interval(days => (review_index * 7))
      - make_interval(days => (abs(('x' || substr(md5(reviewer_id::text || review_index::text), 1, 8))::bit(32)::int) % 10)) as created_at
  from seed_targets
  where reviewer_id is not null
)
insert into public.user_ratings (
  reviewer_id,
  reviewed_user_id,
  rating,
  comment,
  order_id,
  case_id,
  created_at
)
select
  prepared.reviewer_id,
  prepared.reviewed_user_id,
  prepared.rating,
  prepared.comment,
  null as order_id,
  null as case_id,
  prepared.created_at
from prepared
where not exists (
  select 1
  from public.user_ratings existing
  where existing.reviewer_id = prepared.reviewer_id
    and existing.reviewed_user_id = prepared.reviewed_user_id
    and existing.order_id is null
    and existing.case_id is null
);

