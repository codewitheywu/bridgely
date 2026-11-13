import { getMe } from "@/lib/auth";
import { Avatar, date, Empty, PageHeader } from "../../ui";

export const metadata = { title: "Demo requests" };

type Req = { id: string; name: string; work_email: string; company: string; company_size: string; message: string | null; created_at: string };

export default async function Requests() {
  const { sb } = await getMe("admin");
  const { data } = await sb.from("demo_requests").select("id, name, work_email, company, company_size, message, created_at")
    .order("created_at", { ascending: false }).limit(200).overrideTypes<Req[], { merge: false }>();
  return (
    <>
      <PageHeader title="Demo requests" description="Companies that asked to see TB Rewards. Reply by email to schedule a call." />
      {data?.length ? (
        <ul className="flex flex-col gap-4">
          {data.map((r) => (
            <li key={r.id} className="card flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={r.name} />
                  <div className="min-w-0">
                    <p className="font-semibold text-navy">{r.name} · {r.company}</p>
                    <p className="text-[13px] text-muted">{r.company_size} employees · {date(r.created_at)}</p>
                  </div>
                </div>
                <a href={`mailto:${r.work_email}?subject=${encodeURIComponent("Your TB Rewards demo")}`} className="btn-soft min-h-11 px-5">Email {r.work_email}</a>
              </div>
              {r.message && <p className="border-t border-edge pt-3 whitespace-pre-line">{r.message}</p>}
            </li>
          ))}
        </ul>
      ) : <Empty>No demo requests yet. They appear here when someone fills in the Book a demo form.</Empty>}
    </>
  );
}
