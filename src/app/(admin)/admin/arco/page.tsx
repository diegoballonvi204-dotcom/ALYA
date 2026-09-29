import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminArcoRequestsAction } from "@/actions/arco.actions";
import { AdminArcoTable } from "@/components/admin/AdminArcoTable";

export default async function AdminArcoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/arco");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "verifier") {
    redirect("/dashboard");
  }

  const { requests } = await getAdminArcoRequestsAction();

  const pendingCount = (requests || []).filter(
    (r: any) => r.status === "received"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Banner - Clean Luxury White */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] font-mono">
            Oficial de Privacidad • Ley N.° 29733
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] font-serif mt-1">
            Bandeja de Derechos ARCO
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl font-sans">
            Gestiona los requerimientos de Acceso, Rectificación, Cancelación y
            Oposición presentados por los ciudadanos. Asegura el cumplimiento de
            los plazos perentorios de la ANPDP.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[120px]">
            <span className="text-3xl font-extrabold text-[#0F172A] font-mono block">
              {pendingCount}
            </span>
            <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
              Pendientes
            </span>
          </div>
        </div>
      </div>

      {/* Table Component */}
      <AdminArcoTable initialRequests={requests || []} />
    </div>
  );
}
