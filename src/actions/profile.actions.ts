"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UpdateClientProfileParams {
  firstName: string;
  lastName: string;
  phone: string;
  documentType: "DNI" | "CE" | "PASAPORTE";
  documentNumber: string;
  city: string;
}

export interface UpdateLawyerProfileParams {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  bio: string;
  yearsExperience: number;
  consultationPrice?: number;
  virtualAttention: boolean;
  physicalAttention: boolean;
  addressOffice?: string;
  isAvailable?: boolean;
  specialties?: {
    specialtyId: number;
    experienceYears: number;
    isPrimary: boolean;
  }[];
}

/**
 * Actualiza los datos del perfil de un usuario cliente.
 */
export async function updateClientProfileAction(params: UpdateClientProfileParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para editar tu perfil." };
    }

    if (!params.firstName.trim() || !params.lastName.trim()) {
      return { success: false, error: "Ingresa tus nombres y apellidos completos." };
    }

    if (!/^9\d{8}$/.test(params.phone.trim())) {
      return { success: false, error: "Ingresa un número celular peruano válido (9 dígitos comenzando con 9)." };
    }

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        first_name: params.firstName.trim(),
        last_name: params.lastName.trim(),
        phone: params.phone.trim(),
        document_type: params.documentType,
        document_number: params.documentNumber.trim(),
        city: params.city,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileErr) {
      return { success: false, error: profileErr.message };
    }

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/");

    return { success: true, message: "Perfil actualizado con éxito." };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al actualizar perfil." };
  }
}

/**
 * Actualiza los datos del perfil profesional de un abogado.
 */
export async function updateLawyerProfileAction(params: UpdateLawyerProfileParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para editar tu perfil profesional." };
    }

    if (!params.firstName.trim() || !params.lastName.trim()) {
      return { success: false, error: "Ingresa tus nombres y apellidos completos." };
    }

    if (params.bio.trim().length < 30) {
      return { success: false, error: "Tu presentación profesional debe contener al menos 30 caracteres." };
    }

    if (!params.virtualAttention && !params.physicalAttention) {
      return { success: false, error: "Debes seleccionar al menos una modalidad de atención (virtual o presencial)." };
    }

    // 1. Actualizar datos de usuario en profiles
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        first_name: params.firstName.trim(),
        last_name: params.lastName.trim(),
        phone: params.phone.trim(),
        city: params.city,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileErr) {
      return { success: false, error: `Error en perfil personal: ${profileErr.message}` };
    }

    // 2. Obtener el ID de lawyer_profiles
    const { data: lawyer, error: lpFetchErr } = await supabase
      .from("lawyer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (lpFetchErr || !lawyer) {
      return { success: false, error: "Perfil de abogado no encontrado." };
    }

    // 3. Actualizar lawyer_profiles
    const { error: lawyerUpdateErr } = await supabase
      .from("lawyer_profiles")
      .update({
        bio: params.bio.trim(),
        years_experience: params.yearsExperience,
        consultation_price: params.consultationPrice || null,
        virtual_attention: params.virtualAttention,
        physical_attention: params.physicalAttention,
        address_office: params.addressOffice?.trim() || null,
        is_available: params.isAvailable ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lawyer.id);

    if (lawyerUpdateErr) {
      return { success: false, error: `Error en perfil profesional: ${lawyerUpdateErr.message}` };
    }

    // 4. Actualizar especialidades si fueron enviadas
    if (params.specialties && params.specialties.length > 0) {
      // Eliminar especialidades previas
      await supabase
        .from("lawyer_specialties")
        .delete()
        .eq("lawyer_id", lawyer.id);

      // Insertar nuevas
      const specPayload = params.specialties.map((s) => ({
        lawyer_id: lawyer.id,
        specialty_id: s.specialtyId,
        experience_years: s.experienceYears,
        is_primary: s.isPrimary,
      }));

      const { error: specInsertErr } = await supabase
        .from("lawyer_specialties")
        .insert(specPayload);

      if (specInsertErr) {
        console.error("Error al actualizar especialidades:", specInsertErr);
      }
    }

    revalidatePath("/lawyer/profile");
    revalidatePath("/lawyer/dashboard");
    revalidatePath("/");

    return { success: true, message: "Perfil profesional actualizado exitosamente." };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al actualizar perfil profesional." };
  }
}
