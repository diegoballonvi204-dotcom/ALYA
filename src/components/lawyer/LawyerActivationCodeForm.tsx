"use client";

import { useState } from "react";
import { verifyLawyerActivationCodeAction, resendLawyerActivationCodeAction } from "@/actions/verification.actions";
import { ShieldCheck, Mail, ArrowRight, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface LawyerActivationCodeFormProps {
  lawyerEmail: string;
}

export default function LawyerActivationCodeForm({ lawyerEmail }: LawyerActivationCodeFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setErrorMessage("Por favor ingresa el código completo de 6 dígitos.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await verifyLawyerActivationCodeAction(code);
      if (res?.error) {
        setErrorMessage(res.error);
        setLoading(false);
      } else {
        setSuccessMessage("¡Código verificado con éxito! Tu cuenta de abogado ha sido activada.");
        setTimeout(() => {
          router.refresh();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Error al verificar código.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setErrorMessage(null);
    try {
      const res = await resendLawyerActivationCodeAction();
      if (res?.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage("Se ha reenviado un nuevo código a tu correo.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Error al reenviar el código.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-blue-50/70 p-6 sm:p-10 shadow-xl shadow-slate-900/5">
      <div className="max-w-xl mx-auto text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
          <ShieldCheck className="h-8 w-8" />
        </div>

        <div>
          <span className="inline-block rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold uppercase tracking-wider mb-2 font-mono">
            Documentación Aprobada
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] font-serif">
            ¡Tu Colegiatura ha sido Validada!
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Hemos validado tu expediente profesional. Para finalizar la activación de tu consola y desbloquear el acceso a casos de clientes, introduce el código de 6 dígitos enviado a tu correo:
          </p>
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>{lawyerEmail}</span>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 font-medium flex items-start gap-2.5 text-left">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 font-medium flex items-start gap-2.5 text-left">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="flex justify-center">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              autoFocus
              className="w-56 text-center text-3xl font-extrabold tracking-[10px] font-mono py-3.5 px-4 rounded-2xl border-2 border-slate-300 bg-white text-[#0F172A] focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15 focus:outline-none shadow-inner"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || code.trim().length !== 6}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verificando código...</span>
                </>
              ) : (
                <>
                  <span>Activar mi Cuenta de Abogado</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-2 px-3 rounded-lg hover:bg-slate-100/60 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
              <span>{resending ? "Reenviando..." : "¿No recibiste el código? Reenviar"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
