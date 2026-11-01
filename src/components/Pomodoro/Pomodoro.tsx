/**
 * Pomodoro timer.
 *
 * Defaults: 25 min focus, 5 min break, and a 40 min long break after every
 * 4th focus round. Durations are editable and remembered in localStorage.
 *
 * The countdown is anchored to a wall-clock end time, so closing the panel
 * or the tab does not freeze it: reopening shows the time that actually
 * passed. While a focus round runs, public/music.mp3 loops in the background.
 */

import { useEffect, useRef, useState } from 'react';
import { IconSettings } from '../Icons/Icons';
import './Pomodoro.css';

const ROUNDS_BEFORE_LONG = 4;
const PREFS_KEY = 'mikuhan_pomodoro';
const RUN_KEY = 'mikuhan_pomodoro_run';
const MUSIC_SRC = '/music.mp3';

type Phase = 'focus' | 'break' | 'long';

interface Prefs {
  focusMin: number;
  breakMin: number;
  longBreakMin: number;
}

interface RunState {
  phase: Phase;
  round: number;
  /** Epoch ms when the current phase ends. Absent when paused. */
  endsAt: number | null;
  /** Seconds left when paused. */
  remaining: number;
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        focusMin: clamp(p.focusMin, 1, 120, 25),
        breakMin: clamp(p.breakMin, 1, 60, 5),
        longBreakMin: clamp(p.longBreakMin, 1, 120, 40),
      };
    }
  } catch {
    /* keep defaults */
  }
  return { focusMin: 25, breakMin: 5, longBreakMin: 40 };
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function loadRun(prefs: Prefs): RunState {
  try {
    const raw = localStorage.getItem(RUN_KEY);
    if (raw) {
      const r = JSON.parse(raw) as Partial<RunState>;
      const phase: Phase = r.phase === 'break' || r.phase === 'long' ? r.phase : 'focus';
      const round = clamp(r.round, 1, 99, 1);
      const endsAt = typeof r.endsAt === 'number' ? r.endsAt : null;
      const remaining = clamp(r.remaining, 0, 24 * 60 * 60, prefs.focusMin * 60);
      return { phase, round, endsAt, remaining };
    }
  } catch {
    /* start fresh */
  }
  return { phase: 'focus', round: 1, endsAt: null, remaining: prefs.focusMin * 60 };
}

function chime() {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const now = ctx.currentTime;
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const start = now + i * 0.18;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
    osc.start(start);
    osc.stop(start + 0.55);
  });
  setTimeout(() => void ctx.close(), 1500);
}

