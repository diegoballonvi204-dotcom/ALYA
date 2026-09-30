"use client";

import { useState } from "react";
import { runDunningSweepAction } from "@/actions/billing.actions";
import { RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";

export default function AdminDunningTrigger() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRunSweep = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await runDunningSweepAction();
      if (res.success) {
        setResult(res.result);
      }
    } catch (e) {
      console.error("Error al ejecutar dunning:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Degradados: {result.trial_downgrades ?? 0} trials, {result.past_due_cancels ?? 0} vencidos
        </span>
      )}

      <button
        type="button"
        onClick={handleRunSweep}
        disabled={loading}
        title="Ejecuta la revisión nocturna de pruebas vencidas y periodos de gracia"
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
        <span>{loading ? "Ejecutando Dunning..." : "Ejecutar Dunning Sweep"}</span>
      </button>
    </div>
  );
}
