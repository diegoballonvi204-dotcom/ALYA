"use server";

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SPECIALTIES } from "@/lib/constants/lawyers";
import { cleanLawyerName } from "@/lib/utils";
import type { LawyerCardData } from "@/components/directory/LawyerCard";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEMO_UUID_PREFIX_REGEX = /^(?:([0-9a-f])\1{5,}|[a-f]([0-9a-f])\2{6}-)/i;
const SEED_BAR_NUMBERS = new Set(["29140", "35210", "41280", "12450"]);

export interface GetLawyersFilters {
  query?: string;
  specialtyId?: number;
  city?: string;
  modality?: "virtual" | "physical" | "all";
  sortBy?: "rating" | "experience" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}

export async function getPublicLawyersAction(filters: GetLawyersFilters = {}) {
  const supabase = await createClient();
  const page = filters.page || 1;
  const limit = filters.limit || 50;

  let query = supabase
    .from("lawyer_profiles")
    .select(`
      id,
      bar_association,
      bar_number,
      years_experience,
      bio,
      consultation_price,
      currency,
      virtual_attention,
      physical_attention,
      address_office,
      rating_average,
      total_reviews,
      verification_status,
      is_available,
      profiles (
        id,
        first_name,
        last_name,
        avatar_url,
        city
      ),
      lawyer_specialties (
        specialty_id,
        is_primary,
        experience_years,
        specialties (
          id,
          name,
          slug
        )
      )
    `)
    .eq("is_available", true)
    .limit(limit);

  if (filters.sortBy === "experience") {
    query = query.order("years_experience", { ascending: false });
  } else if (filters.sortBy === "price_asc") {
    query = query.order("consultation_price", { ascending: true, nullsFirst: false });
  } else if (filters.sortBy === "price_desc") {
    query = query.order("consultation_price", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("rating_average", { ascending: false }).order("total_reviews", { ascending: false });
  }

  const { data, error } = await query;

  let sourceList: LawyerCardData[] = [];

  if (!error && data && data.length > 0) {
    sourceList = data
      .filter(
        (l: any) =>
          Boolean(l.profiles?.id) &&
          !DEMO_UUID_PREFIX_REGEX.test(l.id) &&
          !DEMO_UUID_PREFIX_REGEX.test(l.profiles.id) &&
          !SEED_BAR_NUMBERS.has(String(l.bar_number || "").trim())
      )
      .map((l: any) => ({
        id: l.id,
        firstName: cleanLawyerName(l.profiles?.first_name || "Especialista"),
        lastName: cleanLawyerName(l.profiles?.last_name || ""),
        avatarUrl: l.profiles?.avatar_url || null,
        city: l.profiles?.city || "Lima",
        barAssociation: l.bar_association || "CAL",
        barNumber: l.bar_number || "",
        yearsExperience: l.years_experience || 0,
        bio: l.bio,
        consultationPrice: l.consultation_price ? Number(l.consultation_price) : null,
        currency: l.currency || "PEN",
        virtualAttention: Boolean(l.virtual_attention),
        physicalAttention: Boolean(l.physical_attention),
        addressOffice: l.address_office,
        ratingAverage: Number(l.rating_average) || 5.0,
        totalReviews: Number(l.total_reviews) || 0,
        isVerified:
          l.verification_status === "verified" ||
          (l.verification_status as string) === "approved" ||
          Boolean(l.bar_number),
        specialties: (l.lawyer_specialties || []).map((ls: any) => ({
          id: ls.specialties?.id || ls.specialty_id,
          name: ls.specialties?.name,
          slug: ls.specialties?.slug,
          isPrimary: ls.is_primary,
          experienceYears: ls.experience_years,
        })),
      }));
  }

  let filtered = sourceList;

  if (filters.city && filters.city !== "all") {
    filtered = filtered.filter(
      (l) => l.city.toLowerCase() === filters.city?.toLowerCase()
    );
  }

  if (filters.modality === "virtual") {
    filtered = filtered.filter((l) => l.virtualAttention);
  } else if (filters.modality === "physical") {
    filtered = filtered.filter((l) => l.physicalAttention);
  }

  if (filters.query && filters.query.trim()) {
    const q = filters.query.toLowerCase().trim();
    filtered = filtered.filter((l) => {
      const fullName = `${l.firstName} ${l.lastName}`.toLowerCase();
      const bar = `${l.barAssociation} ${l.barNumber}`.toLowerCase();
      const bio = (l.bio || "").toLowerCase();
      const specs = l.specialties.map((s) => s.name?.toLowerCase() || "").join(" ");
      return fullName.includes(q) || bar.includes(q) || bio.includes(q) || specs.includes(q);
    });
  }

  if (filters.specialtyId) {
    filtered = filtered.filter((l) =>
      l.specialties.some((s) => s.id === Number(filters.specialtyId))
    );
  }

  return {
    lawyers: filtered,
    total: filtered.length,
    page,
    limit,
  };
}

export async function getPublicLawyerDetailAction(lawyerId: string) {
  const supabase = await createClient();

  if (DEMO_UUID_PREFIX_REGEX.test(lawyerId)) {
    return { error: "Abogado no encontrado", lawyer: null };
  }

  if (UUID_REGEX.test(lawyerId)) {
    const { data: lawyer, error } = await supabase
      .from("lawyer_profiles")
      .select(`
        id,
        bar_association,
        bar_number,
        years_experience,
        bio,
        consultation_price,
        currency,
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
          avatar_url,
          city
        ),
        lawyer_specialties (
          specialty_id,
          is_primary,
          experience_years,
          specialties (
            id,
            name,
            slug
          )
        )
      `)
      .eq("id", lawyerId)
      .maybeSingle();

    if (
      !error &&
      lawyer &&
      (lawyer.profiles as any)?.id &&
      !DEMO_UUID_PREFIX_REGEX.test((lawyer.profiles as any).id) &&
      !SEED_BAR_NUMBERS.has(String(lawyer.bar_number || "").trim())
    ) {
      const { data: reviews } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          comment,
          created_at,
          profiles:client_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq("lawyer_id", lawyerId)
        .order("created_at", { ascending: false })
        .limit(10);

      const formatted = {
        id: lawyer.id,
        firstName: cleanLawyerName((lawyer.profiles as any)?.first_name || "Especialista"),
        lastName: cleanLawyerName((lawyer.profiles as any)?.last_name || ""),
        avatarUrl: (lawyer.profiles as any)?.avatar_url || null,
        city: (lawyer.profiles as any)?.city || "Lima",
        barAssociation: lawyer.bar_association || "CAL",
        barNumber: lawyer.bar_number || "",
        yearsExperience: lawyer.years_experience || 0,
        bio: lawyer.bio,
        consultationPrice: lawyer.consultation_price ? Number(lawyer.consultation_price) : null,
        currency: lawyer.currency || "PEN",
        virtualAttention: Boolean(lawyer.virtual_attention),
        physicalAttention: Boolean(lawyer.physical_attention),
        addressOffice: lawyer.address_office,
        ratingAverage: Number(lawyer.rating_average) || 5.0,
        totalReviews: Number(lawyer.total_reviews) || 0,
        isVerified:
          lawyer.verification_status === "verified" ||
          (lawyer.verification_status as string) === "approved" ||
          Boolean(lawyer.bar_number),
        specialties: (lawyer.lawyer_specialties || []).map((ls: any) => ({
          id: ls.specialties?.id || ls.specialty_id,
          name: ls.specialties?.name,
          slug: ls.specialties?.slug,
          isPrimary: ls.is_primary,
          experienceYears: ls.experience_years,
        })),
        reviews: (reviews || []).map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.created_at,
          clientName: `${r.profiles?.first_name || "Cliente"} ${r.profiles?.last_name?.[0] || ""}.`,
          clientAvatar: r.profiles?.avatar_url || null,
        })),
      };

      return { lawyer: formatted };
    }
  }

  return { error: "Abogado no encontrado", lawyer: null };
}

export async function getSpecialtiesCatalogAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("specialties")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !data || data.length === 0) {
    return { specialties: DEFAULT_SPECIALTIES };
  }
  return { specialties: data };
}
