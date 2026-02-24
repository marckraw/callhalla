create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_name_not_empty check (char_length(trim(name)) between 1 and 80),
  constraint workspaces_user_name_unique unique (user_id, name)
);

create table if not exists public.environments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint environments_name_not_empty check (char_length(trim(name)) between 1 and 60),
  constraint environments_workspace_name_unique unique (workspace_id, name)
);

create unique index if not exists environments_workspace_default_unique
  on public.environments (workspace_id)
  where is_default;

create table if not exists public.workspace_variable_definitions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  key text not null,
  description text not null default '',
  is_secret boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_variable_key_format check (key ~ '^[a-z][a-z0-9_]*$'),
  constraint workspace_variable_definition_unique unique (workspace_id, key)
);

create table if not exists public.environment_variable_values (
  id uuid primary key default gen_random_uuid(),
  environment_id uuid not null references public.environments(id) on delete cascade,
  variable_definition_id uuid not null references public.workspace_variable_definitions(id) on delete cascade,
  value text not null default '',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint environment_variable_values_unique unique (environment_id, variable_definition_id)
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_workspace_id uuid references public.workspaces(id) on delete set null,
  active_environment_id uuid references public.environments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.saved_requests
add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

create index if not exists saved_requests_workspace_updated_idx
  on public.saved_requests (workspace_id, updated_at desc);

create or replace function public.workspace_owned_by_user(target_workspace_id uuid, target_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.workspaces workspace
    where workspace.id = target_workspace_id
      and workspace.user_id = target_user_id
  );
$$;

create or replace function public.workspace_id_for_environment(target_environment_id uuid)
returns uuid
language sql
stable
as $$
  select environment.workspace_id
  from public.environments environment
  where environment.id = target_environment_id;
$$;

create or replace function public.seed_environment_values_for_new_variable()
returns trigger
language plpgsql
as $$
begin
  insert into public.environment_variable_values (environment_id, variable_definition_id, value, enabled)
  select environment.id, new.id, '', true
  from public.environments environment
  where environment.workspace_id = new.workspace_id
  on conflict (environment_id, variable_definition_id) do nothing;

  return new;
end;
$$;

create or replace function public.seed_environment_values_for_new_environment()
returns trigger
language plpgsql
as $$
begin
  insert into public.environment_variable_values (environment_id, variable_definition_id, value, enabled)
  select new.id, variable.id, '', true
  from public.workspace_variable_definitions variable
  where variable.workspace_id = new.workspace_id
  on conflict (environment_id, variable_definition_id) do nothing;

  return new;
end;
$$;

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at
before update on public.workspaces
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_environments_updated_at on public.environments;
create trigger set_environments_updated_at
before update on public.environments
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_workspace_variable_definitions_updated_at on public.workspace_variable_definitions;
create trigger set_workspace_variable_definitions_updated_at
before update on public.workspace_variable_definitions
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_environment_variable_values_updated_at on public.environment_variable_values;
create trigger set_environment_variable_values_updated_at
before update on public.environment_variable_values
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at
before update on public.user_settings
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists seed_environment_values_for_new_variable on public.workspace_variable_definitions;
create trigger seed_environment_values_for_new_variable
after insert on public.workspace_variable_definitions
for each row
execute function public.seed_environment_values_for_new_variable();

drop trigger if exists seed_environment_values_for_new_environment on public.environments;
create trigger seed_environment_values_for_new_environment
after insert on public.environments
for each row
execute function public.seed_environment_values_for_new_environment();

alter table public.workspaces enable row level security;
alter table public.environments enable row level security;
alter table public.workspace_variable_definitions enable row level security;
alter table public.environment_variable_values enable row level security;
alter table public.user_settings enable row level security;

create policy workspaces_select_own
  on public.workspaces
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy workspaces_insert_own
  on public.workspaces
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy workspaces_update_own
  on public.workspaces
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy workspaces_delete_own
  on public.workspaces
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy environments_select_own
  on public.environments
  for select
  to authenticated
  using (public.workspace_owned_by_user(workspace_id, auth.uid()));

create policy environments_insert_own
  on public.environments
  for insert
  to authenticated
  with check (public.workspace_owned_by_user(workspace_id, auth.uid()));

create policy environments_update_own
  on public.environments
  for update
  to authenticated
  using (public.workspace_owned_by_user(workspace_id, auth.uid()))
  with check (public.workspace_owned_by_user(workspace_id, auth.uid()));

create policy environments_delete_own
  on public.environments
  for delete
  to authenticated
  using (public.workspace_owned_by_user(workspace_id, auth.uid()));

create policy workspace_variable_definitions_select_own
  on public.workspace_variable_definitions
  for select
  to authenticated
  using (public.workspace_owned_by_user(workspace_id, auth.uid()));

create policy workspace_variable_definitions_insert_own
  on public.workspace_variable_definitions
  for insert
  to authenticated
  with check (public.workspace_owned_by_user(workspace_id, auth.uid()));

create policy workspace_variable_definitions_update_own
  on public.workspace_variable_definitions
  for update
  to authenticated
  using (public.workspace_owned_by_user(workspace_id, auth.uid()))
  with check (public.workspace_owned_by_user(workspace_id, auth.uid()));

create policy workspace_variable_definitions_delete_own
  on public.workspace_variable_definitions
  for delete
  to authenticated
  using (public.workspace_owned_by_user(workspace_id, auth.uid()));

create policy environment_variable_values_select_own
  on public.environment_variable_values
  for select
  to authenticated
  using (
    public.workspace_owned_by_user(
      public.workspace_id_for_environment(environment_id),
      auth.uid()
    )
  );

create policy environment_variable_values_insert_own
  on public.environment_variable_values
  for insert
  to authenticated
  with check (
    public.workspace_owned_by_user(
      public.workspace_id_for_environment(environment_id),
      auth.uid()
    )
  );

create policy environment_variable_values_update_own
  on public.environment_variable_values
  for update
  to authenticated
  using (
    public.workspace_owned_by_user(
      public.workspace_id_for_environment(environment_id),
      auth.uid()
    )
  )
  with check (
    public.workspace_owned_by_user(
      public.workspace_id_for_environment(environment_id),
      auth.uid()
    )
  );

create policy environment_variable_values_delete_own
  on public.environment_variable_values
  for delete
  to authenticated
  using (
    public.workspace_owned_by_user(
      public.workspace_id_for_environment(environment_id),
      auth.uid()
    )
  );

create policy user_settings_select_own
  on public.user_settings
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy user_settings_insert_own
  on public.user_settings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy user_settings_update_own
  on public.user_settings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy user_settings_delete_own
  on public.user_settings
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "saved_requests_select_own" on public.saved_requests;
create policy "saved_requests_select_own"
  on public.saved_requests
  for select
  to authenticated
  using (
    auth.uid() = user_id
    and public.workspace_owned_by_user(workspace_id, auth.uid())
  );

drop policy if exists "saved_requests_insert_own" on public.saved_requests;
create policy "saved_requests_insert_own"
  on public.saved_requests
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.workspace_owned_by_user(workspace_id, auth.uid())
  );

