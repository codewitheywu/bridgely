-- =====================================================================
-- TB Rewards — initial schema (Supabase / Postgres 15+)
-- Use as supabase/migrations/0001_init.sql
-- Principles: ledger + cached balance, writes only via SECURITY DEFINER
-- functions, server-side pricing, idempotent checkout, RLS everywhere.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Types ----------
create type public.app_role      as enum ('employee', 'admin');
create type public.order_status  as enum ('pending', 'fulfilled', 'cancelled');
create type public.ledger_reason as enum ('award', 'redemption', 'refund', 'adjustment');

-- ---------- Tables ----------
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null unique,
  full_name       text not null default '',
  role            public.app_role not null default 'employee',
  department      text,
  avatar_url      text,
  points_balance  integer not null default 0 check (points_balance >= 0),
  created_at      timestamptz not null default now()
);

create table public.rewards (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 80),
  description   text not null default '' check (char_length(description) <= 600),
  image_url     text,
  category      text,
  price_points  integer not null check (price_points between 1 and 1000000),
  stock         integer not null default 0 check (stock >= 0),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.recognitions (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles(id),
  giver_id      uuid not null references public.profiles(id),
  giver_name    text not null,                       -- snapshot: employees can't read admin profiles
  points        integer not null check (points between 1 and 10000),
  message       text not null check (char_length(btrim(message)) between 1 and 280),
  created_at    timestamptz not null default now()
);

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     bigint generated always as identity unique,   -- human-friendly #1001 style
  user_id          uuid not null references public.profiles(id),
  status           public.order_status not null default 'pending',
  total_points     integer not null check (total_points > 0),
  idempotency_key  uuid not null,
  handled_by       uuid references public.profiles(id),
  cancel_reason    text check (char_length(cancel_reason) <= 280),
  created_at       timestamptz not null default now(),
  fulfilled_at     timestamptz,
  cancelled_at     timestamptz,
  unique (user_id, idempotency_key)
);

create table public.order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders(id) on delete cascade,
  reward_id          uuid not null references public.rewards(id),
  reward_name        text not null,      -- snapshot
  reward_image_url   text,               -- snapshot
  unit_price_points  integer not null check (unit_price_points > 0),
  quantity           integer not null check (quantity between 1 and 10)
);

create table public.points_ledger (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references public.profiles(id),
  delta           integer not null check (delta <> 0),
  reason          public.ledger_reason not null,
  order_id        uuid references public.orders(id),
  recognition_id  uuid references public.recognitions(id),
  balance_after   integer not null check (balance_after >= 0),
  created_by      uuid references public.profiles(id),
  note            text,
  created_at      timestamptz not null default now()
);

-- ---------- Indexes ----------
create index orders_user_created_idx   on public.orders (user_id, created_at desc);
create index orders_status_created_idx on public.orders (status, created_at desc);
create index order_items_order_idx     on public.order_items (order_id);
create index ledger_user_created_idx   on public.points_ledger (user_id, created_at desc);
create index recog_recipient_idx       on public.recognitions (recipient_id, created_at desc);
create unique index ledger_one_refund_per_order on public.points_ledger (order_id) where reason = 'refund';

-- ---------- Helpers & triggers ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger rewards_touch before update on public.rewards
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- role is never read from user metadata (prevents self-promotion at signup)
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email,
          coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ---------- award_points (admin only) ----------
create or replace function public.award_points(p_recipient uuid, p_points integer, p_message text)
returns public.recognitions
language plpgsql security definer set search_path = '' as $$
declare
  v_uid     uuid := auth.uid();
  v_giver   text;
  v_rec     public.recognitions;
  v_balance integer;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_points is null or p_points < 1 or p_points > 10000 then raise exception 'INVALID_POINTS'; end if;
  if p_message is null or char_length(btrim(p_message)) not between 1 and 280 then
    raise exception 'INVALID_MESSAGE';
  end if;

  perform 1 from public.profiles where id = p_recipient and role = 'employee' for update;
  if not found then raise exception 'RECIPIENT_NOT_EMPLOYEE'; end if;

  select full_name into v_giver from public.profiles where id = v_uid;

  insert into public.recognitions (recipient_id, giver_id, giver_name, points, message)
  values (p_recipient, v_uid, coalesce(nullif(v_giver, ''), 'Admin'), p_points, btrim(p_message))
  returning * into v_rec;

  update public.profiles set points_balance = points_balance + p_points
  where id = p_recipient returning points_balance into v_balance;

  insert into public.points_ledger (user_id, delta, reason, recognition_id, balance_after, created_by)
  values (p_recipient, p_points, 'award', v_rec.id, v_balance, v_uid);

  return v_rec;
