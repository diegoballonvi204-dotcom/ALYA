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

  revalidatePath("/admin");
  revalidatePath("/admin/verifications");
  revalidatePath(`/admin/verifications/${validated.data.verificationId}`);
  revalidatePath("/admin/audit");

  return { success: true, result: data };
}
