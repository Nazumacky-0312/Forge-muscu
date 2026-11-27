-- Private, per-user metadata for Forge Muscu progress photos.
create table if not exists public.forge_progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  path text not null unique,
  taken_at date not null default current_date,
  pose text not null check (pose in ('face', 'profil', 'dos')),
  note text not null default '' check (char_length(note) <= 240),
  created_at timestamptz not null default now(),
  constraint forge_progress_photos_path_owner
    check (split_part(path, '/', 1) = user_id::text)
);

create index if not exists forge_progress_photos_user_date_idx
  on public.forge_progress_photos (user_id, taken_at desc, created_at desc);

alter table public.forge_progress_photos enable row level security;

grant select, insert, delete on public.forge_progress_photos to authenticated;

drop policy if exists forge_progress_photos_select_own on public.forge_progress_photos;
create policy forge_progress_photos_select_own
  on public.forge_progress_photos
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists forge_progress_photos_insert_own on public.forge_progress_photos;
create policy forge_progress_photos_insert_own
  on public.forge_progress_photos
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists forge_progress_photos_delete_own on public.forge_progress_photos;
create policy forge_progress_photos_delete_own
  on public.forge_progress_photos
  for delete to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.forge_progress_photos is
  'Private progress-photo metadata. Image objects are stored in the private forge-progress-photos bucket under the owning user UUID folder.';
