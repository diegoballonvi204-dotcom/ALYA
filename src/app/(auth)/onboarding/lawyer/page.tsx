import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LawyerOnboardingForm } from "@/components/forms/LawyerOnboardingForm";

export default async function LawyerOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding/lawyer");
  }

  // Cargar catálogo de especialidades desde la BD de Supabase
  const { data: specialties } = await supabase
    .from("specialties")
    .select("id, name, slug, parent_id")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  // Obtener perfil existente si el usuario ya había iniciado onboarding
  const { data: existingLawyer } = await supabase
    .from("lawyer_profiles")
    .select(`
      id,
      bar_association,
      bar_number,
      years_experience,
      bio,
      virtual_attention,
      physical_attention,
      address_office,
      consultation_price,
      lawyer_specialties (
        specialty_id,
        experience_years,
        is_primary
      )
    `)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: existingVerif } = existingLawyer
    ? await supabase
        .from("verifications")
        .select("documents_metadata")
        .eq("lawyer_id", existingLawyer.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-8">
      <LawyerOnboardingForm
        specialties={specialties || []}
        userEmail={user.email || ""}
        userId={user.id}
        initialData={
          existingLawyer
            ? {
                barAssociation: existingLawyer.bar_association,
                barNumber: existingLawyer.bar_number,
                yearsExperience: existingLawyer.years_experience,
                bio: existingLawyer.bio || "",
                virtualAttention: existingLawyer.virtual_attention,
                physicalAttention: existingLawyer.physical_attention,
                addressOffice: existingLawyer.address_office || "",
                consultationPrice: existingLawyer.consultation_price || 120,
                specialties: (existingLawyer.lawyer_specialties as any) || [],
                documents: (existingVerif?.documents_metadata as any) || {},
              }
            : undefined
        }
      />
    </div>
  );
}
