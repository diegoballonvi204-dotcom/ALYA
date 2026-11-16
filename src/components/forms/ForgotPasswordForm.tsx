"use client";

import { useState } from "react";
import { Mail, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { requestPasswordResetAction } from "@/actions/auth.actions";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("email", email);
      const res = await requestPasswordResetAction(formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(
          res?.message ||
            "Si el correo está registrado, enviamos un enlace para restablecer tu contraseña."
        );
      }
    } catch {
      setErrorMsg("No pudimos procesar la solicitud en este momento. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (successMsg) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Correo de Recuperación Enviado</h2>
        <p className="text-xs text-slate-600 leading-relaxed">{successMsg}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="reset-email"
          className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide"
        >
          Correo Electrónico Registrado
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Mail className="w-4 h-4" />
          </span>
          <input
            id="reset-email"
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@correo.pe"
            className="w-full rounded-xl border border-slate-300/80 bg-slate-50/70 pl-10 pr-4 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition-all disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Enviando enlace...</span>
          </>
        ) : (
          <>
            <span>Enviar enlace de recuperación</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}