end $$;

-- ---------- redeem_cart (employee checkout, idempotent) ----------
-- p_items: [{"reward_id": "<uuid>", "quantity": 1}, ...]
create or replace function public.redeem_cart(p_items jsonb, p_idempotency_key uuid)
returns public.orders
language plpgsql security definer set search_path = '' as $$
declare
  v_uid     uuid := auth.uid();
  v_role    public.app_role;
  v_balance integer;
  v_total   integer := 0;
  v_items   jsonb;
  v_order   public.orders;
  r         record;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_idempotency_key is null then raise exception 'INVALID_REQUEST'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;
  if jsonb_array_length(p_items) > 20 then raise exception 'CART_TOO_LARGE'; end if;

  -- Fast path: replayed request returns the original order
  select * into v_order from public.orders
  where user_id = v_uid and idempotency_key = p_idempotency_key;
  if found then return v_order; end if;

  -- Serialize all checkouts for this user (lock order: profile -> rewards by id)
  select role, points_balance into v_role, v_balance
  from public.profiles where id = v_uid for update;
  if not found then raise exception 'NOT_AUTHENTICATED'; end if;
  if v_role <> 'employee' then raise exception 'FORBIDDEN'; end if;

  -- Re-check after acquiring the lock (concurrent duplicate click)
  select * into v_order from public.orders
  where user_id = v_uid and idempotency_key = p_idempotency_key;
  if found then return v_order; end if;

  -- Parse, validate, and merge duplicate lines
  begin
    if exists (
      select 1 from jsonb_array_elements(p_items) e
      where (e->>'reward_id') is null
         or (e->>'quantity') is null
         or (e->>'quantity')::integer < 1
         or (e->>'quantity')::integer > 10
    ) then
      raise exception 'INVALID_QUANTITY';
    end if;

    select jsonb_agg(jsonb_build_object('reward_id', reward_id, 'qty', qty) order by reward_id)
      into v_items
    from (
      select (e->>'reward_id')::uuid as reward_id, sum((e->>'quantity')::integer) as qty
      from jsonb_array_elements(p_items) e
      group by 1
    ) s;
  exception
    when invalid_text_representation or numeric_value_out_of_range then
      raise exception 'INVALID_QUANTITY';
  end;

  if exists (select 1 from jsonb_to_recordset(v_items) as x(reward_id uuid, qty integer) where x.qty > 10) then
    raise exception 'INVALID_QUANTITY';
  end if;

  -- Lock reward rows in a stable order (deadlock-safe)
  perform 1 from public.rewards
  where id in (select x.reward_id from jsonb_to_recordset(v_items) as x(reward_id uuid, qty integer))
  order by id
  for update;

  -- Validate stock/status and compute total from DB prices (never from client)
  for r in
    select x.reward_id, x.qty, rw.id as found_id, rw.name, rw.price_points, rw.stock, rw.is_active
    from jsonb_to_recordset(v_items) as x(reward_id uuid, qty integer)
    left join public.rewards rw on rw.id = x.reward_id
  loop
    if r.found_id is null then raise exception 'REWARD_NOT_FOUND'; end if;
    if not r.is_active   then raise exception 'REWARD_INACTIVE'; end if;
    if r.stock < r.qty   then raise exception 'OUT_OF_STOCK:%', r.name; end if;
    v_total := v_total + r.price_points * r.qty;
  end loop;

  if v_balance < v_total then
    raise exception 'INSUFFICIENT_POINTS:%:%', v_total, v_balance;
  end if;

  -- Write everything in this one transaction
  insert into public.orders (user_id, total_points, idempotency_key)
  values (v_uid, v_total, p_idempotency_key)
  returning * into v_order;

  insert into public.order_items (order_id, reward_id, reward_name, reward_image_url, unit_price_points, quantity)
  select v_order.id, rw.id, rw.name, rw.image_url, rw.price_points, x.qty
  from jsonb_to_recordset(v_items) as x(reward_id uuid, qty integer)
  join public.rewards rw on rw.id = x.reward_id;

  update public.rewards rw set stock = rw.stock - x.qty
  from jsonb_to_recordset(v_items) as x(reward_id uuid, qty integer)
  where rw.id = x.reward_id;

  update public.profiles set points_balance = points_balance - v_total
  where id = v_uid returning points_balance into v_balance;

  insert into public.points_ledger (user_id, delta, reason, order_id, balance_after, created_by)
  values (v_uid, -v_total, 'redemption', v_order.id, v_balance, v_uid);

  return v_order;
