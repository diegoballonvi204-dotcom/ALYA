import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClientProfileEditor from "@/components/client/ClientProfileEditor";
import Link from "next/link";
import { User, ArrowLeft, FolderKanban } from "lucide-react";

export default async function ClientProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  // 1. Obtener perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/onboarding/client");
  }

  // Si es abogado, redirigir a su perfil profesional
  if (profile.role === "lawyer") {
    redirect("/lawyer/profile");
  }

  return (
    <div className="w-full max-w-[900px] mx-auto px-6 sm:px-10 lg:px-12 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-blue-100 text-blue-700">
              <User className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] font-serif">
                Mi Perfil
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Gestiona tu información de contacto y datos de identificación.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Mis Casos</span>
        </Link>
      </div>

      <ClientProfileEditor
        initialData={{
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          phone: profile.phone || "",
          documentType: (profile.document_type as any) || "DNI",
          documentNumber: profile.document_number || "",
          city: profile.city || "Lima",
          email: user.email || "",
        }}
      />
    </div>
  );
}
