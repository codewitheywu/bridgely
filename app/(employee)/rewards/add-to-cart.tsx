"use client";

import Link from "next/link";
import { useState } from "react";
import { readCart, writeCart } from "@/lib/cart";
import { Icon } from "../../icons";
import { toast } from "../../toast";
import { pts } from "../../ui";

export function AddToCart({ uid, id, name, stock, need }: { uid: string; id: string; name: string; stock: number; need: number }) {
  const [inCart, setInCart] = useState(0);
  if (stock < 1) return <button className="btn-soft" disabled>Out of stock</button>;
  if (need > 0) return <button className="btn-soft" disabled>Need {pts(need)} more</button>;
  const add = () => {
    const cart = readCart(uid);
    const qty = Math.min((cart[id] ?? 0) + 1, 10, stock);
    if (qty === cart[id]) return toast(`You can’t add more ${name}.`, "error");
    cart[id] = qty;
    writeCart(uid, cart);
    setInCart(qty);
    toast(`${name} added to cart`);
  };
  return (
    <div className="flex gap-3">
      <button onClick={add} className="btn-primary flex-1">{inCart ? <><Icon name="check" />Add another</> : "Add to cart"}</button>
      {inCart > 0 && <Link href="/cart" className="btn-soft px-5">Cart</Link>}
    </div>
  );
}
