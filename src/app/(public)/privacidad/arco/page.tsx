import { createClient } from "@/lib/supabase/server";
import { ArcoForm } from "@/components/privacy/ArcoForm";
import { getUserArcoRequestsAction } from "@/actions/arco.actions";
import { ShieldCheck, ArrowLeft, Scale } from "lucide-react";
import Link from "next/link";

export default async function ArcoPortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileData = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();
    profileData = profile;
  }

  const { requests } = await getUserArcoRequestsAction();

  const userName = profileData
    ? `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim()
    : "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Breadcrumb & Badge */}
      <div className="flex items-center justify-between">
        <Link
          href="/privacidad"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Política de Privacidad</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          Canal Conforme a la Ley N.° 29733 (MINJUSDH)
        </span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] font-mono">
            Portal de Derechos Ciudadanos
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] mt-1 font-serif">
            Ejercicio de Derechos ARCO
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            En ALYA Perú garantizamos tu derecho constitucional a la
            autodeterminación informativa. Ejerce tus derechos de Acceso,
            Rectificación, Cancelación y Oposición de forma gratuita.
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0 shadow-xs">
          <Scale className="w-6 h-6" />
        </div>
      </div>

      {/* Main Interactive Form */}
      <ArcoForm
        initialRequests={requests || []}
        userEmail={user?.email || ""}
        userName={userName}
      />
    </div>
  );
}
