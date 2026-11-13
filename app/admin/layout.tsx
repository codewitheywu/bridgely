import type { NavItem } from "../nav";
import { AppShell } from "../shell";

const links: NavItem[] = [["Overview", "/admin", "grid"], ["Employees", "/admin/employees", "users"], ["Rewards", "/admin/rewards", "gift"], ["Orders", "/admin/orders", "orders"], ["Requests", "/admin/requests", "inbox"]];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell links={links}>{children}</AppShell>;
}
