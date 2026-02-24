alter table public.saved_requests
add column if not exists tags jsonb not null default '[]'::jsonb;

create index if not exists saved_requests_tags_idx
  on public.saved_requests
  using gin (tags);