drop policy if exists "saved_requests_update_own" on public.saved_requests;
create policy "saved_requests_update_own"
  on public.saved_requests
  for update
  to authenticated
  using (
    auth.uid() = user_id
    and public.workspace_owned_by_user(workspace_id, auth.uid())
  )
  with check (
    auth.uid() = user_id
    and public.workspace_owned_by_user(workspace_id, auth.uid())
  );

drop policy if exists "saved_requests_delete_own" on public.saved_requests;
create policy "saved_requests_delete_own"
  on public.saved_requests
  for delete
  to authenticated
  using (
    auth.uid() = user_id
    and public.workspace_owned_by_user(workspace_id, auth.uid())
  );

do $$
declare
  request_owner uuid;
  owner_workspace_id uuid;
  owner_environment_id uuid;
begin
  for request_owner in (select distinct user_id from public.saved_requests)
  loop
    select workspace.id
      into owner_workspace_id
    from public.workspaces workspace
    where workspace.user_id = request_owner
    order by workspace.created_at asc
    limit 1;

    if owner_workspace_id is null then
      insert into public.workspaces (user_id, name)
      values (request_owner, 'My Workspace')
      returning id into owner_workspace_id;

      insert into public.environments (workspace_id, name, is_default)
      values (owner_workspace_id, 'local', true)
      returning id into owner_environment_id;
    else
      select environment.id
        into owner_environment_id
      from public.environments environment
      where environment.workspace_id = owner_workspace_id
      order by environment.is_default desc, environment.created_at asc
      limit 1;

      if owner_environment_id is null then
        insert into public.environments (workspace_id, name, is_default)
        values (owner_workspace_id, 'local', true)
        returning id into owner_environment_id;
      end if;
    end if;

    update public.saved_requests
    set workspace_id = owner_workspace_id
    where user_id = request_owner
      and workspace_id is null;

    insert into public.user_settings (user_id, active_workspace_id, active_environment_id)
    values (request_owner, owner_workspace_id, owner_environment_id)
    on conflict (user_id)
    do update
      set active_workspace_id = coalesce(public.user_settings.active_workspace_id, excluded.active_workspace_id),
          active_environment_id = coalesce(public.user_settings.active_environment_id, excluded.active_environment_id);
  end loop;
end
$$;

alter table public.saved_requests
alter column workspace_id set not null;
