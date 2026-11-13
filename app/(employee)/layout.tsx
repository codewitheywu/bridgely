import type { NavItem } from "../nav";
import { AppShell } from "../shell";

const links: NavItem[] = [["Home", "/dashboard", "home"], ["Rewards", "/rewards", "gift"], ["Cart", "/cart", "cart"], ["Orders", "/orders", "orders"], ["Points", "/points", "star"]];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <AppShell links={links}>{children}</AppShell>;
}
