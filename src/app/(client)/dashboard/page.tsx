import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Briefcase, Clock, ShieldCheck, ArrowRight, FileText, CheckCircle2 } from "lucide-react";

export default async function ClientDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Obtener casos del cliente
  const { data: cases } = await supabase
    .from("cases")
    .select("*, specialties:specialties!cases_specialty_id_fkey(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Obtener conteo real de matches bilaterales
  const caseIds = cases?.map((c) => c.id) || [];
  let confirmedMatchesCount = 0;
  if (caseIds.length > 0) {
    const { count } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .in("case_id", caseIds)
      .eq("status", "matched");
    confirmedMatchesCount = count || 0;
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-3xl border border-[#E6EAF0] bg-white p-6 sm:p-8 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#3157D5] font-mono">
            Panel de Consultas
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101828] font-serif mt-1">
            Hola, {profile?.first_name || "Usuario"} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1 max-w-lg leading-relaxed">
            Revisa el estado de tus consultas legales y descubre a los abogados habilitados que coinciden con tus casos.
          </p>
        </div>

        <Link
          href="/cases/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#101828] hover:bg-[#1E293B] px-6 py-3.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-blue-400 stroke-[2.5]" />
          <span>Describir mi problema legal</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#667085] font-mono">
              Casos Registrados
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7F8FC] text-[#3157D5]">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#101828] mt-2">
            {cases?.length || 0}
          </p>
          <span className="text-[11px] text-[#667085] mt-1 block">Expedientes activos</span>
        </div>

        <div className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#667085] font-mono">
              Matches Confirmados
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F5E9] text-[#198754]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#101828] mt-2">
            {confirmedMatchesCount}
          </p>
          <span className="text-[11px] text-[#667085] mt-1 block">Conexiones bilaterales</span>
        </div>

        <div className="rounded-2xl border border-[#E6EAF0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#667085] font-mono">
              Privacidad y Control
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#3157D5]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-bold text-[#101828] mt-2 font-mono">Ley N.° 29733</p>
          <span className="text-[11px] text-[#667085] mt-1 block">Datos enmascarados</span>
        </div>
      </div>

      {/* Casos List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-[#101828] font-serif">Mis Casos Activos</h2>
          {cases && cases.length > 0 && (
            <Link
              href="/cases/new"
              className="text-xs text-[#3157D5] hover:underline font-bold inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo caso</span>
            </Link>
          )}
        </div>

        {cases && cases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map((c: any) => (
              <div
                key={c.id}
                className="flex flex-col justify-between rounded-2xl border border-[#E6EAF0] bg-white p-5 hover:border-[#3157D5]/60 hover:shadow-md transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="rounded-full bg-[#EEF2FF] border border-[#D1DEFC] px-2.5 py-0.5 text-[11px] font-bold text-[#3157D5] font-mono">
                      {c.specialties?.name || "General"}
                    </span>
                    <span className="text-[10px] font-mono text-[#667085] uppercase font-semibold">
                      {c.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#101828] text-base line-clamp-1 font-serif">{c.title}</h3>
                  <p className="text-xs text-[#667085] line-clamp-2 mt-1 leading-relaxed">{c.description}</p>
                </div>

                <div className="mt-4 pt-3.5 border-t border-[#E6EAF0] flex items-center justify-between">
                  <span className="text-[11px] text-[#667085]">
                    En <strong className="text-[#202938]">{c.city}</strong>
                  </span>
                  <Link
                    href={`/cases/${c.id}/match`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#3157D5] hover:underline cursor-pointer"
                  >
                    <span>Ver Abogados</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#E6EAF0] bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#3157D5] mb-4">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#101828] font-serif">No tienes casos publicados</h3>
            <p className="text-xs sm:text-sm text-[#667085] max-w-md mx-auto mt-1 mb-6 leading-relaxed">
              Describe tu situación jurídica en lenguaje sencillo y nuestro motor de matching te presentará a los profesionales más idóneos.
            </p>
            <Link
              href="/cases/new"
              className="inline-flex items-center gap-2 rounded-xl bg-[#101828] hover:bg-[#1E293B] px-6 py-3 text-xs font-bold text-white transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-400 stroke-[2.5]" />
              <span>Publicar mi primer caso</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
