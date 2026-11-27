-- Forge Muscu cloud sync v1
-- Local-first: cloud is an authenticated backup/sync target, never a prerequisite.
create table if not exists public.forge_user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schema_version integer not null default 1 check (schema_version > 0),
  revision bigint not null default 0 check (revision >= 0),
  payload jsonb not null default '{}'::jsonb,
  device_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forge_payload_size check (pg_column_size(payload) <= 5242880)
);

create table if not exists public.forge_sync_revisions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  revision bigint not null check (revision > 0),
  schema_version integer not null check (schema_version > 0),
  payload jsonb not null,
  device_id text,
  created_at timestamptz not null default now(),
  constraint forge_revision_payload_size check (pg_column_size(payload) <= 5242880),
  constraint forge_revision_unique unique (user_id, revision)
);

create index if not exists forge_sync_revisions_user_created_idx
  on public.forge_sync_revisions (user_id, created_at desc);

alter table public.forge_user_state enable row level security;
alter table public.forge_sync_revisions enable row level security;

drop policy if exists "Users read their Forge state" on public.forge_user_state;
create policy "Users read their Forge state"
  on public.forge_user_state for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users insert their Forge state" on public.forge_user_state;
create policy "Users insert their Forge state"
  on public.forge_user_state for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update their Forge state" on public.forge_user_state;
create policy "Users update their Forge state"
  on public.forge_user_state for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users read their Forge revisions" on public.forge_sync_revisions;
create policy "Users read their Forge revisions"
  on public.forge_sync_revisions for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users append their Forge revisions" on public.forge_sync_revisions;
create policy "Users append their Forge revisions"
  on public.forge_sync_revisions for insert to authenticated
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.forge_user_state to authenticated;
grant select, insert on public.forge_sync_revisions to authenticated;
grant usage, select on sequence public.forge_sync_revisions_id_seq to authenticated;

create or replace function public.save_forge_state(
  p_expected_revision bigint,
  p_schema_version integer,
  p_payload jsonb,
  p_device_id text default null
)
returns table (saved_revision bigint, saved_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_revision bigint;
  v_updated_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_expected_revision < 0 or p_schema_version < 1 or p_payload is null then
    raise exception 'Invalid Forge state payload' using errcode = '22023';
  end if;
  if pg_column_size(p_payload) > 5242880 then
    raise exception 'Forge state exceeds the 5 MB limit' using errcode = '22023';
  end if;

  if p_expected_revision = 0 then
    begin
      insert into public.forge_user_state
        (user_id, schema_version, revision, payload, device_id, updated_at)
      values
        (v_user_id, p_schema_version, 1, p_payload, nullif(left(p_device_id, 120), ''), now())
      returning revision, updated_at into v_revision, v_updated_at;
    exception when unique_violation then
      raise exception 'Forge cloud state already exists; fetch it before saving' using errcode = '40001';
    end;
  else
    update public.forge_user_state
       set schema_version = p_schema_version,
           revision = revision + 1,
           payload = p_payload,
           device_id = nullif(left(p_device_id, 120), ''),
           updated_at = now()
     where user_id = v_user_id
       and revision = p_expected_revision
    returning revision, updated_at into v_revision, v_updated_at;

    if not found then
      raise exception 'Forge cloud revision conflict; fetch and reconcile before saving' using errcode = '40001';
    end if;
  end if;

  insert into public.forge_sync_revisions
    (user_id, revision, schema_version, payload, device_id)
  values
    (v_user_id, v_revision, p_schema_version, p_payload, nullif(left(p_device_id, 120), ''));

  return query select v_revision, v_updated_at;
end;
$$;

revoke all on function public.save_forge_state(bigint, integer, jsonb, text) from public, anon;
grant execute on function public.save_forge_state(bigint, integer, jsonb, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'forge-progress-photos',
  'forge-progress-photos',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = 15728640,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users read their Forge progress photos" on storage.objects;
create policy "Users read their Forge progress photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'forge-progress-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users upload their Forge progress photos" on storage.objects;
create policy "Users upload their Forge progress photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'forge-progress-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users update their Forge progress photos" on storage.objects;
create policy "Users update their Forge progress photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'forge-progress-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'forge-progress-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users delete their Forge progress photos" on storage.objects;
create policy "Users delete their Forge progress photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'forge-progress-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