function format(total: number): string {
  const safe = Math.max(0, total);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Pomodoro() {
  const prefs = useRef<Prefs>(loadPrefs());
  const initial = useRef<RunState>(loadRun(prefs.current));
  const [phase, setPhase] = useState<Phase>(initial.current.phase);
  const [round, setRound] = useState(initial.current.round);
  const [endsAt, setEndsAt] = useState<number | null>(initial.current.endsAt);
  const [remaining, setRemaining] = useState(initial.current.remaining);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Prefs>(prefs.current);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const running = endsAt !== null;

  function secondsFor(next: Phase, p: Prefs = prefs.current): number {
    if (next === 'focus') return p.focusMin * 60;
    if (next === 'break') return p.breakMin * 60;
    return p.longBreakMin * 60;
  }

  function persist(next: RunState) {
    localStorage.setItem(RUN_KEY, JSON.stringify(next));
  }

  // One audio element for the life of the panel. It only plays during focus.
  useEffect(() => {
    const audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audio.preload = 'none';
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (running && phase === 'focus') {
      void audio.play().catch(() => {
        /* autoplay blocked until the next click; the button click usually unlocks it */
      });
    } else {
      audio.pause();
    }
  }, [running, phase]);

  // Recompute from the wall clock once a second, and immediately on return
  // to the tab, so the displayed time tracks real time instead of ticks.
  useEffect(() => {
    if (endsAt === null) return;
    const tick = () => {
      const left = Math.round((endsAt - Date.now()) / 1000);
      if (left > 0) {
        setRemaining(left);
        return;
      }
      // The phase ended while we were away: step through every elapsed phase.
      let cursor = endsAt;
      let nextPhase: Phase = phase;
      let nextRound = round;
      let guard = 0;
      while (cursor <= Date.now() && guard < 500) {
        guard += 1;
        if (nextPhase === 'focus') {
          nextPhase = nextRound % ROUNDS_BEFORE_LONG === 0 ? 'long' : 'break';
        } else {
          nextRound = nextPhase === 'long' ? 1 : nextRound + 1;
          nextPhase = 'focus';
        }
        cursor += secondsFor(nextPhase) * 1000;
      }
      chime();
      const leftAfter = Math.max(1, Math.round((cursor - Date.now()) / 1000));
      setPhase(nextPhase);
      setRound(nextRound);
      setEndsAt(cursor);
      setRemaining(leftAfter);
      persist({ phase: nextPhase, round: nextRound, endsAt: cursor, remaining: leftAfter });
    };
    tick();
    const id = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
    // secondsFor only depends on prefs, which are stable between edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt, phase, round]);

  function start() {
    const end = Date.now() + remaining * 1000;
    setEndsAt(end);
    persist({ phase, round, endsAt: end, remaining });
  }

  function pause() {
    const left = endsAt === null ? remaining : Math.max(1, Math.round((endsAt - Date.now()) / 1000));
    setEndsAt(null);
    setRemaining(left);
    persist({ phase, round, endsAt: null, remaining: left });
  }

  function reset() {
    const fresh = prefs.current.focusMin * 60;
    setEndsAt(null);
    setPhase('focus');
    setRound(1);
    setRemaining(fresh);
    localStorage.removeItem(RUN_KEY);
    const audio = audioRef.current;
    if (audio) audio.currentTime = 0;
  }

  function savePrefs() {
    const next: Prefs = {
      focusMin: clamp(draft.focusMin, 1, 120, 25),
      breakMin: clamp(draft.breakMin, 1, 60, 5),
      longBreakMin: clamp(draft.longBreakMin, 1, 120, 40),
    };
    prefs.current = next;
    setDraft(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    setEditing(false);
    if (!running && phase === 'focus' && round === 1) {
      const fresh = next.focusMin * 60;
      setRemaining(fresh);
      persist({ phase, round, endsAt: null, remaining: fresh });
    }
  }

  const total = secondsFor(phase);
  const label = phase === 'focus' ? `Học · vòng ${round}` : phase === 'break' ? 'Nghỉ' : 'Nghỉ dài';

  return (
    <div className="pomo">
      <div className="pomo-head">
        <span className={`pomo-phase pomo-${phase}`}>{label}</span>
        <button className="pomo-gear" onClick={() => setEditing((v) => !v)} title="Chỉnh thời lượng">
          <IconSettings />
        </button>
      </div>

      <div className="pomo-time">{format(remaining)}</div>
      <div className="pomo-bar">
        <div style={{ width: `${Math.min(100, Math.max(0, (remaining / total) * 100))}%` }} />
      </div>

      <div className="pomo-actions">
        <button className="pomo-start" onClick={running ? pause : start}>
          {running ? 'Tạm dừng' : 'Bắt đầu'}
        </button>
        <button className="pomo-reset" onClick={reset}>Đặt lại</button>
      </div>

      {editing && (
        <div className="pomo-edit">
          <label>
            Học (phút)
            <input type="number" min={1} max={120} value={draft.focusMin}
              onChange={(e) => setDraft({ ...draft, focusMin: Number(e.target.value) })} />
          </label>
          <label>
            Nghỉ (phút)
            <input type="number" min={1} max={60} value={draft.breakMin}
              onChange={(e) => setDraft({ ...draft, breakMin: Number(e.target.value) })} />
          </label>
          <label>
            Nghỉ dài sau {ROUNDS_BEFORE_LONG} vòng (phút)
            <input type="number" min={1} max={120} value={draft.longBreakMin}
              onChange={(e) => setDraft({ ...draft, longBreakMin: Number(e.target.value) })} />
          </label>
          <button className="pomo-start" onClick={savePrefs}>Lưu</button>
        </div>
      )}
    </div>
  );
}
