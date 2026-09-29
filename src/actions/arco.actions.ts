"use server";

import { createClient } from "@/lib/supabase/server";
import {
  SubmitArcoRequestSchema,
  ResolveArcoRequestSchema,
  type SubmitArcoRequestValues,
  type ResolveArcoRequestValues,
} from "@/lib/validations/arco.schema";
import type { ArcoRequestItem } from "@/components/admin/AdminArcoTable";
import { revalidatePath } from "next/cache";

export async function submitArcoRequestAction(formData: SubmitArcoRequestValues) {
  const validated = SubmitArcoRequestSchema.safeParse(formData);
  if (!validated.success) {
    return { error: "Datos de solicitud inválidos", details: validated.error.flatten() };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Calcular plazo perentorio legal (Ley 29733: 20 días para acceso, 10 días para rectificación/cancelación/oposición)
  const isAccess = validated.data.requestType === "access";
  const deadlineDays = isAccess ? 20 : 10;
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + deadlineDays);

  const { data: newRequest, error: insertErr } = await supabase
    .from("arco_requests")
    .insert({
      user_id: user ? user.id : null,
      requester_name: validated.data.requesterName.trim(),
      requester_dni: validated.data.requesterDni.trim(),
      requester_email: validated.data.requesterEmail.trim().toLowerCase(),
      request_type: validated.data.requestType,
      justification: validated.data.justification.trim(),
      supporting_document_url: validated.data.supportingDocumentUrl || null,
      status: "received",
      deadline_at: deadlineDate.toISOString(),
    })
    .select()
    .single();

  if (insertErr) {
    return { error: `Error registrando solicitud ARCO: ${insertErr.message}` };
  }

  // Registrar en bitácora de auditoría forense
  await supabase.from("audit_logs").insert({
    admin_id: user ? user.id : null,
    action: "SUBMIT_ARCO_REQUEST",
    entity_type: "arco_requests",
    entity_id: newRequest.id,
    metadata: {
      request_type: validated.data.requestType,
      requester_dni: validated.data.requesterDni,
      deadline_days: deadlineDays,
    },
  });

  revalidatePath("/privacidad/arco");
  return { success: true, request: newRequest };
}

export async function resolveArcoRequestAction(formData: ResolveArcoRequestValues) {
  const validated = ResolveArcoRequestSchema.safeParse(formData);
  if (!validated.success) {
    return { error: "Datos de resolución inválidos", details: validated.error.flatten() };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("resolve_arco_request", {
    p_request_id: validated.data.requestId,
    p_decision: validated.data.decision,
    p_resolution_notes: validated.data.resolutionNotes.trim(),
  });

  if (error) {
    return { error: `Error dictaminando solicitud: ${error.message}` };
  }

  revalidatePath("/admin/arco");
  revalidatePath("/privacidad/arco");
  return { success: true, result: data };
}

export async function getUserArcoRequestsAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { requests: [] };
  }

  const { data: requests, error } = await supabase
    .from("arco_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { requests: [] };
  return { requests: (requests || []) as unknown as ArcoRequestItem[] };
}

export async function getAdminArcoRequestsAction() {
  const supabase = await createClient();

  const { data: requests, error } = await supabase
    .from("arco_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { requests: [] };
  return { requests: (requests || []) as unknown as ArcoRequestItem[] };
}
