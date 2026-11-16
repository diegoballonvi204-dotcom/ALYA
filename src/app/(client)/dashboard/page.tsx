import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DirectInquiryContainer from "@/components/matching/DirectInquiryContainer";
import type { MatchRecord } from "@/components/matching/SwipeCard";
import { calculateFiveFactorAffinity } from "@/lib/utils";
import { DEFAULT_SPECIALTIES } from "@/lib/constants/lawyers";

const DEMO_UUID_PREFIX_REGEX = /^(?:([0-9a-f])\1{5,}|[a-f]([0-9a-f])\2{6}-)/i;
const SEED_BAR_NUMBERS = new Set(["29140", "35210", "41280", "12450"]);

export const metadata: Metadata = {
  title: "Panel de Consultas | ALYA Perú",
  description:
    "Explora abogados colegiados verificados, compara afinidad real con tu caso y coordina tu asesoría legal.",
};

export default async function ClientDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ lawyerId?: string; specialty?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Obtener perfil del usuario y asegurar separación de roles
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role === "lawyer") {
    redirect("/lawyer/dashboard");
  }
  if (profile?.role === "admin" || profile?.role === "verifier") {
    redirect("/admin");
  }

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

  // 3. Obtener casos del cliente y sus matches registrados
  const { data: cases } = await supabase
    .from("cases")
    .select("*, specialties:specialties!cases_specialty_id_fkey(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const primaryCaseId = cases?.[0]?.id || null;
  const matchByLawyerId = new Map<string, any>();

  if (cases && cases.length > 0) {
    const caseIds = cases.map((c: any) => c.id);
    const { data: existingMatches } = await supabase
      .from("matches")
      .select(
        "id, case_id, lawyer_id, score, status, user_interest, lawyer_interest, conversations(id)"
      )
      .in("case_id", caseIds)
      .neq("status", "discarded");

    for (const m of existingMatches || []) {
      const convObj = Array.isArray((m as any).conversations)
        ? (m as any).conversations[0] || null
        : (m as any).conversations || null;

      if (m.case_id === primaryCaseId) {
        matchByLawyerId.set(m.lawyer_id, {
          ...m,
          conversations: convObj,
        });
      }
    }
  }

  // 4. Obtener abogados de la base de datos (excluyendo al usuario actual por seguridad)
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
        id,
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
    .neq("user_id", user.id)
    .order("rating_average", { ascending: false });

  const requestedSpec = params.specialty
    ? specialties.find(
        (s: any) =>
          s.slug?.toLowerCase() === params.specialty?.toLowerCase() ||
          s.name?.toLowerCase().includes(params.specialty?.toLowerCase() || "")
      )
    : null;

  const affinityCriteria = {
    specialtyId: requestedSpec?.id || cases?.[0]?.specialty_id || specialties[0]?.id || null,
    specialtyName:
      requestedSpec?.name || cases?.[0]?.specialties?.name || specialties[0]?.name || null,
    city: cases?.[0]?.city || profile?.city || "Lima",
    modality: cases?.[0]?.modality || "virtual",
  };

  let mappedLawyers: MatchRecord[] = [];
  if (dbLawyers && dbLawyers.length > 0) {
    mappedLawyers = dbLawyers
      .filter(
        (l: any) =>
          Boolean(l.profiles?.id) &&
          !DEMO_UUID_PREFIX_REGEX.test(l.id) &&
          !(l.user_id && DEMO_UUID_PREFIX_REGEX.test(l.user_id)) &&
          !SEED_BAR_NUMBERS.has(String(l.bar_number || "").trim())
      )
      .map((l: any) => {
        const aff = calculateFiveFactorAffinity(l, affinityCriteria);
        const existingMatch = matchByLawyerId.get(l.id);
        return {
          id: existingMatch?.id || `match-db-${l.id}`,
          case_id: existingMatch?.case_id || cases?.[0]?.id || "direct_inquiry",
          lawyer_id: l.id,
          score: existingMatch?.score ?? aff.score,
          breakdown: aff.breakdown,
          status: existingMatch?.status || "pending",
          user_interest: Boolean(existingMatch?.user_interest),
          lawyer_interest: Boolean(existingMatch?.lawyer_interest),
          conversations: existingMatch?.conversations || null,
          lawyer_profiles: l,
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  const lawyersToDisplay = mappedLawyers;

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
      initialSelectedLawyerId={params.lawyerId}
      initialSpecialtySlug={params.specialty}
      backHref=""
      backLabel=""
    />
  );
}
