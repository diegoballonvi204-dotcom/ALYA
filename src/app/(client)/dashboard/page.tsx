import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DirectInquiryContainer from "@/components/matching/DirectInquiryContainer";
import type { MatchRecord } from "@/components/matching/SwipeCard";
import {
  DEFAULT_SPECIALTIES,
  CURATED_PERUVIAN_LAWYERS,
} from "@/lib/constants/lawyers";

export default async function ClientDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Obtener perfil del usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 2. Obtener especialidades activas
  const { data: specialtiesData } = await supabase
    .from("specialties")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const specialties =
    specialtiesData && specialtiesData.length > 0
      ? specialtiesData
      : DEFAULT_SPECIALTIES;

  // 3. Obtener casos del cliente
  const { data: cases } = await supabase
    .from("cases")
    .select("*, specialties:specialties!cases_specialty_id_fkey(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // 4. Obtener abogados de la base de datos o usar los curados
  const { data: dbLawyers } = await supabase
    .from("lawyer_profiles")
    .select(`
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
    `)
    .order("rating_average", { ascending: false });

  let mappedLawyers: MatchRecord[] = [];
  if (dbLawyers && dbLawyers.length > 0) {
    mappedLawyers = dbLawyers.map((l: any) => ({
      id: `match-db-${l.id}`,
      case_id: cases?.[0]?.id || "direct_inquiry",
      lawyer_id: l.id,
      score: 95,
      breakdown: {
        specialty_match: true,
        same_city: l.profiles?.city === (profile?.city || "Lima"),
        modality_compatible: true,
        is_available: true,
      },
      status: "pending",
      user_interest: false,
      lawyer_interest: false,
      lawyer_profiles: l,
    }));
  }

  const lawyersToDisplay =
    mappedLawyers.length > 0 ? mappedLawyers : CURATED_PERUVIAN_LAWYERS;

  // 5. Obtener favoritos
  const { data: userFavorites } = await supabase
    .from("favorites")
    .select("target_id")
    .eq("user_id", user.id)
    .eq("target_type", "lawyer");

  const initialFavorites = userFavorites?.map((f) => f.target_id) || [];

  return (
    <DirectInquiryContainer
      initialLawyers={lawyersToDisplay}
      specialties={specialties}
      userCity={profile?.city || "Lima"}
      initialFavorites={initialFavorites}
      userCases={(cases as any) || []}
      backHref=""
      backLabel=""
    />
  );
}
