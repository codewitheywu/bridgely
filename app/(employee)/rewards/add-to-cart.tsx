"use client";

import Link from "next/link";
import { useState } from "react";
import { readCart, writeCart } from "@/lib/cart";

export function AddToCart({ uid, id, stock }: { uid: string; id: string; stock: number }) {
  const [added, setAdded] = useState(false);
  if (stock < 1) return <button className="btn-soft" disabled>Out of stock</button>;
  const add = () => {
    const cart = readCart(uid);
    cart[id] = Math.min((cart[id] ?? 0) + 1, 10, stock);
    writeCart(uid, cart);
    setAdded(true);
  };
  return added
    ? <Link href="/cart" className="btn-soft">Added ✓ View cart</Link>
    : <button onClick={add} className="btn-primary">Add to cart</button>;
}
