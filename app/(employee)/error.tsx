"use client";

import { Icon } from "../icons";

export default function ErrorView({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div role="alert" className="card mx-auto flex w-full max-w-lg flex-col items-center gap-4 py-12! text-center">
      <span className="grid size-14 place-items-center rounded-full text-danger shadow-inset"><Icon name="x" className="size-6" /></span>
      <h1 className="text-xl font-semibold text-navy">Something went wrong</h1>
      <p className="text-muted">We couldn’t load this page. Check your connection and try again.</p>
      <button onClick={() => retry()} className="btn-primary">Try again</button>
    </div>
  );
}
