-- Public opt-in weekly leaderboard for Body Forge. No email or workout details are exposed.
create table if not exists public.body_forge_leaderboard (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (
    char_length(btrim(nickname)) between 2 and 20
    and position('@' in nickname) = 0
  ),
  weekly_points integer not null default 0 check (weekly_points between 0 and 100000),
  weekly_sessions integer not null default 0 check (weekly_sessions between 0 and 50),
  weekly_sets integer not null default 0 check (weekly_sets between 0 and 1000),
  week_start date not null,
  updated_at timestamptz not null default now()
);

create index if not exists body_forge_leaderboard_week_points_idx
  on public.body_forge_leaderboard (week_start, weekly_points desc, updated_at asc);

alter table public.body_forge_leaderboard enable row level security;

drop policy if exists "Anyone can view opted-in Body Forge rankings" on public.body_forge_leaderboard;
create policy "Anyone can view opted-in Body Forge rankings"
  on public.body_forge_leaderboard for select to anon, authenticated using (true);

drop policy if exists "Users join Body Forge as themselves" on public.body_forge_leaderboard;
create policy "Users join Body Forge as themselves"
  on public.body_forge_leaderboard for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update only their Body Forge score" on public.body_forge_leaderboard;
create policy "Users update only their Body Forge score"
  on public.body_forge_leaderboard for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.body_forge_leaderboard from anon, authenticated;
grant select (nickname, weekly_points, weekly_sessions, weekly_sets, week_start, updated_at)
  on public.body_forge_leaderboard to anon, authenticated;
grant select (user_id) on public.body_forge_leaderboard to authenticated;
grant insert (user_id, nickname, weekly_points, weekly_sessions, weekly_sets, week_start)
  on public.body_forge_leaderboard to authenticated;
grant update (nickname, weekly_points, weekly_sessions, weekly_sets, week_start)
  on public.body_forge_leaderboard to authenticated;

create or replace function public.touch_body_forge_leaderboard_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.touch_body_forge_leaderboard_updated_at() from public, anon, authenticated;
drop trigger if exists body_forge_leaderboard_updated_at on public.body_forge_leaderboard;
create trigger body_forge_leaderboard_updated_at
  before update on public.body_forge_leaderboard
  for each row execute function public.touch_body_forge_leaderboard_updated_at();
