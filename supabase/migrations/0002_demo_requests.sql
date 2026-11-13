-- =====================================================================
-- 0002: "Book a demo" requests (replaces public self sign-up)
-- Anyone can submit through request_demo(); only admins can read.
-- =====================================================================

create table public.demo_requests (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 80),
  work_email    text not null check (char_length(work_email) <= 254 and work_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  company       text not null check (char_length(company) between 2 and 120),
  company_size  text not null check (company_size in ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  message       text check (char_length(message) <= 1000),
  created_at    timestamptz not null default now()
);
create index demo_requests_created_idx on public.demo_requests (created_at desc);
create index demo_requests_email_idx on public.demo_requests (lower(work_email), created_at desc);

alter table public.demo_requests enable row level security;
create policy demo_requests_admin_select on public.demo_requests for select to authenticated
  using (public.is_admin());

revoke all on public.demo_requests from anon, authenticated;
grant select on public.demo_requests to authenticated;          -- RLS limits to admins
grant all on public.demo_requests to service_role;

-- The only way in: validated, rate-limited, no direct table writes.
create or replace function public.request_demo(p_name text, p_email text, p_company text, p_size text, p_message text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if (select count(*) from public.demo_requests where lower(work_email) = v_email and created_at > now() - interval '1 day') >= 3
     or (select count(*) from public.demo_requests where created_at > now() - interval '1 hour') >= 100 then
    raise exception 'TOO_MANY_REQUESTS';
  end if;
  begin
    insert into public.demo_requests (name, work_email, company, company_size, message)
    values (btrim(p_name), v_email, btrim(p_company), p_size, nullif(btrim(coalesce(p_message, '')), ''));
  exception when check_violation or not_null_violation then
    raise exception 'INVALID_REQUEST';
  end;
end $$;

revoke execute on function public.request_demo(text, text, text, text, text) from public;
grant execute on function public.request_demo(text, text, text, text, text) to anon, authenticated;
