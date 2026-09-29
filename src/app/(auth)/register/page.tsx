import Link from "next/link";
import { Scale, AlertCircle } from "lucide-react";
import { RegisterForm } from "@/components/forms/RegisterForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; error?: string }>;
}) {
  const params = await searchParams;
  const initialRole = params.role === "lawyer" ? "lawyer" : "client";

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center p-4 sm:p-8 bg-noise">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200/90 bg-white/95 p-7 sm:p-10 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl">
        <div className="text-center mb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F172A] shadow-lg shadow-slate-900/20 mb-4 border border-slate-800">
            <Scale className="h-7 w-7 text-white stroke-[2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] font-serif">
            Crear Cuenta en ALYA
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Conectamos consultas jurídicas con abogados verificados de alta reputación.
          </p>
        </div>

        {params.error && (
          <div className="mb-5 rounded-xl border border-slate-300 bg-slate-100/90 p-3.5 text-xs text-slate-800 font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            <span>{params.error}</span>
          </div>
        )}

        <RegisterForm initialRole={initialRole} />

        <div className="mt-8 text-center text-xs text-slate-500 pt-5 border-t border-slate-100">
          ¿Ya tienes una cuenta registrada?{" "}
          <Link href="/login" className="font-bold text-[#2563EB] hover:text-[#1E3A8A] hover:underline transition-colors">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
