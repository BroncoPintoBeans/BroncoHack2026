-- Ensure marketplace listings can be saved as drafts.
-- Safe to run multiple times.

do $$
declare
  status_is_enum boolean;
  status_udt_name text;
  check_constraint_name text;
  check_definition text;
begin
  if to_regclass('public.marketplace_listings') is null then
    raise notice 'public.marketplace_listings does not exist; skipping draft status migration.';
    return;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'marketplace_listings'
      and column_name = 'status'
  ) then
    raise notice 'public.marketplace_listings.status does not exist; skipping draft status migration.';
    return;
  end if;

  select (data_type = 'USER-DEFINED'), udt_name
    into status_is_enum, status_udt_name
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'marketplace_listings'
    and column_name = 'status';

  if status_is_enum then
    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
        and t.typname = status_udt_name
        and e.enumlabel = 'draft'
    ) then
      execute format('alter type public.%I add value ''draft''', status_udt_name);
      raise notice 'Added enum value draft to public.%', status_udt_name;
    end if;
  else
    select c.conname, pg_get_constraintdef(c.oid)
      into check_constraint_name, check_definition
    from pg_constraint c
    join pg_class r on r.oid = c.conrelid
    join pg_namespace n on n.oid = r.relnamespace
    where n.nspname = 'public'
      and r.relname = 'marketplace_listings'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%status%'
    order by c.conname
    limit 1;

    if check_constraint_name is not null and coalesce(check_definition, '') not ilike '%draft%' then
      execute format(
        'alter table public.marketplace_listings drop constraint %I',
        check_constraint_name
      );
      execute '
        alter table public.marketplace_listings
        add constraint marketplace_listings_status_check
        check (status in (''active'', ''sold'', ''archived'', ''draft''))
      ';
      raise notice 'Updated status check constraint to include draft.';
    end if;
  end if;
end
$$;

