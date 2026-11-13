"use client";

import { useState } from "react";
import { Icon } from "../../icons";
import { Empty, pts, RewardImage } from "../../ui";
import { AddToCart } from "./add-to-cart";

type R = { id: string; name: string; description: string; image_url: string | null; category: string | null; price_points: number; stock: number };

export function Catalog({ uid, balance, rewards }: { uid: string; balance: number; rewards: R[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const cats = ["All", ...new Set(rewards.flatMap((r) => (r.category ? [r.category] : [])))];
  const shown = rewards.filter((r) => (cat === "All" || r.category === cat) && `${r.name} ${r.description}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <label className="relative md:w-80">
          <span className="sr-only">Search rewards</span>
          <Icon name="search" className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search rewards" className="field pl-11" />
        </label>
        <div role="group" aria-label="Category" className="-m-4 flex gap-3 overflow-x-auto p-4">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} aria-pressed={c === cat}
              className={`min-h-11 shrink-0 cursor-pointer rounded-pill px-5 text-sm font-medium ${c === cat ? "text-primary-700 shadow-inset" : "text-ink shadow-raised"}`}>{c}</button>
          ))}
        </div>
      </div>
      {shown.length ? (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((r) => (
            <li key={r.id} className="card flex flex-col gap-3">
              <div className={r.stock < 1 ? "grayscale" : ""}><RewardImage src={r.image_url} alt={r.name} category={r.category} /></div>
              {r.category && <span className="text-[12px] font-semibold tracking-wider text-muted uppercase">{r.category}</span>}
              <h2 className="text-lg font-semibold text-navy">{r.name}</h2>
              <p className="line-clamp-2 text-muted">{r.description}</p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <span className="text-lg font-semibold text-primary-700">{pts(r.price_points)}</span>
                <span className={`text-[13px] font-medium ${r.stock < 1 ? "text-danger" : r.stock <= 3 ? "text-[#8A5A00]" : "text-muted"}`}>
                  {r.stock < 1 ? "Out of stock" : r.stock <= 3 ? `Only ${r.stock} left` : `${r.stock} in stock`}
                </span>
              </div>
              <AddToCart uid={uid} id={r.id} name={r.name} stock={r.stock} need={r.price_points - balance} />
            </li>
          ))}
        </ul>
      ) : <Empty>No rewards match your search.</Empty>}
    </>
  );
}
