-- Fix: allow anon/authenticated to insert into demo_requests (RLS was blocking)
-- Ensure table-level INSERT is granted, then relax insert policy to any role with status = 'pending'

grant insert on public.demo_requests to anon;
grant insert on public.demo_requests to authenticated;

drop policy if exists "Allow insert pending demo request" on public.demo_requests;

create policy "Allow insert pending demo request"
  on public.demo_requests
  for insert
  with check (status = 'pending');
