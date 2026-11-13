"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icons";

type Toast = { id: number; msg: string; tone: "success" | "error" };

/** Fire-and-forget: works even if the caller unmounts right after (e.g. after a refresh). */
export function toast(msg: string, tone: Toast["tone"] = "success") {
  window.dispatchEvent(new CustomEvent("toast", { detail: { msg, tone } }));
}

/** Top-right on desktop, above the tab bar on mobile. Auto-dismisses after 4s. */
export function Toaster() {
  const [list, setList] = useState<Toast[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const t = { id: Date.now() + Math.random(), ...(e as CustomEvent<Omit<Toast, "id">>).detail };
      setList((l) => [...l.slice(-2), t]);
      setTimeout(() => setList((l) => l.filter((x) => x.id !== t.id)), 4000);
    };
    window.addEventListener("toast", on);
    return () => window.removeEventListener("toast", on);
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex flex-col items-center gap-2 lg:inset-x-auto lg:top-6 lg:right-6 lg:bottom-auto lg:items-end">
      {list.map((t) => (
        <div key={t.id} role={t.tone === "error" ? "alert" : "status"}
          className={`glass toast-in pointer-events-auto flex max-w-sm items-center gap-3 px-5 py-3.5 font-medium shadow-raised ${t.tone === "error" ? "text-danger" : "text-success"}`}>
          <Icon name={t.tone === "error" ? "x" : "check"} />{t.msg}
        </div>
      ))}
    </div>
  );
}
