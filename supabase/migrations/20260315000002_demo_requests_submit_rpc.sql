-- Bypass RLS for public demo request submit: anon calls this RPC (runs as definer, so RLS is skipped).
-- Only allows inserting a single row with status = 'pending'; no other fields writable.

create or replace function public.submit_demo_request(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into public.demo_requests (email, status)
  values (trim(lower(coalesce(p_email, ''))), 'pending')
  returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.submit_demo_request(text) to anon;
grant execute on function public.submit_demo_request(text) to authenticated;
