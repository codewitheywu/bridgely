"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Desktop: inline pills. Mobile: glass bottom tab bar. */
export function NavLinks({ links, mobile }: { links: string[][]; mobile?: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label="App" className={mobile ? "glass fixed inset-x-3 bottom-3 z-20 flex justify-around p-1.5 md:hidden" : "hidden gap-1 md:flex"}>
      {links.map(([label, href]) => {
        const on = path === href || (href.split("/").length > 2 && path.startsWith(href));
        return (
          <Link key={href} href={href} aria-current={on ? "page" : undefined}
            className={`grid min-h-11 place-items-center rounded-pill px-3 text-sm font-medium no-underline! md:px-4 ${on ? "text-primary-700! shadow-inset" : "text-ink!"}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
