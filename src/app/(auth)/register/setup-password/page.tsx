import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { GooglePasswordSetupForm } from "@/components/forms/GooglePasswordSetupForm";
import { ShieldCheck } from "lucide-react";

export default async function GoogleSetupPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const initialRole = params.role === "lawyer" ? "lawyer" : "client";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si no hay sesión activa de Google, derivar a registro normal
  if (!user) {
    redirect("/register");
  }

  // Si ya tiene perfil completo, no necesita setup de nuevo
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    if (profile.role === "lawyer") {
      redirect("/lawyer/dashboard");
    } else {
      redirect("/dashboard");
    }
  }

  // Extraer nombres y correo de los metadatos de Google
  const meta = user.user_metadata || {};
  const email = user.email || "";
  const fullName = (meta.full_name || meta.name || "").trim();
  const nameParts = fullName.split(" ");
  const firstName = meta.given_name || meta.first_name || nameParts[0] || "";
  const lastName = meta.family_name || meta.last_name || nameParts.slice(1).join(" ") || "";

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center p-4 sm:p-8 bg-noise">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200/90 bg-white/95 p-7 sm:p-10 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl">
        <div className="text-center mb-6">
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
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#2563EB] mb-2 font-mono uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Paso Final de Registro con Google</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] font-serif">
            Completa tu Cuenta
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Hemos vinculado tus datos de Google. Confirma tu objetivo en la plataforma y define tu contraseña personal.
          </p>
        </div>

        <GooglePasswordSetupForm
          initialEmail={email}
          initialFirstName={firstName}
          initialLastName={lastName}
          initialRole={initialRole}
        />

        <div className="mt-8 text-center text-xs text-slate-400 pt-5 border-t border-slate-100">
          Tus datos personales y de acceso se encuentran encriptados bajo la Ley N.° 29733 de Protección de Datos Personales del Perú.
        </div>
      </div>
    </div>
  );
}
