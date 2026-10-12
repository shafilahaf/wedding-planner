-- Wedding planner: one JSON document per user + a bucket for photos.

create table if not exists public.planner (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.planner enable row level security;

drop policy if exists "planner_select_own" on public.planner;
create policy "planner_select_own" on public.planner
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "planner_insert_own" on public.planner;
create policy "planner_insert_own" on public.planner
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "planner_update_own" on public.planner;
create policy "planner_update_own" on public.planner
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "planner_delete_own" on public.planner;
create policy "planner_delete_own" on public.planner
  for delete to authenticated using (auth.uid() = user_id);

-- Photos (cover + moodboard). Files live under <user id>/<file>; the bucket is
-- public-read so <img> tags work, but the random file names are unguessable.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "media_insert_own" on storage.objects;
create policy "media_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "media_update_own" on storage.objects;
create policy "media_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "media_delete_own" on storage.objects;
create policy "media_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

-- Server clock decides updated_at so devices with wrong clocks still sync correctly.
create or replace function public.planner_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists planner_touch on public.planner;
create trigger planner_touch before insert or update on public.planner
  for each row execute function public.planner_touch();
