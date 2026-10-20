"use server";

import { createClient } from "@/lib/supabase/server";
import {
  UploadVerificationDocsSchema,
  ResolveVerificationSchema,
  type UploadVerificationDocsValues,
  type ResolveVerificationValues,
} from "@/lib/validations/verification.schema";
import { revalidatePath } from "next/cache";

export async function submitLawyerDocumentsAction(formData: UploadVerificationDocsValues) {
  const validated = UploadVerificationDocsSchema.safeParse(formData);
  if (!validated.success) {
    return { error: "Datos de archivos inválidos", details: validated.error.flatten() };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  // 1. Validar que el abogado le pertenece al usuario
  const { data: lawyer, error: lawyerErr } = await supabase
    .from("lawyer_profiles")
    .select("id")
    .eq("id", validated.data.lawyerId)
    .eq("user_id", user.id)
    .single();

  if (lawyerErr || !lawyer) {
    return { error: "No tienes permiso para actualizar este perfil profesional." };
  }

  // 2. Insertar o actualizar public.verifications
  const { error: verifErr } = await supabase
    .from("verifications")
    .upsert(
      {
        lawyer_id: lawyer.id,
        identity_status: "in_review",
        bar_status: "in_review",
        documents_metadata: {
          dni_front: validated.data.dniFrontPath,
          dni_back: validated.data.dniBackPath,
          bar_card: validated.data.barCardPath,
          habilitation_cert: validated.data.habilitationCertPath || null,
          uploaded_at: new Date().toISOString(),
        },
        rejection_reason: null,
      },
      { onConflict: "lawyer_id" }
    );

  if (verifErr) {
    return { error: `Error registrando documentos: ${verifErr.message}` };
  }

  // 3. Sincronizar lawyer_profiles a 'in_review'
  await supabase
    .from("lawyer_profiles")
    .update({ verification_status: "in_review" })
    .eq("id", lawyer.id);

  revalidatePath("/lawyer/verification");
  revalidatePath("/lawyer/dashboard");

  return { success: true };
}

export async function getVerificationSignedUrlAction(filePath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const { data, error } = await supabase.storage
    .from("verification-documents")
    .createSignedUrl(filePath, 3600); // 60 minutos de vigencia

  if (error || !data?.signedUrl) {
    return { error: error?.message || "Error generando URL de visualización segura" };
  }

  return { signedUrl: data.signedUrl };
}

import { sendLawyerApprovalEmail } from "@/lib/services/email.service";

export async function resolveVerificationAdminAction(params: ResolveVerificationValues) {
  const validated = ResolveVerificationSchema.safeParse(params);
  if (!validated.success) {
    return { error: "Parámetros de resolución inválidos", details: validated.error.flatten() };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  // 1. Validar rol admin o verifier
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "verifier") {
    return { error: "Acceso denegado: Se requieren permisos administrativos." };
  }

  // 2. Ejecutar función transaccional en Supabase
  const { data, error } = await supabase.rpc(
    "resolve_lawyer_verification" as any,
    {
      p_verification_id: validated.data.verificationId,
      p_decision: validated.data.decision,
      p_rejection_reason: validated.data.rejectionReason || null,
      p_admin_notes: validated.data.adminNotes || null,
    }
  );

  if (error) {
    return { error: `Error resolviendo verificación: ${error.message}` };
  }

  // 3. Si fue aprobado ('verified'), generar código de activación único y enviar por correo
  if (validated.data.decision === "verified") {
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Obtener lawyer_id de la verificación
    const { data: verifRecord } = await supabase
      .from("verifications")
      .select("lawyer_id")
      .eq("id", validated.data.verificationId)
      .single();

    if (verifRecord?.lawyer_id) {
      // Guardar código en verifications y lawyer_profiles
      await supabase
        .from("verifications")
        .update({
          activation_code: activationCode,
          is_code_verified: false,
        } as any)
        .eq("id", validated.data.verificationId);

      await supabase
        .from("lawyer_profiles")
        .update({
          activation_code: activationCode,
          is_activated: false,
        } as any)
        .eq("id", verifRecord.lawyer_id);

      // Obtener correo del abogado
      const { data: lawyerInfo } = await supabase.rpc("get_lawyer_user_email" as any, {
        p_lawyer_id: verifRecord.lawyer_id,
      });

      const lawyerUser = Array.isArray(lawyerInfo) ? lawyerInfo[0] : lawyerInfo;
      if (lawyerUser?.email) {
        const fullName = `${lawyerUser.first_name || ""} ${lawyerUser.last_name || ""}`.trim();
        await sendLawyerApprovalEmail({
          toEmail: lawyerUser.email,
          lawyerName: fullName,
          code: activationCode,
        });
      }
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/verifications");
  revalidatePath(`/admin/verifications/${validated.data.verificationId}`);
  revalidatePath("/admin/audit");
  revalidatePath("/lawyer/dashboard");
  revalidatePath("/lawyer/verification");

  return { success: true, result: data };
}

/**
 * Validar el código de activación de 6 dígitos que el abogado recibió por correo
 */
export async function verifyLawyerActivationCodeAction(code: string) {
  if (!code || code.trim().length !== 6) {
    return { error: "El código de verificación debe tener 6 dígitos numéricos." };
  }

  const cleanCode = code.trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  // 1. Obtener perfil del abogado
  const { data: lawyer, error: lawyerErr } = await supabase
    .from("lawyer_profiles")
    .select("id, verification_status, activation_code, is_activated")
    .eq("user_id", user.id)
    .single();

  if (lawyerErr || !lawyer) {
    return { error: "Perfil de abogado no encontrado." };
  }

  if (lawyer.verification_status !== "verified") {
    return { error: "Tu documentación aún no ha sido aprobada por la administración." };
  }

  if (lawyer.activation_code !== cleanCode) {
    return { error: "El código ingresado es incorrecto. Revisa tu correo electrónico." };
  }

  // 2. Activar perfil y marcar verificación como completada
  await supabase
    .from("lawyer_profiles")
    .update({
      is_activated: true,
    } as any)
    .eq("id", lawyer.id);

  await supabase
    .from("verifications")
    .update({
      is_code_verified: true,
    } as any)
    .eq("lawyer_id", lawyer.id);

  revalidatePath("/lawyer/dashboard");
  revalidatePath("/lawyer/verification");
  revalidatePath("/lawyer/profile");

  return { success: true };
}

/**
 * Reenviar el código de activación al correo del abogado
 */
export async function resendLawyerActivationCodeAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: "No autenticado" };
  }

  const { data: lawyer } = await supabase
    .from("lawyer_profiles")
    .select("id, verification_status, activation_code, is_activated")
    .eq("user_id", user.id)
    .single();

  if (!lawyer) {
    return { error: "Perfil de abogado no encontrado" };
  }

  if (lawyer.verification_status !== "verified") {
    return { error: "Tus documentos aún están en proceso de revisión." };
  }

  const newCode = Math.floor(100000 + Math.random() * 900000).toString();

  await supabase
    .from("lawyer_profiles")
    .update({ activation_code: newCode, is_activated: false } as any)
    .eq("id", lawyer.id);

  await supabase
    .from("verifications")
    .update({ activation_code: newCode, is_code_verified: false } as any)
    .eq("lawyer_id", lawyer.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  const fullName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : "";

  await sendLawyerApprovalEmail({
    toEmail: user.email,
    lawyerName: fullName,
    code: newCode,
  });

  return { success: true };
}
