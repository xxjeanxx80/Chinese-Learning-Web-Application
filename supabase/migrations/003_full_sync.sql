-- MikuHan — full progress sync (Phase C follow-up).
--
-- The whole learning state is a set of singleton blobs. custom_content
-- previously accepted only four kinds, so learned items, wrong answers and
-- the SRS schedule never reached the server. Widen the allow-list.

create or replace function public.apply_ops(p_ops jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.learning_items
    (user_id, kind, ref_id, status, srs_box, srs_due_at, wrong_count, deleted, updated_at)
  select
    auth.uid(),
    src.kind,
    src.ref_id,
    src.status,
    src.srs_box,
    src.srs_due_at,
    src.wrong_count,
    src.deleted,
    src.updated_at
  from (
    select distinct on (o->>'kind', o->>'ref_id')
      o->>'kind' as kind,
      o->>'ref_id' as ref_id,
      coalesce(o->>'status', 'learning') as status,
      coalesce((o->>'srs_box')::int, 0) as srs_box,
      nullif(o->>'srs_due_at', '')::timestamptz as srs_due_at,
      coalesce((o->>'wrong_count')::int, 0) as wrong_count,
      coalesce((o->>'deleted')::boolean, false) as deleted,
      coalesce(nullif(o->>'updated_at', '')::timestamptz, now()) as updated_at
    from jsonb_array_elements(p_ops) as o
    where o->>'target' = 'item'
      and o->>'kind' in ('vocab', 'sentence')
      and o->>'ref_id' is not null
      and length(o->>'ref_id') > 0
    order by o->>'kind', o->>'ref_id',
      coalesce(nullif(o->>'updated_at', '')::timestamptz, now()) desc
  ) as src
  on conflict (user_id, kind, ref_id) do update
    set status      = excluded.status,
        srs_box     = excluded.srs_box,
        srs_due_at  = excluded.srs_due_at,
        wrong_count = excluded.wrong_count,
        deleted     = excluded.deleted,
        updated_at  = excluded.updated_at
    where excluded.updated_at > learning_items.updated_at;

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

  insert into public.custom_content (user_id, kind, payload, updated_at)
  select
    auth.uid(),
    src.kind,
    src.payload,
    src.updated_at
  from (
    select distinct on (o->>'kind')
      o->>'kind' as kind,
      coalesce(o->'payload', '{}'::jsonb) as payload,
      coalesce(nullif(o->>'updated_at', '')::timestamptz, now()) as updated_at
    from jsonb_array_elements(p_ops) as o
    where o->>'target' = 'content'
      and o->>'kind' in (
        'custom_vocab', 'vocab_overrides', 'custom_sentences', 'statistics',
        'learned_vocab', 'learned_sentences', 'wrong_vocab', 'wrong_sentences',
        'srs_state', 'session_progress'
      )
    order by o->>'kind',
      coalesce(nullif(o->>'updated_at', '')::timestamptz, now()) desc
  ) as src
  on conflict (user_id, kind) do update
    set payload    = excluded.payload,
        updated_at = excluded.updated_at
    where excluded.updated_at > custom_content.updated_at;
end;
$$;

revoke all on function public.apply_ops(jsonb) from public;
grant execute on function public.apply_ops(jsonb) to authenticated;
