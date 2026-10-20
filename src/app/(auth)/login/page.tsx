import Link from "next/link";
import Image from "next/image";
import { AlertCircle, UserPlus, CheckCircle2 } from "lucide-react";
import { LoginForm } from "@/components/forms/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; email?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center p-4 sm:p-8 bg-noise">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white/95 p-7 sm:p-10 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-3 transition-transform hover:scale-105 active:scale-95">
            <Image
              src="/logoAlya.png"
              alt="ALYA LegalTech"
              width={200}
              height={60}
              priority
              className="h-16 sm:h-18 w-auto mx-auto object-contain drop-shadow-xs"
            />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] font-serif">
            Iniciar Sesión
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Accede al portal de ALYA Perú
          </p>
        </div>

        {/* Alerta cuando intenta hacer login con Google sin cuenta previa */}
        {params.error === "account_not_found" && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs text-red-900 space-y-2 shadow-xs animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold">No existe una cuenta registrada</strong>
                <span className="text-slate-600 block mt-0.5">
                  {params.email ? (
                    <>
                      El correo <strong>{params.email}</strong> no tiene una cuenta creada en ALYA.
                    </>
                  ) : (
                    "No encontramos ninguna cuenta asociada a este correo de Google."
                  )}
                </span>
              </div>
            </div>
            <div className="pt-1">
              <Link
                href={`/register${params.email ? `?email=${encodeURIComponent(params.email)}` : ""}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-4 py-2 text-xs font-bold text-white transition-all shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-400" />
                <span>Crear Cuenta en ALYA con este Correo</span>
              </Link>
            </div>
          </div>
        )}

        {/* Alerta cuando intenta registrarse con Google pero ya existía cuenta */}
        {params.message === "existing_account" && (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/90 p-4 text-xs text-blue-900 flex items-start gap-2.5 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-sm font-bold">Cuenta ya existente</strong>
              <span className="text-slate-600 block mt-0.5">
                {params.email ? (
                  <>El correo <strong>{params.email}</strong> ya está registrado.</>
                ) : (
                  "Ya tienes una cuenta registrada en ALYA."
                )}{" "}
                Inicia sesión a continuación con tu contraseña o con tu cuenta de Google.
              </span>
            </div>
          </div>
        )}

        {/* Otros errores genéricos */}
        {params.error && params.error !== "account_not_found" && (
          <div className="mb-6 rounded-xl border border-slate-300 bg-slate-100/90 p-3.5 text-xs text-slate-800 font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            <span>
              {params.error === "auth_callback_failed"
                ? "Error al procesar la autenticación externa."
                : params.error}
            </span>
          </div>
        )}

        <LoginForm />

        <div className="mt-8 text-center text-xs text-slate-500 pt-5 border-t border-slate-100">
          ¿Aún no tienes cuenta?{" "}
          <Link href="/register" className="font-bold text-[#2563EB] hover:text-[#1E3A8A] hover:underline transition-colors">
            Crear cuenta aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
