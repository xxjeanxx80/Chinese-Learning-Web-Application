-- MikuHan — server-side streak computation (Phase D).
--
-- The streak is derived from study_events, so it survives device changes.
-- All day boundaries use the Vietnam timezone (Asia/Ho_Chi_Minh, UTC+7),
-- matching the local implementation in statisticsStorage.ts.
--
-- Events are written by apply_ops with target='event'. The `kind` column
-- carries the event kind; we treat any event on a day as "studied that day".

-- ============================================================
-- 1. Helper: current study day in Vietnam time
-- ============================================================
create or replace function public.study_day(ts timestamptz)
returns date
language sql
immutable
as $$
  select (ts at time zone 'Asia/Ho_Chi_Minh')::date;
$$;

-- ============================================================
-- 2. get_streak() — current and longest streak for the caller
-- ============================================================
create or replace function public.get_streak()
returns table (
  current_streak int,
  longest_streak int,
  last_study_day date,
  total_days int
)
language plpgsql
security invoker
stable
set search_path = public
as $$
declare
  v_days date[];
  v_today date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_cur int := 0;
  v_long int := 0;
  v_run int := 0;
  v_prev date := null;
  v_last date := null;
  v_total int := 0;
  d date;
  i int;
begin
  select array_agg(distinct study_day(e.ts) order by study_day(e.ts))
    into v_days
    from public.study_events e
   where e.user_id = auth.uid()
     and e.ts >= now() - interval '2 years';

  if v_days is null then
    return query select 0, 0, null::date, 0;
    return;
  end if;

  v_total := array_length(v_days, 1);
  v_last := v_days[array_length(v_days, 1)];

  -- Longest streak: walk consecutive days.
  foreach d in array v_days loop
    if v_prev is not null and d = v_prev + 1 then
      v_run := v_run + 1;
    else
      v_run := 1;
    end if;
    if v_run > v_long then
      v_long := v_run;
    end if;
    v_prev := d;
  end loop;

  -- Current streak: count back from today (or yesterday, if today has no
  -- activity yet but yesterday did — the streak is still alive).
  -- Postgres FOR ... REVERSE lo..hi never runs when lo < hi.
  -- Walk backward with a WHILE instead.
  if v_last = v_today or v_last = v_today - 1 then
    v_cur := 1;
    i := array_length(v_days, 1) - 1;
    while i >= 1 loop
      exit when v_days[i] <> v_days[i + 1] - 1;
      v_cur := v_cur + 1;
      i := i - 1;
    end loop;
  end if;

  return query select v_cur, v_long, v_last, v_total;
end;
$$;

revoke all on function public.get_streak() from public;
grant execute on function public.get_streak() to authenticated;

-- ============================================================
-- 3. study_day_summary() — per-day counts for the stats dashboard
-- ============================================================
create or replace function public.study_day_summary()
returns table (
  day date,
  attempts int,
  correct int,
  duration_ms bigint
)
language sql
security invoker
stable
set search_path = public
as $$
  select
    study_day(e.ts) as day,
    count(*)::int as attempts,
    count(*) filter (where e.correct)::int as correct,
    coalesce(sum(e.duration_ms), 0)::bigint as duration_ms
  from public.study_events e
  where e.user_id = auth.uid()
    and e.ts >= now() - interval '365 days'
  group by study_day(e.ts)
  order by day desc;
$$;

revoke all on function public.study_day_summary() from public;
grant execute on function public.study_day_summary() to authenticated;
