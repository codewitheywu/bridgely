import { AppShell } from "../ui";

const links = [["Overview", "/admin"], ["Rewards", "/admin/rewards"], ["Orders", "/admin/orders"]];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell links={links}>{children}</AppShell>;
}
