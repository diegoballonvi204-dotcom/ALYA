import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Briefcase, Clock, ShieldCheck, ArrowRight, FileText } from "lucide-react";

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

  return (
    <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-12 py-8 space-y-8">
      {/* Welcome Banner - Clean, Expanded Luxury Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] font-mono">
            Panel del Cliente
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] font-serif mt-1">
            Hola, {profile?.first_name || "Usuario"} 👋
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestiona tus consultas jurídicas y revisa los abogados compatibles con tus casos.
          </p>
        </div>

        <Link
          href="/cases/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 hover:shadow-xl hover:-translate-y-0.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-blue-400 stroke-[2.5]" />
          <span>Describir mi problema legal</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Casos Registrados</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-[#0F172A]">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold font-mono text-[#0F172A] mt-3">
            {cases?.length || 0}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Matches Bilaterales</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-[#0F172A]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold font-mono text-[#0F172A] mt-3">0</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Consultas Agendadas</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-[#0F172A]">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold font-mono text-[#0F172A] mt-3">0</p>
        </div>
      </div>

      {/* Casos List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#0F172A] font-serif">Mis Casos Activos</h2>
          {cases && cases.length > 0 && (
            <Link href="/cases/new" className="text-xs text-[#2563EB] hover:underline font-bold">
              + Nuevo Caso
            </Link>
          )}
        </div>

        {cases && cases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cases.map((c: any) => (
              <div
                key={c.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-xs font-bold text-blue-700">
                      {c.specialties?.name || "General"}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                      {c.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#0F172A] text-base line-clamp-1 font-serif">{c.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1.5">{c.description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Ubicación: <strong className="text-slate-700">{c.city}</strong>
                  </span>
                  <Link
                    href={`/cases/${c.id}/match`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:underline"
                  >
                    Ver Abogados
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-[#0F172A] mb-4">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A] font-serif">No tienes casos publicados</h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1 mb-6 font-sans">
              Describe tu situación jurídica en lenguaje sencillo y nuestro motor de matching te recomendará los abogados idóneos.
            </p>
            <Link
              href="/cases/new"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-6 py-3 text-xs font-bold text-white transition-all shadow-md shadow-slate-900/15"
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
