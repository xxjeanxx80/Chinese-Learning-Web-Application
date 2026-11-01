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
    o->>'kind',
    coalesce(o->'payload', '{}'::jsonb),
    coalesce(nullif(o->>'updated_at', '')::timestamptz, now())
  from jsonb_array_elements(p_ops) as o
  where o->>'target' = 'content'
    and o->>'kind' in (
      'custom_vocab', 'vocab_overrides', 'custom_sentences', 'statistics',
      'learned_vocab', 'learned_sentences', 'wrong_vocab', 'wrong_sentences',
      'srs_state'
    )
  on conflict (user_id, kind) do update
    set payload    = excluded.payload,
        updated_at = excluded.updated_at
    where excluded.updated_at > custom_content.updated_at;
end;
$$;

revoke all on function public.apply_ops(jsonb) from public;
grant execute on function public.apply_ops(jsonb) to authenticated;
