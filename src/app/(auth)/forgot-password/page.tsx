import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Recuperar Contraseña | ALYA Perú",
  description:
    "Solicita un enlace seguro por correo electrónico para restablecer tu contraseña en ALYA Perú.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center p-4 sm:p-8 bg-noise">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white/95 p-7 sm:p-10 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-block mb-3">
            <Image
              src="/logoAlya.png"
              alt="ALYA LegalTech"
              width={180}
              height={54}
              priority
              className="h-14 w-auto mx-auto object-contain"
            />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] font-serif">
            Recuperar Contraseña
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Ingresa el correo asociado a tu cuenta para enviarte instrucciones de restablecimiento.
          </p>
        </div>

        <ForgotPasswordForm />

        <div className="text-center pt-4 border-t border-slate-100">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Iniciar Sesión</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

