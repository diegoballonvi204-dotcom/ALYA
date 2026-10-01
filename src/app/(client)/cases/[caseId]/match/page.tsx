import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import MatchingContainer from "@/components/matching/MatchingContainer";
import type { MatchRecord } from "@/components/matching/SwipeCard";

export default async function CaseMatchingPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/cases/${caseId}/match`);
  }

  // 1. Obtener datos del caso y validar propiedad
  const { data: caseData, error: caseErr } = await supabase
    .from("cases")
    .select(`
      id,
      title,
      description,
      city,
      modality,
      urgency,
      user_id,
      specialty_id,
      specialties:specialties!cases_specialty_id_fkey (
        name
      )
    `)
    .eq("id", caseId)
    .maybeSingle();

  if (caseErr) {
    console.error("Error al obtener caso en match page:", caseErr);
  }

  if (!caseData) {
    notFound();
  }

  if (caseData.user_id !== user.id) {
    redirect("/dashboard");
  }

  // 2. Obtener matches persistidos del caso
  let { data: matches } = await supabase
    .from("matches")
    .select(`
      id,
      case_id,
      lawyer_id,
      score,
      breakdown,
      status,
      user_interest,
      lawyer_interest,
      lawyer_profiles!inner (
        id,
        user_id,
        bar_association,
        bar_number,
        professional_title,
        years_experience,
        bio,
        consultation_price,
        virtual_attention,
        physical_attention,
        address_office,
        rating_average,
        total_reviews,
        verification_status,
        profiles (
          first_name,
          last_name,
          city,
          avatar_url
        ),
        lawyer_specialties (
          is_primary,
          experience_years,
          specialties (
            id,
            name,
            slug
          )
        )
      )
    `)
    .eq("case_id", caseId)
    .neq("status", "discarded")
    .order("score", { ascending: false });

  // Si no hay matches persistidos aún, ejecutar cálculo en caliente
  if (!matches || matches.length === 0) {
    const { data: scoredLawyers } = await supabase.rpc(
      "calculate_case_matches",
      { p_case_id: caseId }
    );

    if (scoredLawyers && scoredLawyers.length > 0) {
      const matchesPayload = scoredLawyers.map((l: any) => ({
        case_id: caseId,
        lawyer_id: l.lawyer_id,
        score: l.total_score,
        breakdown: l.breakdown,
        status: "pending" as const,
        user_interest: false,
        lawyer_interest: false,
      }));

      await supabase.from("matches").insert(matchesPayload);

      // Re-consultar matches con las relaciones completas
      const { data: reloadedMatches } = await supabase
        .from("matches")
        .select(`
          id,
          case_id,
          lawyer_id,
          score,
          breakdown,
          status,
          user_interest,
          lawyer_interest,
          lawyer_profiles!inner (
            id,
            user_id,
            bar_association,
            bar_number,
            professional_title,
            years_experience,
            bio,
            consultation_price,
            virtual_attention,
            physical_attention,
            address_office,
            rating_average,
            total_reviews,
            verification_status,
            profiles (
              first_name,
              last_name,
              city,
              avatar_url
            ),
            lawyer_specialties (
              is_primary,
              experience_years,
              specialties (
                id,
                name,
                slug
              )
            )
          )
        `)
        .eq("case_id", caseId)
        .neq("status", "discarded")
        .order("score", { ascending: false });

      matches = reloadedMatches || [];
    }
  }

  // 3. Obtener lista de favoritos del usuario
  const { data: userFavorites } = await supabase
    .from("favorites")
    .select("target_id")
    .eq("user_id", user.id)
    .eq("target_type", "lawyer");

  const initialFavorites = userFavorites?.map((f) => f.target_id) || [];

  return (
    <MatchingContainer
      matches={(matches as unknown as MatchRecord[]) || []}
      caseData={caseData as any}
      initialFavorites={initialFavorites}
    />
  );
}
