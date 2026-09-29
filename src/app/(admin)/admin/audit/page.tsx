import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { User } from "lucide-react";

export default async function AdminAuditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/audit");
  }

  // Obtener logs de auditoría
  const { data: logs } = await supabase
    .from("audit_logs")
    .select(`
      id,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at,
      profiles (
        first_name,
        last_name,
        role
      )
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] font-mono">
            Trazabilidad Inmutable
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] font-serif mt-1">
            Bitácora de Auditoría Forense
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Registro de todas las acciones administrativas, dictámenes de verificación y modificaciones críticas en la plataforma.
          </p>
        </div>
      </div>

      {/* Audit Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-4 px-5">Fecha & Hora</th>
                <th className="py-4 px-5">Administrador / Autor</th>
                <th className="py-4 px-5">Acción</th>
                <th className="py-4 px-5">Entidad Afectada</th>
                <th className="py-4 px-5">Metadatos (JSON)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs && logs.length > 0 ? (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-5 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("es-PE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          {log.profiles?.first_name} {log.profiles?.last_name || "Sistema"}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        Rol: {log.profiles?.role || "admin"}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono text-blue-600 font-bold">
                      {log.action}
                    </td>
                    <td className="py-4 px-5">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-700 font-semibold border border-slate-200">
                        {log.entity_type}
                      </span>
                      <span className="block text-[10px] font-mono text-slate-400 truncate max-w-[120px] mt-0.5">
                        {log.entity_id}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono text-[11px]">
                      <pre className="max-w-md overflow-x-auto rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-[10px] text-slate-800 font-mono">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                    Sin eventos registrados en la bitácora.
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
