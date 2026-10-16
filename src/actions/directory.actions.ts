"use server";

import { createClient } from "@/lib/supabase/server";

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
  const limit = filters.limit || 12;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

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
      profiles!inner (
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
    `, { count: "exact" })
    .eq("is_available", true);

  // Filtro por ciudad
  if (filters.city && filters.city !== "all") {
    query = query.eq("profiles.city", filters.city);
  }

  // Filtro por modalidad
  if (filters.modality === "virtual") {
    query = query.eq("virtual_attention", true);
  } else if (filters.modality === "physical") {
    query = query.eq("physical_attention", true);
  }

  // Ordenamiento
  if (filters.sortBy === "experience") {
    query = query.order("years_experience", { ascending: false });
  } else if (filters.sortBy === "price_asc") {
    query = query.order("consultation_price", { ascending: true, nullsFirst: false });
  } else if (filters.sortBy === "price_desc") {
    query = query.order("consultation_price", { ascending: false, nullsFirst: false });
  } else {
    // Por defecto: mejor calificación
    query = query.order("rating_average", { ascending: false }).order("total_reviews", { ascending: false });
  }

  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    return { error: error.message, lawyers: [], total: 0 };
  }

  let filtered = data || [];

  // Filtrado post-query para texto y especialidad si aplica
  if (filters.query && filters.query.trim()) {
    const q = filters.query.toLowerCase().trim();
    filtered = filtered.filter((l: any) => {
      const fullName = `${l.profiles?.first_name || ""} ${l.profiles?.last_name || ""}`.toLowerCase();
      const bar = `${l.bar_association || ""} ${l.bar_number || ""}`.toLowerCase();
      const bio = (l.bio || "").toLowerCase();
      const specs = (l.lawyer_specialties || []).map((s: any) => s.specialties?.name?.toLowerCase() || "").join(" ");
      return fullName.includes(q) || bar.includes(q) || bio.includes(q) || specs.includes(q);
    });
  }

  if (filters.specialtyId) {
    filtered = filtered.filter((l: any) => {
      return (l.lawyer_specialties || []).some((s: any) => s.specialty_id === Number(filters.specialtyId));
    });
  }

  const formattedLawyers = filtered.map((l: any) => ({
    id: l.id,
    firstName: l.profiles?.first_name || "",
    lastName: l.profiles?.last_name || "",
    avatarUrl: l.profiles?.avatar_url || null,
    city: l.profiles?.city || "Lima",
    barAssociation: l.bar_association,
    barNumber: l.bar_number,
    yearsExperience: l.years_experience,
    bio: l.bio,
    consultationPrice: l.consultation_price ? Number(l.consultation_price) : null,
    currency: l.currency || "PEN",
    virtualAttention: l.virtual_attention,
    physicalAttention: l.physical_attention,
    addressOffice: l.address_office,
    ratingAverage: Number(l.rating_average) || 5.0,
    totalReviews: Number(l.total_reviews) || 0,
    isVerified: l.verification_status === "verified" || (l.verification_status as string) === "approved" || !!l.bar_number,
    specialties: (l.lawyer_specialties || []).map((ls: any) => ({
      id: ls.specialties?.id,
      name: ls.specialties?.name,
      slug: ls.specialties?.slug,
      isPrimary: ls.is_primary,
      experienceYears: ls.experience_years,
    })),
  }));

  return {
    lawyers: formattedLawyers,
    total: count || formattedLawyers.length,
    page,
    limit,
  };
}

export async function getPublicLawyerDetailAction(lawyerId: string) {
  const supabase = await createClient();

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
      profiles!inner (
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
    .single();

  if (error || !lawyer) {
    return { error: "Abogado no encontrado", lawyer: null };
  }

  // Obtener opiniones públicas aprobadas
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
    firstName: (lawyer.profiles as any)?.first_name || "",
    lastName: (lawyer.profiles as any)?.last_name || "",
    avatarUrl: (lawyer.profiles as any)?.avatar_url || null,
    city: (lawyer.profiles as any)?.city || "Lima",
    barAssociation: lawyer.bar_association,
    barNumber: lawyer.bar_number,
    yearsExperience: lawyer.years_experience,
    bio: lawyer.bio,
    consultationPrice: lawyer.consultation_price ? Number(lawyer.consultation_price) : null,
    currency: lawyer.currency || "PEN",
    virtualAttention: lawyer.virtual_attention,
    physicalAttention: lawyer.physical_attention,
    addressOffice: lawyer.address_office,
    ratingAverage: Number(lawyer.rating_average) || 5.0,
    totalReviews: Number(lawyer.total_reviews) || 0,
    isVerified: lawyer.verification_status === "verified" || (lawyer.verification_status as string) === "approved" || !!lawyer.bar_number,
    specialties: (lawyer.lawyer_specialties || []).map((ls: any) => ({
      id: ls.specialties?.id,
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

export async function getSpecialtiesCatalogAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("specialties")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) return { specialties: [] };
  return { specialties: data || [] };
}
