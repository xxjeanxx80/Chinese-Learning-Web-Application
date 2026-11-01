/**
 * Pomodoro timer.
 *
 * Defaults: 25 min focus, 5 min break, and a 40 min long break after every
 * 4th focus round. Durations are editable and remembered in localStorage.
 *
 * The background track the user asked for is a copyrighted YouTube upload.
 * Browsers cannot play a YouTube watch URL as audio, and downloading it would
 * copy the recording, so the timer uses a short chime generated locally
 * instead of that track.
 */

import { useEffect, useRef, useState } from 'react';
import { IconSettings } from '../Icons/Icons';
import './Pomodoro.css';

const FOCUS_S = 25 * 60;
const BREAK_S = 5 * 60;
const LONG_BREAK_S = 40 * 60;
const ROUNDS_BEFORE_LONG = 4;
const PREFS_KEY = 'mikuhan_pomodoro';

type Phase = 'focus' | 'break' | 'long';

interface Prefs {
  focusMin: number;
  breakMin: number;
  longBreakMin: number;
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
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Pomodoro() {
  const prefs = useRef<Prefs>(loadPrefs());
  const [phase, setPhase] = useState<Phase>('focus');
  const [round, setRound] = useState(1);
  const [remaining, setRemaining] = useState(prefs.current.focusMin * 60);
  const [running, setRunning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Prefs>(prefs.current);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r > 1) return r - 1;
        advance();
        return 0;
      });
    }, 1000);
    return () => clearInterval(id);
    // advance reads current phase/round; restarting the interval on change is intended
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, round]);

  function secondsFor(next: Phase, p: Prefs = prefs.current): number {
    if (next === 'focus') return p.focusMin * 60;
    if (next === 'break') return p.breakMin * 60;
    return p.longBreakMin * 60;
  }

  function advance() {
    chime();
    if (phase === 'focus') {
      const next: Phase = round % ROUNDS_BEFORE_LONG === 0 ? 'long' : 'break';
      setPhase(next);
      setRemaining(secondsFor(next));
      return;
    }
    setRound(phase === 'long' ? 1 : round + 1);
    setPhase('focus');
    setRemaining(secondsFor('focus'));
  }

  function reset() {
    setRunning(false);
    setPhase('focus');
    setRound(1);
    setRemaining(prefs.current.focusMin * 60);
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
    if (!running && phase === 'focus' && round === 1) setRemaining(next.focusMin * 60);
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
        <div style={{ width: `${Math.max(0, (remaining / total) * 100)}%` }} />
      </div>

      <div className="pomo-actions">
        <button className="pomo-start" onClick={() => setRunning((v) => !v)}>
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

      <p className="pomo-note">
        Mặc định {FOCUS_S / 60}/{BREAK_S / 60} phút, nghỉ {LONG_BREAK_S / 60} phút mỗi {ROUNDS_BEFORE_LONG} vòng.
        Nhạc YouTube không phát được trong app — hết giờ có tiếng chuông.
      </p>
    </div>
  );
}
