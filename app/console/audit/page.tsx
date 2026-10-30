import { desc } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { consoleCtx } from "@/lib/console";
import { brandCond } from "@/lib/access";
import { PageHead, Panel } from "@/components/console";
import { fmtDate } from "@/lib/time";

export const metadata = { title: "Audit log" };

export default async function Audit() {
  const ctx = await consoleCtx();
  const rows = db.select().from(s.auditLog).where(ctx.isGroup && !ctx.pickedId ? undefined : brandCond(s.auditLog.brandId, ctx.u, ctx.pickedId)).orderBy(desc(s.auditLog.id)).limit(200).all();
  return (
    <>
      <PageHead title="Audit log" sub="Who changed what, and when. Kept for DPDP and client audit requests." />
      <Panel pad={false}>
        <div className="scroll-x">
          <table className="data">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Action</th>
                <th>Record</th>
                <th>Business</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap text-xs">{fmtDate(r.createdAt, true)}</td>
                  <td className="whitespace-nowrap">{r.actor}</td>
                  <td className="font-mono text-xs">{r.action}</td>
                  <td className="whitespace-nowrap text-xs">
                    {r.entity}
                    {r.entityId ? ` #${r.entityId}` : ""}
                  </td>
                  <td className="whitespace-nowrap">{r.brandId ? ctx.byId[r.brandId]?.shortName : "Group"}</td>
                  <td className="text-sm text-muted">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
