import Link from "next/link";
import Image from "next/image";
import { AlertCircle } from "lucide-react";
import { LoginForm } from "@/components/forms/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
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

        {params.error && (
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
