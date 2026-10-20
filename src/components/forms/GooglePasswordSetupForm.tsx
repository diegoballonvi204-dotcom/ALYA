"use client";

import { useState } from "react";
import { completeGoogleSignupAction } from "@/actions/auth.actions";
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

interface GooglePasswordSetupFormProps {
  initialEmail: string;
  initialFirstName: string;
  initialLastName: string;
  initialRole?: "client" | "lawyer";
}

export function GooglePasswordSetupForm({
  initialEmail,
  initialFirstName,
  initialLastName,
  initialRole = "client",
}: GooglePasswordSetupFormProps) {
  const [role, setRole] = useState<"client" | "lawyer">(initialRole);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (firstName.trim().length < 2) {
      setErrorMessage("Por favor ingresa tus nombres completos.");
      return;
    }
    if (lastName.trim().length < 2) {
      setErrorMessage("Por favor ingresa tus apellidos completos.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.set("firstName", firstName.trim());
    formData.set("lastName", lastName.trim());
    formData.set("role", role);
    formData.set("password", password);
    formData.set("confirmPassword", confirmPassword);

    try {
      const res = await completeGoogleSignupAction(formData);
      if (res?.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
      }
    } catch (err: any) {
      if (err?.message?.includes("NEXT_REDIRECT")) return;
      setErrorMessage(err?.message || "Error al completar el registro");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs sm:text-sm text-red-900 flex items-start gap-2.5 shadow-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Correo de Google Verificado (Read-only) */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
          Cuenta de Google Asociada
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Mail className="w-4 h-4 text-emerald-600" />
          </span>
          <input
            type="email"
            value={initialEmail}
            readOnly
            className="w-full rounded-xl border border-emerald-200 bg-emerald-50/40 pl-10 pr-24 py-2.5 text-sm font-medium text-slate-800 cursor-not-allowed select-none"
          />
          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Verificado
            </span>
          </span>
        </div>
      </div>

      {/* Selector de Rol */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
          ¿Cómo deseas utilizar ALYA? <span className="text-[#2563EB]">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("client")}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-4 text-center transition-all cursor-pointer ${
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
              Cliente con consultas o casos
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRole("lawyer")}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-4 text-center transition-all cursor-pointer ${
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
              Para recibir y atender casos
            </span>
          </button>
        </div>
      </div>

      {/* Nombres y Apellidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
            Nombres
          </label>
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Nombres"
            className="w-full rounded-xl border border-slate-300/80 bg-slate-50/70 px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
            Apellidos
          </label>
          <input
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Apellidos"
            className="w-full rounded-xl border border-slate-300/80 bg-slate-50/70 px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Contraseña y Confirmar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
            Definir Contraseña <span className="text-[#2563EB]">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Lock className="w-3.5 h-3.5" />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-xl border border-slate-300/80 bg-slate-50/70 pl-9 pr-10 py-2.5 text-xs text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
            Confirmar Contraseña <span className="text-[#2563EB]">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Lock className="w-3.5 h-3.5" />
            </span>
            <input
              type={showConfirm ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              className="w-full rounded-xl border border-slate-300/80 bg-slate-50/70 pl-9 pr-10 py-2.5 text-xs text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 focus:outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Activando cuenta...</span>
            </>
          ) : (
            <>
              <span>Finalizar Registro y Activar Cuenta</span>
              <ArrowRight className="w-4 h-4 text-blue-400" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
