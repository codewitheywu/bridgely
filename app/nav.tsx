"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { cartCount, setCartUser, subscribeCart } from "@/lib/cart";
import { Icon, type IconName, Spinner } from "./icons";

export type NavItem = [label: string, href: string, icon: IconName];

function CartBadge() {
  const n = useSyncExternalStore(subscribeCart, cartCount, () => 0);
  if (!n) return null;
  return <span key={n} aria-label={`${n} in cart`} className="pop absolute -top-1 right-0 grid min-w-5 place-items-center rounded-full bg-primary-600 px-1 text-[11px] leading-5 font-semibold text-white lg:static lg:ml-auto">{n}</span>;
}

/** Icon that turns into a spinner while its link's page is loading. */
function NavIcon({ icon }: { icon: IconName }) {
  const { pending } = useLinkStatus();
  return pending ? <Spinner /> : <Icon name={icon} />;
}

/** Tells the nav badge whose cart to count (rendered once per signed-in employee page). */
export function CartUser({ uid }: { uid: string }) {
  useEffect(() => setCartUser(uid), [uid]);
  return null;
}

/** Desktop: vertical sidebar list. Mobile: icon tab bar pinned to the bottom. */
export function NavLinks({ links, mobile }: { links: NavItem[]; mobile?: boolean }) {
  const path = usePathname();
  const isOn = (href: string) => path === href || (href.split("/").length > 2 && path.startsWith(href));
  if (mobile) return (
    <nav aria-label="App" className="glass fixed inset-x-3 bottom-3 z-30 flex justify-around p-1.5 lg:hidden">
      {links.map(([label, href, icon]) => (
        <Link key={href} href={href} aria-current={isOn(href) ? "page" : undefined}
          className={`relative flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-[11px] font-medium no-underline! transition-shadow ${isOn(href) ? "text-primary-700! shadow-inset" : "text-muted!"}`}>
          <NavIcon icon={icon} />{label}{href === "/cart" && <CartBadge />}
        </Link>
      ))}
    </nav>
  );
  return (
    <nav aria-label="App" className="flex flex-col gap-1.5">
      {links.map(([label, href, icon]) => (
        <Link key={href} href={href} aria-current={isOn(href) ? "page" : undefined}
          className={`flex min-h-11 items-center gap-3 rounded-2xl px-4 font-medium no-underline! transition-shadow duration-200 active:shadow-inset ${isOn(href) ? "text-primary-700! shadow-inset" : "text-ink! hover:shadow-raised"}`}>
          <NavIcon icon={icon} />{label}{href === "/cart" && <CartBadge />}
        </Link>
      ))}
    </nav>
  );
}
