-- Group chat: every planner owner has one room (id = owner's user id) and can
-- invite people by email. Invited people can only chat; they never get access
-- to the owner's planner data.

create table if not exists public.chat_rooms (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default ''
);

create table if not exists public.chat_members (
  room_id uuid not null references public.chat_rooms (id) on delete cascade,
  email text not null check (email = lower(email)),
  created_at timestamptz not null default now(),
  primary key (room_id, email)
);

create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.chat_rooms (id) on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sender_email text not null default lower(auth.jwt() ->> 'email'),
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_room_idx on public.chat_messages (room_id, id desc);
create index if not exists chat_members_email_idx on public.chat_members (email);

-- Owner of the room, or invited by the email on the signed-in account.
-- security definer so policies on chat_members can use it without recursing.
create or replace function public.is_chat_member(room uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select room = auth.uid()
    or exists (
      select 1 from public.chat_members m
      where m.room_id = room and m.email = lower(auth.jwt() ->> 'email')
    )
$$;

alter table public.chat_rooms enable row level security;
alter table public.chat_members enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "chat_rooms_select" on public.chat_rooms;
create policy "chat_rooms_select" on public.chat_rooms
  for select to authenticated using (public.is_chat_member(id));

drop policy if exists "chat_rooms_insert_own" on public.chat_rooms;
create policy "chat_rooms_insert_own" on public.chat_rooms
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "chat_rooms_update_own" on public.chat_rooms;
create policy "chat_rooms_update_own" on public.chat_rooms
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "chat_members_select" on public.chat_members;
create policy "chat_members_select" on public.chat_members
  for select to authenticated using (public.is_chat_member(room_id));

drop policy if exists "chat_members_insert_owner" on public.chat_members;
create policy "chat_members_insert_owner" on public.chat_members
  for insert to authenticated with check (room_id = auth.uid());

-- The owner removes anyone; a member can leave.
drop policy if exists "chat_members_delete" on public.chat_members;
create policy "chat_members_delete" on public.chat_members
  for delete to authenticated
  using (room_id = auth.uid() or email = lower(auth.jwt() ->> 'email'));

drop policy if exists "chat_messages_select" on public.chat_messages;
create policy "chat_messages_select" on public.chat_messages
  for select to authenticated using (public.is_chat_member(room_id));

drop policy if exists "chat_messages_insert" on public.chat_messages;
create policy "chat_messages_insert" on public.chat_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and sender_email = lower(auth.jwt() ->> 'email')
    and public.is_chat_member(room_id)
  );

drop policy if exists "chat_messages_delete_own" on public.chat_messages;
create policy "chat_messages_delete_own" on public.chat_messages
  for delete to authenticated using (sender_id = auth.uid());

-- Live updates in the app.
do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception when duplicate_object then null;
end $$;
