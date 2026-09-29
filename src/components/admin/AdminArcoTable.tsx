"use client";

import { useState, useTransition } from "react";
import {
  ShieldCheck,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  User,
  ExternalLink,
} from "lucide-react";
import { resolveArcoRequestAction } from "@/actions/arco.actions";

export interface ArcoRequestItem {
  id: string;
  user_id: string | null;
  requester_name: string;
  requester_dni: string;
  requester_email: string;
  request_type: "access" | "rectification" | "cancellation" | "opposition";
  justification: string;
  status: "received" | "in_process" | "resolved" | "rejected";
  deadline_at: string;
  resolution_notes: string | null;
  created_at: string;
}

interface AdminArcoTableProps {
  initialRequests: ArcoRequestItem[];
}

export function AdminArcoTable({ initialRequests }: AdminArcoTableProps) {
  const [requests, setRequests] = useState<ArcoRequestItem[]>(initialRequests);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [selectedReq, setSelectedReq] = useState<ArcoRequestItem | null>(null);
  const [decision, setDecision] = useState<"resolved" | "rejected">("resolved");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = requests.filter((r) => {
    const matchesSearch =
      r.requester_name.toLowerCase().includes(search.toLowerCase()) ||
      r.requester_dni.includes(search) ||
      r.requester_email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    startTransition(async () => {
      const res = await resolveArcoRequestAction({
        requestId: selectedReq.id,
        decision,
        resolutionNotes,
      });

      if (res.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === selectedReq.id
              ? { ...r, status: decision, resolution_notes: resolutionNotes }
              : r
          )
        );
        setSelectedReq(null);
        setResolutionNotes("");
      } else {
        alert(res.error || "Error al emitir dictamen");
      }
    });
  };

  const getDaysLeft = (deadlineStr: string) => {
    const diff = new Date(deadlineStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          {["all", "received", "resolved", "rejected"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                statusFilter === st
                  ? "bg-[#0F172A] text-white font-bold shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {st === "all"
                ? "Todos"
                : st === "received"
                ? "Pendientes"
                : st === "resolved"
                ? "Resueltos"
                : "Rechazados"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por DNI, nombre o correo..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-[#0F172A] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
          />
        </div>
      </div>

      {/* Tabla de Solicitudes */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Titular / DNI</th>
                <th className="px-6 py-4">Derecho ARCO</th>
                <th className="px-6 py-4">Plazo Legal</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron solicitudes ARCO en esta sección.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const daysLeft = getDaysLeft(r.deadline_at);
                  const isOverdue = daysLeft < 0;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#0F172A]">
                          {r.requester_name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          DNI {r.requester_dni} • {r.requester_email}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 font-bold text-blue-600 capitalize text-xs">
                          {r.request_type}
                        </span>
                        <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5 italic">
                          &ldquo;{r.justification}&rdquo;
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        {r.status === "received" ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              isOverdue
                                ? "bg-slate-200 text-slate-800 border-slate-300"
                                : daysLeft <= 3
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {isOverdue
                              ? "Vencido ante ANPDP"
                              : `${daysLeft} días restantes`}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">
                            Concluido
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            r.status === "resolved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : r.status === "rejected"
                              ? "bg-slate-100 text-slate-700 border border-slate-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {r.status === "resolved"
                            ? "Procedente"
                            : r.status === "rejected"
                            ? "Improcedente"
                            : "Pendiente"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedReq(r);
                            setDecision(r.status === "rejected" ? "rejected" : "resolved");
                            setResolutionNotes(r.resolution_notes || "");
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-bold transition-colors"
                        >
                          {r.status === "received" ? "Resolver" : "Ver Detalle"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Dictamen y Resolución ARCO */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 text-[#0F172A] shadow-2xl space-y-5">
            <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-600 font-mono">
                  Resolución de Solicitud de {selectedReq.request_type}
                </span>
                <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
                  Titular: {selectedReq.requester_name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  DNI: {selectedReq.requester_dni} • Correo: {selectedReq.requester_email}
                </p>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-[#0F172A]"
              >
                ✕
              </button>
            </div>

            {/* Justificación del Titular */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-600 font-bold block mb-1">
                Fundamentación del Ciudadano:
              </span>
              <p className="italic text-slate-800 whitespace-pre-wrap">
                &ldquo;{selectedReq.justification}&rdquo;
              </p>
            </div>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Dictamen Oficial
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision("resolved")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      decision === "resolved"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    ✓ Procedente (Conceder)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision("rejected")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      decision === "rejected"
                        ? "bg-slate-200 border-slate-400 text-slate-800 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    ✕ Improcedente (Denegar)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Fundamentos Jurídicos de la Resolución *
                </label>
                <textarea
                  required
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detalla las medidas adoptadas en la base de datos o los fundamentos legales de la denegatoria..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 p-3 text-xs text-[#0F172A] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-[#0F172A]"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Emitiendo resolución...</span>
                    </>
                  ) : (
                    <span>Registrar Dictamen</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
