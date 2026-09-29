"use client";

import { useState } from "react";
import { loginAction } from "@/actions/auth.actions";
import { Lock, Mail, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export function LoginForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await loginAction(formData);
      if (res?.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
      }
    } catch (err: any) {
      if (err?.message?.includes("NEXT_REDIRECT")) return;
      setErrorMessage(err?.message || "Error al iniciar sesión");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="rounded-xl border border-slate-300 bg-slate-100/90 p-3 text-xs text-slate-800 font-medium flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
          Correo Electrónico
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Mail className="w-4 h-4" />
          </span>
          <input
            type="email"
            name="email"
            required
            placeholder="usuario@alya.pe"
            className="w-full rounded-xl border border-slate-300/80 bg-slate-50/70 pl-10 pr-4 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Contraseña
          </label>
          <a href="#" className="text-xs text-[#2563EB] hover:text-[#1E3A8A] font-semibold hover:underline transition-colors">
            ¿Olvidaste tu clave?
          </a>
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Lock className="w-4 h-4" />
          </span>
          <input
            type="password"
            name="password"
            required
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-300/80 bg-slate-50/70 pl-10 pr-4 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Iniciando sesión...</span>
            </>
          ) : (
            <>
              <span>Ingresar a la plataforma</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
