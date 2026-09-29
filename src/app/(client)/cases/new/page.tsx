import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateCaseForm from "@/components/forms/CreateCaseForm";
import { ArrowLeft, Shield } from "lucide-react";

export default async function NewCasePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/cases/new");
  }

  // 1. Obtener perfil de usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("city")
    .eq("id", user.id)
    .single();

  // 2. Obtener especialidades peruanas
  const { data: specialties } = await supabase
    .from("specialties")
    .select("id, name, slug, parent_id, description")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  return (
    <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-12 py-8 space-y-6">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a mis casos
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 font-mono">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          Matching Jurídico Cifrado • Ley N.° 29733
        </span>
      </div>

      {/* Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] font-mono">
          Asesoría Jurídica de Precisión
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] font-serif mt-1">
          Publica tu Caso Jurídico
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl font-sans">
          Nuestro motor analizará tu solicitud y te presentará a los abogados colegiados más idóneos según materia, ciudad y disponibilidad.
        </p>
      </div>

      {/* Form Component */}
      <CreateCaseForm
        specialties={specialties || []}
        userCity={profile?.city || "Lima"}
      />
    </div>
  );
}