end $$;

-- ---------- fulfill_order (admin only, idempotent) ----------
create or replace function public.fulfill_order(p_order_id uuid)
returns public.orders
language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_order public.orders;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status = 'fulfilled' then return v_order; end if;
  if v_order.status <> 'pending' then raise exception 'ORDER_NOT_PENDING'; end if;

  update public.orders
     set status = 'fulfilled', fulfilled_at = now(), handled_by = v_uid
   where id = p_order_id
  returning * into v_order;
  return v_order;
end $$;

-- ---------- cancel_order (admin only, refunds points + restores stock, idempotent) ----------
create or replace function public.cancel_order(p_order_id uuid, p_reason text default null)
returns public.orders
language plpgsql security definer set search_path = '' as $$
declare
  v_uid     uuid := auth.uid();
  v_order   public.orders;
  v_balance integer;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status = 'cancelled' then return v_order; end if;   -- no double refund
  if v_order.status <> 'pending' then raise exception 'ORDER_NOT_PENDING'; end if;

  perform 1 from public.profiles where id = v_order.user_id for update;
  perform 1 from public.rewards
   where id in (select reward_id from public.order_items where order_id = p_order_id)
   order by id for update;

  update public.rewards rw set stock = rw.stock + oi.qty
  from (select reward_id, sum(quantity) as qty
          from public.order_items where order_id = p_order_id group by reward_id) oi
  where rw.id = oi.reward_id;

  update public.profiles set points_balance = points_balance + v_order.total_points
  where id = v_order.user_id returning points_balance into v_balance;

  insert into public.points_ledger (user_id, delta, reason, order_id, balance_after, created_by, note)
  values (v_order.user_id, v_order.total_points, 'refund', v_order.id, v_balance, v_uid,
          nullif(btrim(coalesce(p_reason, '')), ''));

  update public.orders
     set status = 'cancelled', cancelled_at = now(), handled_by = v_uid,
         cancel_reason = nullif(btrim(coalesce(p_reason, '')), '')
   where id = p_order_id
  returning * into v_order;
  return v_order;
end $$;

-- ---------- Row Level Security ----------
alter table public.profiles      enable row level security;
alter table public.rewards       enable row level security;
alter table public.recognitions  enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.points_ledger enable row level security;

create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy rewards_select on public.rewards for select to authenticated
  using (is_active or public.is_admin());
create policy rewards_admin_insert on public.rewards for insert to authenticated
  with check (public.is_admin());
create policy rewards_admin_update on public.rewards for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy recognitions_select on public.recognitions for select to authenticated
  using (recipient_id = (select auth.uid()) or public.is_admin());

create policy orders_select on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy order_items_select on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.user_id = (select auth.uid()) or public.is_admin())
  ));

create policy ledger_select on public.points_ledger for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- ---------- Privileges (defense in depth on top of RLS) ----------
revoke all on all tables in schema public from anon;
revoke insert, update, delete on public.profiles, public.recognitions, public.orders,
                                 public.order_items, public.points_ledger from authenticated;
revoke delete on public.rewards from authenticated;

revoke execute on function public.award_points(uuid, integer, text)  from public, anon;
revoke execute on function public.redeem_cart(jsonb, uuid)           from public, anon;
revoke execute on function public.fulfill_order(uuid)                from public, anon;
revoke execute on function public.cancel_order(uuid, text)           from public, anon;
revoke execute on function public.handle_new_user()                  from public, anon, authenticated;
revoke execute on function public.is_admin()                         from public, anon;

grant execute on function public.award_points(uuid, integer, text)  to authenticated;
grant execute on function public.redeem_cart(jsonb, uuid)           to authenticated;
grant execute on function public.fulfill_order(uuid)                to authenticated;
grant execute on function public.cancel_order(uuid, text)           to authenticated;
grant execute on function public.is_admin()                         to authenticated;

-- ---------- Storage: reward images ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reward-images', 'reward-images', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy reward_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'reward-images' and public.is_admin());
create policy reward_images_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'reward-images' and public.is_admin());
create policy reward_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'reward-images' and public.is_admin());
