"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icons";

export type NavItem = [label: string, href: string, icon: IconName];

/** Desktop: vertical sidebar list. Mobile: icon tab bar pinned to the bottom. */
export function NavLinks({ links, mobile }: { links: NavItem[]; mobile?: boolean }) {
  const path = usePathname();
  const isOn = (href: string) => path === href || (href.split("/").length > 2 && path.startsWith(href));
  if (mobile) return (
    <nav aria-label="App" className="glass fixed inset-x-3 bottom-3 z-30 flex justify-around p-1.5 lg:hidden">
      {links.map(([label, href, icon]) => (
        <Link key={href} href={href} aria-current={isOn(href) ? "page" : undefined}
          className={`flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-[11px] font-medium no-underline! ${isOn(href) ? "text-primary-700! shadow-inset" : "text-muted!"}`}>
          <Icon name={icon} />{label}
        </Link>
      ))}
    </nav>
  );
  return (
    <nav aria-label="App" className="flex flex-col gap-1.5">
      {links.map(([label, href, icon]) => (
        <Link key={href} href={href} aria-current={isOn(href) ? "page" : undefined}
          className={`flex min-h-11 items-center gap-3 rounded-2xl px-4 font-medium no-underline! transition-shadow ${isOn(href) ? "text-primary-700! shadow-inset" : "text-ink! hover:shadow-raised"}`}>
          <Icon name={icon} />{label}
        </Link>
      ))}
    </nav>
  );
}
