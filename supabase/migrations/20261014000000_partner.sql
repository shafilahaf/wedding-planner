-- Shared planner for the couple: the owner links their partner's email, then
-- the partner signs in with their own account and works on the owner's
-- planner (read + edit). The couple gets a private two-person chat.
-- Replaces the group chat from 20261013000000_chat.sql.

-- 1. Partner link ------------------------------------------------------------

create table if not exists public.planner_partners (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  owner_email text not null,
  partner_email text not null unique check (partner_email = lower(partner_email)),
  created_at timestamptz not null default now()
);

alter table public.planner_partners enable row level security;

drop policy if exists "planner_partners_select" on public.planner_partners;
create policy "planner_partners_select" on public.planner_partners
  for select to authenticated
  using (owner_id = auth.uid() or partner_email = lower(auth.jwt() ->> 'email'));

-- Either side can end the link. Creating one goes through link_partner().
drop policy if exists "planner_partners_delete" on public.planner_partners;
create policy "planner_partners_delete" on public.planner_partners
  for delete to authenticated
  using (owner_id = auth.uid() or partner_email = lower(auth.jwt() ->> 'email'));

-- The planner this account works on: the owner's if we are someone's partner, else our own.
create or replace function public.my_planner_id() returns uuid
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select owner_id from public.planner_partners where partner_email = lower(auth.jwt() ->> 'email')),
    auth.uid()
  )
$$;

create or replace function public.link_partner(email text) returns void
language plpgsql security definer set search_path = public as $$
declare
  me text := lower(auth.jwt() ->> 'email');
  target text := lower(trim(email));
begin
  if auth.uid() is null then raise exception 'Belum login'; end if;
  if target !~ '^\S+@\S+\.\S+$' then raise exception 'Email tidak valid.'; end if;
  if target = me then raise exception 'Itu email akunmu sendiri.'; end if;
  if exists (select 1 from planner_partners where partner_email = me) then
    raise exception 'Akun ini sudah terhubung ke planner pasangan.';
  end if;
  if exists (select 1 from planner_partners where owner_id = auth.uid()) then
    raise exception 'Kamu sudah terhubung dengan pasangan. Putuskan dulu untuk mengganti.';
  end if;
  if exists (select 1 from planner_partners where partner_email = target)
     or exists (select 1 from planner_partners p join auth.users u on u.id = p.owner_id where lower(u.email) = target) then
    raise exception 'Email ini sudah terhubung dengan planner lain.';
  end if;
  insert into planner_partners (owner_id, owner_email, partner_email) values (auth.uid(), me, target);
end $$;

revoke all on function public.link_partner(text) from public, anon;
grant execute on function public.link_partner(text) to authenticated;

-- 2. Planner: owner and partner share the owner's row ------------------------

drop policy if exists "planner_select_own" on public.planner;
create policy "planner_select_own" on public.planner
  for select to authenticated using (user_id = public.my_planner_id());

drop policy if exists "planner_insert_own" on public.planner;
create policy "planner_insert_own" on public.planner
  for insert to authenticated with check (user_id = public.my_planner_id());

drop policy if exists "planner_update_own" on public.planner;
create policy "planner_update_own" on public.planner
  for update to authenticated
  using (user_id = public.my_planner_id()) with check (user_id = public.my_planner_id());

-- Only the owner can delete the planner itself.
drop policy if exists "planner_delete_own" on public.planner;
create policy "planner_delete_own" on public.planner
  for delete to authenticated using (auth.uid() = user_id);

-- 3. Couple chat (room = the shared planner) ---------------------------------

drop table if exists public.chat_members cascade;
drop table if exists public.chat_rooms cascade;
drop function if exists public.is_chat_member(uuid);

create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  room_id uuid not null,
  sender_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sender_email text not null default lower(auth.jwt() ->> 'email'),
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

do $$
begin
  alter table public.chat_messages
    add constraint chat_messages_room_fk foreign key (room_id) references auth.users (id) on delete cascade;
exception when duplicate_object then null;
end $$;

create index if not exists chat_messages_room_idx on public.chat_messages (room_id, id desc);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages_select" on public.chat_messages;
create policy "chat_messages_select" on public.chat_messages
  for select to authenticated using (room_id = public.my_planner_id());

drop policy if exists "chat_messages_insert" on public.chat_messages;
create policy "chat_messages_insert" on public.chat_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and sender_email = lower(auth.jwt() ->> 'email')
    and room_id = public.my_planner_id()
  );

drop policy if exists "chat_messages_delete_own" on public.chat_messages;
create policy "chat_messages_delete_own" on public.chat_messages
  for delete to authenticated using (sender_id = auth.uid());

-- 4. Live updates: chat messages and planner edits by the other person -------

do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.planner;
exception when duplicate_object then null;
end $$;
