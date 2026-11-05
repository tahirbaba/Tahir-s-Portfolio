"use client";

import { useEffect, useRef, useState } from "react";
import type { Replay } from "./types";

export type ReplayView = {
  replay: Replay;
  customerTyping: boolean;
  showCustomer: boolean;
  agentTyping: boolean;
  traceShown: number; // how many trace events are visible
  showReply: boolean;
  done: boolean;
};

/** Plays a list of replays as a timed sequence. `index` jumps; `playing` pauses auto-advance. */
export function useReplay(replays: Replay[], opts: { start?: number; playing?: boolean; speed?: number } = {}) {
  const [index, setIndex] = useState(opts.start ?? 0);
  const [phase, setPhase] = useState({ customerTyping: true, showCustomer: false, agentTyping: false, traceShown: 0, showReply: false, done: false });
  const playing = opts.playing ?? true;
  const speed = opts.speed ?? 1;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const r = replays[index];
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setPhase({ customerTyping: false, showCustomer: true, agentTyping: false, traceShown: r.trace.length, showReply: true, done: true }); return; }
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms / speed));
    setPhase({ customerTyping: true, showCustomer: false, agentTyping: false, traceShown: 0, showReply: false, done: false });
    let t = 900;
    at(t, () => setPhase((p) => ({ ...p, customerTyping: false, showCustomer: true })));
    t += 500;
    at(t, () => setPhase((p) => ({ ...p, agentTyping: true })));
    r.trace.forEach((_, i) => { t += 750; at(t, () => setPhase((p) => ({ ...p, traceShown: i + 1 }))); });
    t += 900;
    at(t, () => setPhase((p) => ({ ...p, agentTyping: false, showReply: true, done: true })));
    if (playing) { t += 5200; at(t, () => setIndex((i) => (i + 1) % replays.length)); }
    return () => timers.current.forEach(clearTimeout);
  }, [index, playing, replays, speed]);

  const view: ReplayView = { replay: replays[index], ...phase };
  return { view, index, setIndex };
}
