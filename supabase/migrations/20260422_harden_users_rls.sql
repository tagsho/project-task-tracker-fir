-- Harden users table update permissions so role and active-state changes are admin only.
-- This matches the server-action-based management flow in the app.

alter table public.users enable row level security;

drop policy if exists users_update on public.users;
drop policy if exists users_update_admin_manage on public.users;

create policy users_update_admin_manage
  on public.users
  for update
  to authenticated
  using (
    (
      select users.role
      from public.users
      where users.id = auth.uid()
    ) = 'admin'
  )
  with check (
    (
      select users.role
      from public.users
      where users.id = auth.uid()
    ) = 'admin'
  );
