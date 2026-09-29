import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Search, ArrowRight, UserCheck } from "lucide-react";

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const currentTab = params.status || "all";
  const searchQuery = params.search || "";

  const supabase = await createClient();

  // Query base
  let query = supabase
    .from("verifications")
    .select(`
      id,
      identity_status,
      bar_status,
      created_at,
      updated_at,
      rejection_reason,
      lawyer_profiles!inner (
        id,
        bar_number,
        bar_association,
        years_experience,
        verification_status,
        profiles (
          first_name,
          last_name,
          city,
          phone
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (currentTab !== "all") {
    query = query.eq("bar_status", currentTab as any);
  }

  const { data: verifications } = await query;

  // Filtrado en memoria por búsqueda si existe
  const filtered = verifications?.filter((v: any) => {
    if (!searchQuery) return true;
    const l = v.lawyer_profiles;
    const p = l.profiles;
    const term = searchQuery.toLowerCase();
    return (
      p.first_name.toLowerCase().includes(term) ||
      p.last_name.toLowerCase().includes(term) ||
      l.bar_number.toLowerCase().includes(term) ||
      l.bar_association.toLowerCase().includes(term)
    );
  }) || [];

  const tabs = [
    { id: "all", label: "Todas" },
    { id: "in_review", label: "En Revisión" },
    { id: "verified", label: "Verificadas" },
    { id: "observed", label: "Observadas" },
    { id: "rejected", label: "Rechazadas" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] font-mono">
            Auditoría de Colegiatura
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] font-serif mt-1">
            Bandeja de Verificación de Colegiatura
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Valida la habilitación activa y los expedientes documentales de los abogados postulantes.
          </p>
        </div>

        {/* Search */}
        <form method="GET" className="flex items-center gap-2">
          {currentTab !== "all" && (
            <input type="hidden" name="status" value={currentTab} />
          )}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder="Buscar por matrícula o nombre..."
              className="w-full sm:w-72 rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-4 py-2.5 text-xs text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none transition-all"
            />
          </div>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/admin/verifications?status=${tab.id}${searchQuery ? `&search=${searchQuery}` : ""}`}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all shrink-0 ${
                isActive
                  ? "bg-[#0F172A] text-white shadow-sm font-bold"
                  : "text-slate-600 hover:text-[#0F172A] hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-4 px-5">Abogado / Profesional</th>
                <th className="py-4 px-5">Colegio & Matrícula</th>
                <th className="py-4 px-5">Ciudad</th>
                <th className="py-4 px-5">Experiencia</th>
                <th className="py-4 px-5">Estado</th>
                <th className="py-4 px-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length > 0 ? (
                filtered.map((v: any) => {
                  const lawyer = v.lawyer_profiles;
                  const profile = lawyer.profiles;
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-5 font-bold text-[#0F172A]">
                        {profile.first_name} {profile.last_name}
                      </td>
                      <td className="py-4 px-5 font-mono text-blue-600 font-bold">
                        {lawyer.bar_number}
                        <span className="text-slate-500 block text-[10px] font-sans font-normal">
                          {lawyer.bar_association}
                        </span>
                      </td>
                      <td className="py-4 px-5">{profile.city}</td>
                      <td className="py-4 px-5">{lawyer.years_experience} años</td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                            v.bar_status === "verified"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : v.bar_status === "observed"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : v.bar_status === "rejected"
                              ? "bg-slate-100 text-slate-700 border border-slate-200"
                              : "bg-slate-100 text-slate-800 border-slate-200"
                          }`}
                        >
                          {v.bar_status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/admin/verifications/${v.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0F172A] px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs"
                        >
                          Inspeccionar
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    No se encontraron registros en esta vista.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
