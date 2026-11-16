"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icons";
import { Star } from "./ui";

/** [data-tour target, what to say about it] */
export type TourStep = [target: string, text: string];
type Box = { top: number; left: number; width: number; height: number };

const PAD = 8, W = 360;
const noop = () => () => {};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));

/**
 * "Show me around": a pointer and a popover glide to each [data-tour] element, with the
 * rest of the page dimmed. A target can exist twice (sidebar vs. phone tab bar): the visible one wins.
 * Esc or Skip ends it. Reduced motion: it jumps instead of gliding.
 */
export function ShowMeAround({ steps, label }: { steps: TourStep[]; label: string }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const [i, setI] = useState<number | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [vp, setVp] = useState({ w: 1280, h: 800 });
  const [cardH, setCardH] = useState(220);
  const card = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const step = i === null ? null : steps[i];

  const close = useCallback(() => { setI(null); setBox(null); opener.current?.focus(); }, []);

  useEffect(() => {
    if (!step) return;
    const el = [...document.querySelectorAll<HTMLElement>(`[data-tour="${step[0]}"]`)].find((n) => n.getClientRects().length > 0);
    el?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    let f = 0;
    const measure = () => {
      cancelAnimationFrame(f);
      f = requestAnimationFrame(() => {
        const r = el?.getBoundingClientRect();
        setVp({ w: innerWidth, h: innerHeight });
        setBox(r ? { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 } : null);
        if (card.current) setCardH(card.current.offsetHeight);
      });
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    measure();
    addEventListener("resize", measure);
    addEventListener("scroll", measure, { passive: true, capture: true });
    addEventListener("keydown", onKey);
    next.current?.focus({ preventScroll: true });
    return () => {
      cancelAnimationFrame(f);
      removeEventListener("resize", measure);
      removeEventListener("scroll", measure, { capture: true });
      removeEventListener("keydown", onKey);
    };
  }, [step, close]);

  const trigger = <button ref={opener} type="button" onClick={() => setI(0)} className="btn-soft"><Icon name="sparkle" />Show me around</button>;
  if (!mounted || i === null || !step) return trigger;

  // Pointer sits under the target (or above it when there's more room); the card hangs off the
  // pointer and is clamped on screen, so its buttons are always reachable.
  const w = Math.min(W, vp.w - 24);
  const t = box ?? { top: vp.h / 2 - 40, left: vp.w / 2 - 60, width: 120, height: 80 };
  const below = vp.h - (t.top + t.height);
  const above = below < cardH + 40 && t.top > below;
  const tipX = clamp(t.left + Math.min(t.width * 0.5, 160), 12, vp.w - 40);
  const tipY = clamp(above ? t.top - 4 : t.top + t.height + 4, 40, vp.h - 40);
  const top = clamp(above ? tipY - 28 - cardH : tipY + 28, 12, Math.max(12, vp.h - cardH - 12));
  const left = clamp(tipX - 24, 12, vp.w - w - 12);
  const last = i === steps.length - 1;

  return (
    <>
      {trigger}
      {createPortal(
        <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-50">
          {box ? <div aria-hidden="true" className="tour-spot" style={box} /> : <div aria-hidden="true" className="fixed inset-0 bg-navy/45" />}
          <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" className="tour-move pointer-events-none fixed drop-shadow-md"
            style={{ top: tipY, left: tipX, transform: above ? "translate(-3px, -100%) scaleY(-1)" : "translate(-3px, -2px)" }}>
            <path d="M4 2.5 19 9.6l-6.6 1.9-2.9 6.9L4 2.5Z" fill="#fff" stroke="#C2501C" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          <div ref={card} className="tour-move fixed rounded-[22px] border border-white bg-white p-4 shadow-[0_20px_50px_rgb(28_35_75/0.3)]" style={{ top, left, width: w }}>
            <div className="flex items-center gap-2 text-[13px] text-muted">
              <span className="grid size-7 place-items-center rounded-full bg-base shadow-raised"><Star className="size-4 text-primary" /></span>
              <span className="font-medium">TB Rewards</span>
              <span className="ml-auto">{i + 1} of {steps.length}</span>
            </div>
            <p key={i} aria-live="polite" className="page-in mt-3 text-[17px] leading-relaxed text-ink">{step[1]}</p>
            <div aria-hidden="true" className="mt-3 flex gap-1.5">
              {steps.map(([id], j) => <span key={id} className={`h-1.5 rounded-full transition-all duration-300 ${j === i ? "w-5 bg-primary-600" : "w-1.5 bg-edge"}`} />)}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button type="button" onClick={close} className="btn min-h-11! px-3 text-muted! hover:text-primary-700!">Skip</button>
              {i > 0 && <button type="button" onClick={() => setI(i - 1)} className="btn-soft ml-auto min-h-11! px-5">Back</button>}
              <button ref={next} type="button" onClick={() => (last ? close() : setI(i + 1))} className={`btn-primary min-h-11! px-5 ${i > 0 ? "" : "ml-auto"}`}>
                {last ? "Got it!" : <>Next<Icon name="next" className="size-4" /></>}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
