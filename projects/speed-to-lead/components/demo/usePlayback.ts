"use client";

import { useEffect, useRef, useState } from "react";
import type { Replay } from "./types";

/** Timeline of one replay: for each turn, lead message → agent typing → trace events → reply. */
export type Frame = { turn: number; leadShown: boolean; typing: boolean; traceShown: number; replyShown: boolean };
export function usePlayback(replays: Replay[], playing: boolean, speed = 1) {
  const [index, setIndex] = useState(0);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [done, setDone] = useState(false);
  // which replay the frames belong to: on a switch, the first render must not use the old replay's frames
  const [owner, setOwner] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    const r = replays[index];
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setOwner(index);
    if (reduce) { setFrames(r.turns.map((t, i) => ({ turn: i, leadShown: true, typing: false, traceShown: t.trace.length, replyShown: true }))); setDone(true); return; }
    setFrames([]); setDone(false);
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms / speed));
    const patch = (i: number, p: Partial<Frame>) => setFrames((fs) => fs.map((f, k) => (k === i ? { ...f, ...p } : f)));
    let t = 600;
    r.turns.forEach((turn, i) => {
      at(t, () => setFrames((fs) => [...fs, { turn: i, leadShown: true, typing: false, traceShown: 0, replyShown: false }]));
      t += 700; at(t, () => patch(i, { typing: true }));
      turn.trace.forEach((_, k) => { t += 650; at(t, () => patch(i, { traceShown: k + 1 })); });
      t += 800; at(t, () => patch(i, { typing: false, replyShown: true }));
      t += 1600;
    });
    at(t, () => setDone(true));
    if (playing) at(t + 5000, () => setIndex((x) => (x + 1) % replays.length));
    return () => timers.current.forEach(clearTimeout);
  }, [index, playing, replays, speed]);

  return { replay: replays[index], frames: owner === index ? frames : [], done: owner === index && done, index, setIndex };
}
