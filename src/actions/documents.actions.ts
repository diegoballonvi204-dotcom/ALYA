"use server";

import { createClient } from "@/lib/supabase/server";
import {
  UploadCaseDocSchema,
  type UploadCaseDocValues,
} from "@/lib/validations/document.schema";
import { revalidatePath } from "next/cache";

export async function uploadCaseDocumentAction(formData: UploadCaseDocValues) {
  const validated = UploadCaseDocSchema.safeParse(formData);
  if (!validated.success) {
    return { error: "Datos de documento inválidos", details: validated.error.flatten() };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  // 1. Verificar si el usuario es dueño del caso o abogado con match
  const { data: caseItem } = await supabase
    .from("cases")
    .select("id, user_id")
    .eq("id", validated.data.caseId)
    .single();

  if (!caseItem) {
    return { error: "Caso no encontrado." };
  }

  const isClient = caseItem.user_id === user.id;

  // Si no es cliente, verificar si es el abogado con match bilateral
  if (!isClient) {
    const { data: match } = await supabase
      .from("matches")
      .select("id, lawyer_id, status, lawyer_profiles!inner(user_id)")
      .eq("case_id", validated.data.caseId)
      .eq("status", "matched")
      .eq("lawyer_profiles.user_id", user.id)
      .maybeSingle();

    if (!match) {
      return { error: "No tienes permiso para adjuntar documentos a este expediente." };
    }
  }

  // 2. Insertar en public.case_documents
  const { data: newDoc, error: insertErr } = await supabase
    .from("case_documents")
    .insert({
      case_id: validated.data.caseId,
      uploaded_by: user.id,
      file_name: validated.data.fileName,
      storage_path: validated.data.storagePath,
      file_size_bytes: validated.data.fileSizeBytes,
      mime_type: validated.data.mimeType,
      visibility: isClient ? validated.data.visibility : "shared_match",
    })
    .select()
    .single();

  if (insertErr) {
    return { error: `Error registrando documento: ${insertErr.message}` };
  }

  // 3. Notificar en el chat si existe una conversación activa
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("case_id", validated.data.caseId)
    .eq("is_active", true)
    .maybeSingle();

  if (conversation && validated.data.visibility === "shared_match") {
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      message: `📂 Documento adjuntado al expediente: "${validated.data.fileName}"`,
      attachment_url: validated.data.storagePath,
      attachment_type: "document",
    });
    revalidatePath(`/chat/${conversation.id}`);
  }

  revalidatePath(`/cases/${validated.data.caseId}`);
  return { success: true, document: newDoc };
}

export async function getCaseDocumentsAction(caseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado", documents: [] };
  }

  // Verificar rol del usuario en este caso
  const { data: caseItem } = await supabase
    .from("cases")
    .select("id, user_id")
    .eq("id", caseId)
    .single();

  if (!caseItem) {
    return { error: "Caso no encontrado", documents: [] };
  }

  const isClient = caseItem.user_id === user.id;

  let query = supabase
    .from("case_documents")
    .select(`
      id,
      case_id,
      uploaded_by,
      file_name,
      storage_path,
      file_size_bytes,
      mime_type,
      visibility,
      created_at,
      profiles:uploaded_by (
        first_name,
        last_name,
        role
      )
    `)
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  // Si no es el cliente, solo ve documentos compartidos o los que el mismo abogado subió
  if (!isClient) {
    query = query.or(`visibility.eq.shared_match,uploaded_by.eq.${user.id}`);
  }

  const { data: docs, error } = await query;

  if (error) {
    return { error: error.message, documents: [] };
  }

  const formatted = (docs || []).map((d: any) => ({
    id: d.id,
    caseId: d.case_id,
    uploadedBy: d.uploaded_by,
    uploaderName: `${d.profiles?.first_name || ""} ${d.profiles?.last_name || ""}`.trim(),
    uploaderRole: d.profiles?.role || "user",
    fileName: d.file_name,
    storagePath: d.storage_path,
    fileSizeBytes: d.file_size_bytes,
    mimeType: d.mime_type,
    visibility: d.visibility,
    createdAt: d.created_at,
    isOwner: d.uploaded_by === user.id,
  }));

  return { documents: formatted, isClient };
}

export async function getCaseDocumentSignedUrlAction(documentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const { data: doc, error: docErr } = await supabase
    .from("case_documents")
    .select("id, storage_path, case_id, visibility, uploaded_by")
    .eq("id", documentId)
    .single();

  if (docErr || !doc) {
    return { error: "Documento no encontrado." };
  }

  // Generar URL firmada con expiración de 1 hora (3600 segundos)
  const { data: signed, error: signErr } = await supabase.storage
    .from("case-documents")
    .createSignedUrl(doc.storage_path, 3600);

  if (signErr || !signed) {
    return { error: `No se pudo generar el enlace seguro: ${signErr?.message}` };
  }

  return { signedUrl: signed.signedUrl };
}

export async function toggleDocumentVisibilityAction(
  documentId: string,
  visibility: "private_client" | "shared_match"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const { data: doc } = await supabase
    .from("case_documents")
    .select("id, case_id, uploaded_by, cases!inner(user_id)")
    .eq("id", documentId)
    .single();

  if (!doc) return { error: "Documento no encontrado" };

  const isCaseOwner = (doc.cases as any)?.user_id === user.id;
  const isUploader = doc.uploaded_by === user.id;

  if (!isCaseOwner && !isUploader) {
    return { error: "Solo el titular del caso puede alterar la visibilidad." };
  }

  const { error: updateErr } = await supabase
    .from("case_documents")
    .update({ visibility })
    .eq("id", documentId);

  if (updateErr) {
    return { error: `Error al actualizar visibilidad: ${updateErr.message}` };
  }

  revalidatePath(`/cases/${doc.case_id}`);
  return { success: true, visibility };
}
