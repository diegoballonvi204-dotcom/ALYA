import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  Clock,
  Briefcase,
  ArrowRight,
  UserCheck,
  Activity,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 1. Obtener métricas clave
  const [
    { count: totalLawyers },
    { count: verifiedLawyers },
    { count: inReviewLawyers },
    { count: totalCases },
    { count: totalMatches },
  ] = await Promise.all([
    supabase.from("lawyer_profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("lawyer_profiles")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "verified"),
    supabase
      .from("lawyer_profiles")
      .select("*", { count: "exact", head: true })
      .in("verification_status", ["pending", "in_review"]),
    supabase.from("cases").select("*", { count: "exact", head: true }),
    supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("status", "matched"),
  ]);

  // 2. Obtener solicitudes de verificación en cola
  const { data: pendingVerifications } = await supabase
    .from("verifications")
    .select(`
      id,
      identity_status,
      bar_status,
      created_at,
      lawyer_profiles!inner (
        id,
        bar_number,
        bar_association,
        verification_status,
        profiles (
          first_name,
          last_name,
          city
        )
      )
    `)
    .in("bar_status", ["pending", "in_review", "observed"])
    .order("created_at", { ascending: false })
    .limit(5);

  // 3. Obtener últimos eventos de auditoría
  const { data: recentAudit } = await supabase
    .from("audit_logs")
    .select(`
      id,
      action,
      entity_type,
      entity_id,
      created_at,
      metadata,
      profiles (
        first_name,
        last_name
      )
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] font-mono">
            Centro de Mando
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] font-serif mt-1">
            Panel de Control Administrativo
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-sans">
            Supervisión operativa, validación colegiada de abogados y auditoría de la plataforma.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Abogados */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Abogados Registrados</span>
            <Users className="w-4 h-4 text-[#2563EB]" />
          </div>
          <p className="text-3xl font-extrabold font-mono text-[#0F172A] mt-2">
            {totalLawyers || 0}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2 font-mono">
            <span className="text-emerald-600 font-bold">{verifiedLawyers || 0}</span>
            <span>verificados activos</span>
          </div>
        </div>

        {/* En Cola de Verificación */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">En Cola de Revisión</span>
            <Clock className="w-4 h-4 text-[#2563EB]" />
          </div>
          <p className="text-3xl font-extrabold font-mono text-[#0F172A] mt-2">
            {inReviewLawyers || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">Pendientes de dictamen</p>
        </div>

        {/* Casos Publicados */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Casos Publicados</span>
            <Briefcase className="w-4 h-4 text-[#2563EB]" />
          </div>
          <p className="text-3xl font-extrabold font-mono text-[#0F172A] mt-2">
            {totalCases || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">Clientes buscando asesoría</p>
        </div>

        {/* Matches Bilaterales */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Matches Bilaterales</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold font-mono text-emerald-600 mt-2">
            {totalMatches || 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">Interés mutuo formalizado</p>
        </div>
      </div>

      {/* Two Column Section: Queue & Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Queue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#2563EB]" />
              <h2 className="font-bold text-[#0F172A] text-base font-serif">Solicitudes Pendientes</h2>
            </div>
            <Link
              href="/admin/verifications"
              className="text-xs font-bold text-[#2563EB] hover:underline inline-flex items-center gap-1"
            >
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingVerifications && pendingVerifications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {pendingVerifications.map((v: any) => {
                const lawyer = v.lawyer_profiles;
                const profile = lawyer.profiles;
                return (
                  <div key={v.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A]">
                        {profile.first_name} {profile.last_name}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500">
                        {lawyer.bar_association} • {lawyer.bar_number}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 uppercase">
                        {v.bar_status}
                      </span>
                      <Link
                        href={`/admin/verifications/${v.id}`}
                        className="rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-[#0F172A] transition-colors"
                      >
                        Inspeccionar
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              No hay solicitudes pendientes en este momento.
            </div>
          )}
        </div>

        {/* Recent Audit Logs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h2 className="font-bold text-[#0F172A] text-base font-serif">Actividad Reciente</h2>
            </div>
            <Link
              href="/admin/audit"
              className="text-xs font-bold text-[#2563EB] hover:underline inline-flex items-center gap-1"
            >
              Bitácora completa <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentAudit && recentAudit.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentAudit.map((log: any) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#0F172A] font-mono">
                      {log.action}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Por: {log.profiles?.first_name || "Admin"} • Entidad: {log.entity_type}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {new Date(log.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              Sin registros de auditoría recientes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
