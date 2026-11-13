import Link from "next/link";
import { Logo } from "./ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <Logo />
      <div className="card flex w-full flex-col items-center gap-4 py-12!">
        <p className="text-5xl font-semibold text-primary">404</p>
        <h1 className="text-xl font-semibold text-navy">Page not found</h1>
        <p className="text-muted">The page you’re looking for doesn’t exist or has moved.</p>
        <Link href="/dashboard" className="btn-primary">Go to my dashboard</Link>
      </div>
    </main>
  );
}
