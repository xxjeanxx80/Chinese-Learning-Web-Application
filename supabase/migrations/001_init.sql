-- MikuHan — schema for local-first delta sync (Supabase / Southeast Asia Singapore)
-- Phase C1. Applied via `supabase db push`.

-- ============================================================
-- 1. learning_items — per-item state, Last-Write-Wins
-- ============================================================
create table if not exists public.learning_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('vocab', 'sentence')),
  ref_id      text not null,
  status      text not null default 'learning'
              check (status in ('learning', 'learning_new', 'learning_known', 'review', 'mastered')),
  srs_box     int  not null default 0 check (srs_box >= 0),
  srs_due_at  timestamptz,
  wrong_count int  not null default 0 check (wrong_count >= 0),
  deleted     boolean not null default false,
  updated_at  timestamptz not null default now(),
  unique (user_id, kind, ref_id)
);

create index if not exists learning_items_user_updated_idx
  on public.learning_items (user_id, updated_at);

-- ============================================================
-- 2. study_events — append-only analytics feed
-- ============================================================
create table if not exists public.study_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  ts          timestamptz not null default now(),
  kind        text not null,
  level       text,
  correct     boolean,
  duration_ms int,
  meta        jsonb
);

create index if not exists study_events_user_ts_idx
  on public.study_events (user_id, ts);

-- ============================================================
-- 3. custom_content — user-authored vocab / sentences (LWW)
-- ============================================================
create table if not exists public.custom_content (
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null,
  payload    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind)
);

-- ============================================================
-- 4. user_settings — key/value prefs
-- ============================================================
create table if not exists public.user_settings (
  user_id    uuid not null references auth.users(id) on delete cascade,
  key        text not null,
  value      jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- ============================================================
-- 5. Row Level Security — the actual access control layer.
--    Anon key in the browser is safe because Postgres rejects
--    any row that is not owned by auth.uid().
-- ============================================================
alter table public.learning_items  enable row level security;
alter table public.study_events    enable row level security;
alter table public.custom_content enable row level security;
alter table public.user_settings   enable row level security;

drop policy if exists "own rows" on public.learning_items;
create policy "own rows" on public.learning_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.study_events;
create policy "own rows" on public.study_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.custom_content;
create policy "own rows" on public.custom_content
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.user_settings;
create policy "own rows" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 6. apply_ops — idempotent batch upsert with LWW conflict
--    resolution. Client sends ops; each op carries op_id so a
--    retried batch does not double-apply.
-- ============================================================
create or replace function public.apply_ops(p_ops jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- learning_items: LWW by updated_at
  -- op shape: { target:'item', kind:'vocab'|'sentence', ref_id, status, ... }
  insert into public.learning_items
    (user_id, kind, ref_id, status, srs_box, srs_due_at, wrong_count, deleted, updated_at)
  select
    auth.uid(),
    o->>'kind',
    o->>'ref_id',
    coalesce(o->>'status', 'learning'),
    coalesce((o->>'srs_box')::int, 0),
    nullif(o->>'srs_due_at', '')::timestamptz,
    coalesce((o->>'wrong_count')::int, 0),
    coalesce((o->>'deleted')::boolean, false),
    coalesce(nullif(o->>'updated_at', '')::timestamptz, now())
  from jsonb_array_elements(p_ops) as o
  where o->>'target' = 'item'
    and o->>'kind' in ('vocab', 'sentence')
    and o->>'ref_id' is not null
    and length(o->>'ref_id') > 0
  on conflict (user_id, kind, ref_id) do update
    set status      = excluded.status,
        srs_box     = excluded.srs_box,
        srs_due_at  = excluded.srs_due_at,
        wrong_count = excluded.wrong_count,
        deleted     = excluded.deleted,
        updated_at  = excluded.updated_at
    where excluded.updated_at > learning_items.updated_at;

  -- study_events: append-only, deduped by client-provided id
  -- op shape: { target:'event', id, ts, kind, level, correct, duration_ms, meta }
  insert into public.study_events (id, user_id, ts, kind, level, correct, duration_ms, meta)
  select
    coalesce(nullif(o->>'id', '')::uuid, gen_random_uuid()),
    auth.uid(),
    coalesce(nullif(o->>'ts', '')::timestamptz, now()),
    o->>'kind',
    o->>'level',
    (o->>'correct')::boolean,
    (o->>'duration_ms')::int,
    o->'meta'
  from jsonb_array_elements(p_ops) as o
  where o->>'target' = 'event'
    and o->>'id' is not null
    and length(o->>'id') > 0
  on conflict (id) do nothing;

  -- custom_content: LWW per (user_id, kind)
  -- op shape: { target:'content', kind, payload, updated_at }
  insert into public.custom_content (user_id, kind, payload, updated_at)
  select
    auth.uid(),
    o->>'kind',
    coalesce(o->'payload', '{}'::jsonb),
    coalesce(nullif(o->>'updated_at', '')::timestamptz, now())
  from jsonb_array_elements(p_ops) as o
  where o->>'target' = 'content'
    and o->>'kind' in ('custom_vocab', 'vocab_overrides', 'custom_sentences', 'statistics')
  on conflict (user_id, kind) do update
    set payload    = excluded.payload,
        updated_at = excluded.updated_at
    where excluded.updated_at > custom_content.updated_at;
end;
$$;

revoke all on function public.apply_ops(jsonb) from public;
grant execute on function public.apply_ops(jsonb) to authenticated;
