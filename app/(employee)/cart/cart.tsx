"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { type Cart, readCart, writeCart } from "@/lib/cart";
import { redeem } from "../../actions";
import { Spinner } from "../../icons";
import { Empty, Loading, pts, RewardImage } from "../../ui";

type R = { id: string; name: string; image_url: string | null; category: string | null; price_points: number; stock: number };

export function CartView({ uid, balance, catalog }: { uid: string; balance: number; catalog: R[] }) {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [key, setKey] = useState(""); // idempotency key: same key on retry, new key when the cart changes
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  useEffect(() => { setCart(readCart(uid)); setKey(crypto.randomUUID()); }, [uid]);
  if (!cart) return <Loading />;

  const lines = catalog.filter((r) => cart[r.id]).map((r) => ({ ...r, qty: cart[r.id] }));
  const total = lines.reduce((s, l) => s + l.qty * l.price_points, 0);
  const short = total - balance;
  const overStock = lines.some((l) => l.qty > l.stock);
  const setQty = (id: string, qty: number) => {
    const next = { ...cart };
    if (qty < 1) delete next[id]; else next[id] = qty;
    setCart(next); writeCart(uid, next); setKey(crypto.randomUUID()); setError("");
  };
  const checkout = () => {
    if (pending) return;
    start(async () => {
      const res = await redeem(lines.map((l) => ({ reward_id: l.id, quantity: l.qty })), key);
      if (res?.ok) { writeCart(uid, {}); router.push(`/orders?placed=${res.order}`); }
      else { setError(res?.error ?? "Something went wrong."); router.refresh(); } // refresh shows the latest stock
    });
  };

  if (!lines.length) return <Empty>Your cart is empty. <Link href="/rewards">Browse rewards</Link></Empty>;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
      <ul className="flex flex-col gap-4">
        {lines.map((l) => (
          <li key={l.id} className={`card flex flex-wrap items-center gap-4 p-4! ${l.qty > l.stock || error.startsWith(l.name) ? "border-danger/40!" : ""}`}>
            <div className="w-20 shrink-0 md:w-24"><RewardImage src={l.image_url} alt="" category={l.category} /></div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-navy">{l.name}</p>
              <p className="text-[13px] text-muted">{pts(l.price_points)} each</p>
              {l.qty > l.stock && <p className="text-[13px] text-danger">{l.stock ? `Only ${l.stock} in stock` : "Out of stock. Remove it to continue."}</p>}
              <button onClick={() => setQty(l.id, 0)} className="mt-1 min-h-8 cursor-pointer text-[13px] font-medium text-primary-700 hover:underline">Remove</button>
            </div>
            <div className="flex items-center gap-1 rounded-pill p-1 shadow-inset">
              <button aria-label={`Decrease ${l.name}`} onClick={() => setQty(l.id, l.qty - 1)} className="size-11 cursor-pointer rounded-full text-xl transition-shadow active:shadow-inset">−</button>
              <span aria-live="polite" className="w-6 text-center font-medium">{l.qty}</span>
              <button aria-label={`Increase ${l.name}`} disabled={l.qty >= Math.min(10, l.stock)} onClick={() => setQty(l.id, l.qty + 1)} className="size-11 cursor-pointer rounded-full text-xl transition-shadow active:shadow-inset disabled:cursor-not-allowed disabled:opacity-40">+</button>
            </div>
          </li>
        ))}
      </ul>
      <aside className="card flex flex-col gap-3 max-lg:sticky max-lg:bottom-24 max-lg:z-10">
        <div className="flex justify-between"><span className="text-muted">Total</span><b className={short > 0 ? "text-danger" : "text-navy"}>{pts(total)}</b></div>
        <div className="flex justify-between"><span className="text-muted">Your balance</span><span>{pts(balance)}</span></div>
        <div className="flex justify-between border-t border-edge pt-3"><span className="text-muted">Balance after</span><b>{short > 0 ? "—" : pts(balance - total)}</b></div>
        {short > 0 && <p className="text-sm text-danger">You need {pts(short)} more for this cart.</p>}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button onClick={checkout} disabled={pending || short > 0 || overStock} className="btn-primary">
          {pending ? <><Spinner />Redeeming…</> : `Redeem ${pts(total)}`}
        </button>
      </aside>
    </div>
  );
}
