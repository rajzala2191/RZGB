-- Demo access: request → super-admin approval → email with link
-- Only users with an approved token can access /demo

create table if not exists public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  token text unique,
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_demo_requests_status on public.demo_requests(status);
create index if not exists idx_demo_requests_token on public.demo_requests(token) where token is not null;

-- RPC: validate token (called by frontend for /demo access). Returns true only if token exists and status = 'approved'.
create or replace function public.check_demo_token(p_token text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.demo_requests
    where token = p_token and status = 'approved'
  );
$$;

grant execute on function public.check_demo_token(text) to anon;
grant execute on function public.check_demo_token(text) to authenticated;

-- RLS: only super_admin (platform) can read/update; anon can insert new requests
alter table public.demo_requests enable row level security;

-- Super-admin: full access (uses is_super_admin() from workspace_tenancy: role=admin + admin_scope=platform)
create policy "Super admin full access demo_requests"
  on public.demo_requests
  for all
  using (is_super_admin())
  with check (is_super_admin());

-- Anyone can insert a new request (pending only)
create policy "Allow insert pending demo request"
  on public.demo_requests
  for insert
  to anon, authenticated
  with check (status = 'pending');

-- Trigger to set updated_at
create or replace function public.set_demo_requests_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists demo_requests_updated_at on public.demo_requests;
create trigger demo_requests_updated_at
  before update on public.demo_requests
  for each row execute function public.set_demo_requests_updated_at();
