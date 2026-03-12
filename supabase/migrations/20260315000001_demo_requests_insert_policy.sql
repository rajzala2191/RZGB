-- Fix: allow anon/authenticated to insert into demo_requests (RLS was blocking)
-- Admin policy was FOR ALL, so its WITH CHECK applied to INSERT and blocked anon.
-- Restrict admin policy to SELECT/UPDATE only; keep a dedicated permissive INSERT policy.

grant insert on public.demo_requests to anon;
grant insert on public.demo_requests to authenticated;

drop policy if exists "Super admin full access demo_requests" on public.demo_requests;
create policy "Super admin full access demo_requests"
  on public.demo_requests
  for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Super admin update demo_requests"
  on public.demo_requests
  for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Allow insert pending demo request" on public.demo_requests;
create policy "Allow insert pending demo request"
  on public.demo_requests
  for insert
  with check (status = 'pending');
