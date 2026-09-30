import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LawyerProfileEditor from "@/components/lawyer/LawyerProfileEditor";
import LawyerTierBadge from "@/components/lawyer/LawyerTierBadge";
import { getMyLawyerSubscriptionAction } from "@/actions/subscription.actions";
import Link from "next/link";
import { ArrowLeft, UserCircle2 } from "lucide-react";

export default async function LawyerProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/lawyer/profile");
  }

  // 1. Obtener perfil de abogado y perfil base
  const { data: lawyer } = await supabase
    .from("lawyer_profiles")
    .select("*, profiles(*)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!lawyer) {
    redirect("/onboarding/lawyer");
  }

  // 2. Obtener especialidades del abogado
  const { data: lawyerSpecialties } = await supabase
    .from("lawyer_specialties")
    .select("specialty_id, experience_years, is_primary")
    .eq("lawyer_id", lawyer.id);

  // 3. Obtener catálogo completo de especialidades
  const { data: specialtiesCatalog } = await supabase
    .from("specialties")
    .select("id, name, slug, parent_id")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  // 4. Obtener suscripción para mostrar badge
  const subRes = await getMyLawyerSubscriptionAction();
  const tier = subRes.plan?.tier || "starter";

  const formattedSpecialties = (lawyerSpecialties || []).map((ls) => ({
    specialtyId: ls.specialty_id,
    experienceYears: ls.experience_years,
    isPrimary: ls.is_primary,
  }));

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 sm:px-10 lg:px-12 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-blue-100 text-blue-700">
              <UserCircle2 className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] font-serif">
                  Mi Perfil Profesional
                </h1>
                <LawyerTierBadge tier={tier} size="sm" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Actualiza tus datos de contacto, presentación legal, honorarios y especialidades jurídicas.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/lawyer/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Dashboard</span>
        </Link>
      </div>

      {/* Editor Form */}
      <LawyerProfileEditor
        initialData={{
          firstName: lawyer.profiles?.first_name || "",
          lastName: lawyer.profiles?.last_name || "",
          phone: lawyer.profiles?.phone || "",
          city: lawyer.profiles?.city || "Lima",
          email: user.email || "",
          barAssociation: lawyer.bar_association,
          barNumber: lawyer.bar_number,
          yearsExperience: lawyer.years_experience,
          bio: lawyer.bio || "",
          consultationPrice: lawyer.consultation_price,
          virtualAttention: lawyer.virtual_attention,
          physicalAttention: lawyer.physical_attention,
          addressOffice: lawyer.address_office,
          isAvailable: lawyer.is_available,
          verificationStatus: lawyer.verification_status,
        }}
        lawyerSpecialties={formattedSpecialties}
        specialtiesCatalog={specialtiesCatalog || []}
      />
    </div>
  );
}
