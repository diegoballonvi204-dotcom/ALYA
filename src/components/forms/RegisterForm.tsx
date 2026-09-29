"use client";

import { useState } from "react";
import { registerAction } from "@/actions/auth.actions";
import { Lock, Mail, User, ShieldCheck, ArrowRight, Loader2, AlertCircle } from "lucide-react";

interface RegisterFormProps {
  initialRole: "client" | "lawyer";
}

export function RegisterForm({ initialRole }: RegisterFormProps) {
  const [role, setRole] = useState<"client" | "lawyer">(initialRole);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("role", role);

    try {
      const res = await registerAction(formData);
      if (res?.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
      }
    } catch (err: any) {
      if (err?.message?.includes("NEXT_REDIRECT")) return;
      setErrorMessage(err?.message || "Error al crear la cuenta");
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

      {/* Selector de Rol */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
          ¿Cuál es tu objetivo en la plataforma?
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("client")}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-4 text-center transition-all ${
              role === "client"
                ? "border-[#0F172A] bg-[#0F172A] text-white shadow-md shadow-slate-900/10"
                : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/70 text-slate-700"
            }`}
          >
            <User className={`w-5 h-5 ${role === "client" ? "text-blue-400" : "text-slate-500"}`} />
            <span className={`text-xs font-bold ${role === "client" ? "text-white" : "text-[#0F172A]"}`}>
              Busco un Abogado
            </span>
            <span className={`text-[10px] ${role === "client" ? "text-slate-300" : "text-slate-500"}`}>
              Tengo una consulta o caso legal
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRole("lawyer")}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-4 text-center transition-all ${
              role === "lawyer"
                ? "border-[#0F172A] bg-[#0F172A] text-white shadow-md shadow-slate-900/10"
                : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/70 text-slate-700"
            }`}
          >
            <ShieldCheck className={`w-5 h-5 ${role === "lawyer" ? "text-blue-400" : "text-slate-500"}`} />
            <span className={`text-xs font-bold ${role === "lawyer" ? "text-white" : "text-[#0F172A]"}`}>
              Soy Abogado Colegiado
            </span>
            <span className={`text-[10px] ${role === "lawyer" ? "text-slate-300" : "text-slate-500"}`}>
              Busco casos compatibles en mi área
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
            Nombres
          </label>
          <input
            type="text"
            name="firstName"
            required
            placeholder="Carlos"
            className="w-full rounded-xl border border-slate-300/80 bg-slate-50/70 px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
            Apellidos
          </label>
          <input
            type="text"
            name="lastName"
            required
            placeholder="Ramos Vega"
            className="w-full rounded-xl border border-slate-300/80 bg-slate-50/70 px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none transition-all"
          />
        </div>
      </div>

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
            placeholder="carlos@ejemplo.pe"
            className="w-full rounded-xl border border-slate-300/80 bg-slate-50/70 pl-10 pr-4 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
            Contraseña
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Lock className="w-3.5 h-3.5" />
            </span>
            <input
              type="password"
              name="password"
              required
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-xl border border-slate-300/80 bg-slate-50/70 pl-9 pr-3 py-2.5 text-xs text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
            Confirmar Clave
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Lock className="w-3.5 h-3.5" />
            </span>
            <input
              type="password"
              name="confirmPassword"
              required
              placeholder="Repite tu contraseña"
              className="w-full rounded-xl border border-slate-300/80 bg-slate-50/70 pl-9 pr-3 py-2.5 text-xs text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none transition-all"
            />
          </div>
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
              <span>Creando cuenta...</span>
            </>
          ) : (
            <>
              <span>Crear mi cuenta</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
