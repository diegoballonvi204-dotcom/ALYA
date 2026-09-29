"use server";

import { createClient } from "@/lib/supabase/server";
import {
  ClientOnboardingSchema,
  LawyerOnboardingSchema,
  type ClientOnboardingValues,
  type LawyerOnboardingValues,
} from "@/lib/validations/onboarding.schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function submitClientOnboarding(values: ClientOnboardingValues) {
  const parsed = ClientOnboardingSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Datos del cliente no válidos", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesión no válida o expirada" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      phone: parsed.data.phone,
      document_type: parsed.data.documentType,
      document_number: parsed.data.documentNumber,
      city: parsed.data.city,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function submitLawyerOnboarding(values: LawyerOnboardingValues) {
  const parsed = LawyerOnboardingSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Por favor revisa los datos del perfil profesional", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesión no válida o expirada" };
  }

  // 1. Asegurar que el perfil tiene rol 'lawyer'
  await supabase
    .from("profiles")
    .update({ role: "lawyer" })
    .eq("id", user.id);

  // 2. Guardar o actualizar lawyer_profiles
  const { data: lawyerProfile, error: lawyerError } = await supabase
    .from("lawyer_profiles")
    .upsert({
      user_id: user.id,
      bar_association: parsed.data.barAssociation,
      bar_number: parsed.data.barNumber,
      years_experience: parsed.data.yearsExperience,
      bio: parsed.data.bio,
      virtual_attention: parsed.data.virtualAttention,
      physical_attention: parsed.data.physicalAttention,
      address_office: parsed.data.addressOffice || null,
      consultation_price: parsed.data.consultationPrice || null,
      currency: "PEN",
      verification_status: "pending",
      is_available: true,
    })
    .select("id")
    .single();

  if (lawyerError || !lawyerProfile) {
    return { error: `Error guardando perfil profesional: ${lawyerError?.message}` };
  }

  // 3. Asociar especialidades
  const specialtiesPayload = parsed.data.specialties.map((s) => ({
    lawyer_id: lawyerProfile.id,
    specialty_id: s.specialtyId,
    experience_years: s.experienceYears,
    is_primary: s.isPrimary,
  }));

  const { error: specError } = await supabase
    .from("lawyer_specialties")
    .upsert(specialtiesPayload, { onConflict: "lawyer_id,specialty_id" });

  if (specError) {
    return { error: `Error guardando especialidades: ${specError.message}` };
  }

  revalidatePath("/lawyer/dashboard");
  redirect("/lawyer/dashboard?onboarding=complete");
}
