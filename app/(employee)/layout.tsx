import { AppShell } from "../ui";

const links = [["Home", "/dashboard"], ["Rewards", "/rewards"], ["Cart", "/cart"], ["Orders", "/orders"], ["Points", "/points"]];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <AppShell links={links}>{children}</AppShell>;
}
