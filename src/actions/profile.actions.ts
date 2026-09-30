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

    const errors: string[] = [];

    if (!params.firstName || !params.firstName.trim()) {
      errors.push("El nombre es obligatorio.");
    }
    if (!params.lastName || !params.lastName.trim()) {
      errors.push("Los apellidos son obligatorios.");
    }

    if (!params.phone || !params.phone.trim()) {
      errors.push("El número celular de contacto es obligatorio.");
    } else if (!/^9\d{8}$/.test(params.phone.trim())) {
      errors.push("El número celular debe ser un celular peruano válido (9 dígitos comenzando con 9).");
    }

    if (!params.documentNumber || !params.documentNumber.trim()) {
      errors.push("El número de documento de identidad es obligatorio.");
    }

    if (errors.length > 0) {
      return { success: false, error: errors.join(" • ") };
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

    return { success: true, message: "Tus datos personales han sido actualizados con éxito." };
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

    const errors: string[] = [];

    if (!params.firstName || !params.firstName.trim()) {
      errors.push("Los nombres son obligatorios.");
    }
    if (!params.lastName || !params.lastName.trim()) {
      errors.push("Los apellidos son obligatorios.");
    }

    // Phone validation: optional or must be valid 9 digits
    const cleanPhone = params.phone ? params.phone.trim() : "";
    if (cleanPhone && !/^9\d{8}$/.test(cleanPhone)) {
      errors.push("El número celular debe tener 9 dígitos y comenzar con 9 (ej: 987654321).");
    }

    if (!params.bio || params.bio.trim().length < 30) {
      errors.push("Tu presentación profesional debe contener al menos 30 caracteres explicativos.");
    }

    if (!params.virtualAttention && !params.physicalAttention) {
      errors.push("Debes seleccionar al menos una modalidad de atención (virtual o presencial).");
    }

    if (params.yearsExperience < 0 || params.yearsExperience > 70) {
      errors.push("Los años de experiencia deben estar entre 0 y 70 años.");
    }

    if (errors.length > 0) {
      return { success: false, error: errors.join(" • ") };
    }

    // 1. Actualizar datos de usuario en profiles
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        first_name: params.firstName.trim(),
        last_name: params.lastName.trim(),
        phone: cleanPhone || null,
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
      return { success: false, error: "Perfil de abogado no encontrado en la base de datos." };
    }

    // 3. Actualizar lawyer_profiles
    const { error: lawyerUpdateErr } = await supabase
      .from("lawyer_profiles")
      .update({
        bio: params.bio.trim(),
        years_experience: params.yearsExperience,
        consultation_price: params.consultationPrice && params.consultationPrice > 0 ? params.consultationPrice : null,
        virtual_attention: params.virtualAttention,
        physical_attention: params.physicalAttention,
        address_office: params.physicalAttention && params.addressOffice ? params.addressOffice.trim() : null,
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

      // Deduplicate by specialtyId
      const uniqueMap = new Map<number, { specialtyId: number; experienceYears: number; isPrimary: boolean }>();
      for (const s of params.specialties) {
        if (!uniqueMap.has(s.specialtyId)) {
          uniqueMap.set(s.specialtyId, s);
        }
      }

      const specPayload = Array.from(uniqueMap.values()).map((s) => ({
        lawyer_id: lawyer.id,
        specialty_id: s.specialtyId,
        experience_years: Math.max(0, s.experienceYears || 0),
        is_primary: s.isPrimary,
      }));

      const { error: specInsertErr } = await supabase
        .from("lawyer_specialties")
        .insert(specPayload);

      if (specInsertErr) {
        console.error("Error al actualizar especialidades:", specInsertErr);
        return {
          success: false,
          error: `Los datos se guardaron pero ocurrió un error en especialidades: ${specInsertErr.message}`,
        };
      }
    }

    revalidatePath("/lawyer/profile");
    revalidatePath("/lawyer/dashboard");
    revalidatePath("/");

    return { success: true, message: "Tu perfil profesional y especialidades han sido actualizados con éxito." };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al actualizar perfil profesional." };
  }
}
