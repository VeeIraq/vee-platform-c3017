import { createClient } from "@/lib/supabase/server";
import { LeadStatusSelect } from "./lead-status-select";

export default async function AdminLeadsPage() {
  const supabase = await createClient();
  const { data: leads } = await supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(100);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Leads</h1>
      <p className="mb-6 text-sm text-ink-muted">Submissions from the public contact form.</p>

      <div className="flex flex-col gap-3">
        {(leads ?? []).map((lead) => {
          const meta = (lead.metadata ?? {}) as Record<string, unknown>;
          return (
            <div key={lead.id} className="rounded-[var(--radius-lg)] border border-line bg-paper p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-ink">
                    {lead.name} · {lead.business_name}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {lead.phone}
                    {meta.whatsapp ? ` · WhatsApp: ${meta.whatsapp}` : ""}
                    {meta.instagram ? ` · IG: ${meta.instagram}` : ""}
                  </p>
                  {meta.businessType ? <p className="text-xs text-ink-muted">Type: {String(meta.businessType)}</p> : null}
                  {meta.plan ? <p className="text-xs text-ink-muted">Interested in: {String(meta.plan)}</p> : null}
                  {meta.message ? <p className="mt-2 text-sm text-ink-soft">&ldquo;{String(meta.message)}&rdquo;</p> : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <LeadStatusSelect leadId={lead.id} status={lead.status} />
                  <p className="text-xs text-ink-muted">{new Date(lead.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          );
        })}
        {(leads ?? []).length === 0 && (
          <p className="rounded-[var(--radius-md)] border border-dashed border-line p-8 text-center text-sm text-ink-muted">
            No leads yet.
          </p>
        )}
      </div>
    </div>
  );
}
