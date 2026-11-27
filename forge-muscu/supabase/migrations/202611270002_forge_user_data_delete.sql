-- Allow an authenticated user to erase only their own Forge cloud data.
drop policy if exists "Users delete their Forge state" on public.forge_user_state;
create policy "Users delete their Forge state"
  on public.forge_user_state for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users delete their Forge revisions" on public.forge_sync_revisions;
create policy "Users delete their Forge revisions"
  on public.forge_sync_revisions for delete to authenticated
  using ((select auth.uid()) = user_id);

grant delete on public.forge_user_state to authenticated;
grant delete on public.forge_sync_revisions to authenticated;
