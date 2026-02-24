create extension if not exists pgcrypto;

create table if not exists public.saved_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  method text not null check (method in ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS')),
  url text not null,
  headers jsonb not null default '[]'::jsonb,
  body_mode text not null check (body_mode in ('none', 'json', 'text')),
  body_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_saved_requests_updated_at on public.saved_requests;
create trigger set_saved_requests_updated_at
before update on public.saved_requests
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.saved_requests enable row level security;

drop policy if exists "saved_requests_select_own" on public.saved_requests;
create policy "saved_requests_select_own"
  on public.saved_requests
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "saved_requests_insert_own" on public.saved_requests;
create policy "saved_requests_insert_own"
  on public.saved_requests
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "saved_requests_update_own" on public.saved_requests;
create policy "saved_requests_update_own"
  on public.saved_requests
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "saved_requests_delete_own" on public.saved_requests;
create policy "saved_requests_delete_own"
  on public.saved_requests
  for delete
  to authenticated
  using (auth.uid() = user_id);
