"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import crypto from "crypto";

export interface CreateFeeAgreementInput {
  caseId: string;
  title: string;
  scopeDescription: string;
  stages?: Array<{ title: string; price: number; description?: string }>;
  fixedFee: number;
  successFeePercentage?: number | null;
  expensesTerms?: string;
  conversationId?: string | null;
}

export interface SignFeeAgreementInput {
  agreementId: string;
  clientFullName: string;
  clientDni: string;
  acceptTerms: boolean;
}

export async function createFeeAgreementAction(input: CreateFeeAgreementInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  // 1. Verificar perfil de abogado
  const { data: lp, error: lpErr } = await supabase
    .from("lawyer_profiles")
    .select("id, bar_association, bar_number, profiles(first_name, last_name)")
    .eq("user_id", user.id)
    .single();

  if (lpErr || !lp) {
    return { error: "Solo los abogados habilitados pueden emitir convenios de patrocinio." };
  }

  // 2. Obtener caso para identificar al cliente
  const { data: caseItem, error: caseErr } = await supabase
    .from("cases")
    .select("id, user_id, title")
    .eq("id", input.caseId)
    .single();

  if (caseErr || !caseItem) {
    return { error: "Caso legal no encontrado." };
  }

  const stagesJson = input.stages && input.stages.length > 0 ? input.stages : [];
  const defaultExpenses =
    input.expensesTerms?.trim() ||
    "Los aranceles judiciales, tasas del Poder Judicial y cédulas de notificación serán asumidos íntegramente por el cliente conforme al Art. 1764 del Código Civil.";

  // 3. Crear hash base
  const termsPayload = JSON.stringify({
    caseId: input.caseId,
    lawyerId: lp.id,
    clientId: caseItem.user_id,
    title: input.title,
    fixedFee: input.fixedFee,
    successFeePercentage: input.successFeePercentage || 0,
    timestamp: new Date().toISOString(),
  });
  const preliminaryHash = crypto.createHash("sha256").update(termsPayload).digest("hex");

  // 4. Insertar acuerdo en fee_agreements
  const { data: agreement, error: insertErr } = await supabase
    .from("fee_agreements")
    .insert({
      case_id: input.caseId,
      lawyer_id: lp.id,
      client_id: caseItem.user_id,
      conversation_id: input.conversationId || null,
      title: input.title.trim(),
      scope_description: input.scopeDescription.trim(),
      stages: stagesJson as any,
      fixed_fee: Number(input.fixedFee),
      success_fee_percentage: input.successFeePercentage ? Number(input.successFeePercentage) : null,
      expenses_terms: defaultExpenses,
      status: "pending_client_signature",
      lawyer_signed_at: new Date().toISOString(),
      agreement_hash: preliminaryHash,
    })
    .select()
    .single();

  if (insertErr) {
    return { error: `Error creando convenio: ${insertErr.message}` };
  }

  // 5. Notificar en el chat si existe conversación
  if (input.conversationId) {
    const lawyerName = `${(lp.profiles as any)?.first_name || "Abogado"} ${(lp.profiles as any)?.last_name || ""}`.trim();
    const feeText = `S/ ${Number(input.fixedFee).toFixed(2)}${
      input.successFeePercentage ? ` + ${input.successFeePercentage}% de cuota litis / éxito` : ""
    }`;

    await supabase.from("messages").insert({
      conversation_id: input.conversationId,
      sender_id: user.id,
      message: `📜 **Propuesta de Hoja de Encargo / Convenio de Honorarios**\n**Materia:** ${input.title}\n**Honorario acordado:** ${feeText}\n**Colegiatura:** ${lp.bar_association} CAL ${lp.bar_number}\n\n*Conforme al Art. 1764 del Código Civil Peruano. El cliente puede revisar y firmar electrónicamente el acuerdo en este canal.*`,
    });
    revalidatePath(`/chat/${input.conversationId}`);
  }

  revalidatePath(`/cases/${input.caseId}`);
  return { success: true, agreement };
}

export async function signFeeAgreementAction(input: SignFeeAgreementInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  if (!input.acceptTerms) {
    return { error: "Debes aceptar expresamente los términos del convenio de patrocinio legal." };
  }

  if (!input.clientDni || input.clientDni.trim().length < 8) {
    return { error: "Ingresa un número de documento de identidad (DNI/CE) válido." };
  }

  // 1. Obtener convenio
  const { data: agreement, error: agErr } = await supabase
    .from("fee_agreements")
    .select("*, cases(title), lawyer_profiles(bar_association, bar_number, profiles(first_name, last_name))")
    .eq("id", input.agreementId)
    .single();

  if (agErr || !agreement) {
    return { error: "Convenio de honorarios no encontrado." };
  }

  if (agreement.client_id !== user.id) {
    return { error: "No tienes autorización para firmar este convenio." };
  }

  if (agreement.status === "signed") {
    return { error: "Este convenio ya ha sido firmado electrónicamente con anterioridad." };
  }

  // 2. Capturar IP y User Agent para trazabilidad legal (Ley N.° 27269)
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  const userAgent = headerList.get("user-agent") || "N/A";
  const signedAt = new Date().toISOString();

  // 3. Generar hash de inmutabilidad contractual
  const immutableContract = JSON.stringify({
    agreementId: agreement.id,
    caseId: agreement.case_id,
    lawyerId: agreement.lawyer_id,
    clientId: agreement.client_id,
    clientFullName: input.clientFullName.trim(),
    clientDni: input.clientDni.trim(),
    fixedFee: agreement.fixed_fee,
    successFeePercentage: agreement.success_fee_percentage,
    lawyerSignedAt: agreement.lawyer_signed_at,
    clientSignedAt: signedAt,
    ip,
    userAgent,
  });

  const finalHash = crypto.createHash("sha256").update(immutableContract).digest("hex");

  // 4. Actualizar convenio a firmado
  const { error: updateErr } = await supabase
    .from("fee_agreements")
    .update({
      status: "signed",
      client_signed_at: signedAt,
      client_full_name: input.clientFullName.trim(),
      client_dni: input.clientDni.trim(),
      client_ip: ip,
      client_user_agent: userAgent,
      agreement_hash: finalHash,
      updated_at: signedAt,
    })
    .eq("id", input.agreementId);

  if (updateErr) {
    return { error: `Error firmando convenio: ${updateErr.message}` };
  }

  // 5. Auto-archivar en la Bóveda Documental (case_documents)
  const docTitle = `Convenio de Honorarios - ${agreement.title}.pdf`;
  await supabase.from("case_documents").insert({
    case_id: agreement.case_id,
    uploaded_by: user.id,
    file_name: docTitle,
    storage_path: `agreements/${agreement.id}/signed_manifest.json`,
    file_size_bytes: Buffer.byteLength(immutableContract, "utf8"),
    mime_type: "application/json",
    visibility: "shared_match",
  });

  // 6. Mensaje de confirmación en el chat
  if (agreement.conversation_id) {
    await supabase.from("messages").insert({
      conversation_id: agreement.conversation_id,
      sender_id: user.id,
      message: `✅ **Convenio de Honorarios Firmado Bilateralmente**\n**Firmante:** ${input.clientFullName.trim()} (DNI: ${input.clientDni.trim()})\n**Fecha de firma:** ${new Date(signedAt).toLocaleString("es-PE", { dateStyle: "full", timeStyle: "medium" })}\n**Hash Criptográfico:** \`${finalHash.substring(0, 16)}...\`\n*Copia legal archivada automáticamente en la Bóveda Documental del caso.*`,
    });
    revalidatePath(`/chat/${agreement.conversation_id}`);
  }

  revalidatePath(`/cases/${agreement.case_id}`);
  return { success: true, agreementHash: finalHash };
}

export async function getCaseFeeAgreementsAction(caseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado", agreements: [] };
  }

  const { data: agreements, error } = await supabase
    .from("fee_agreements")
    .select(`
      *,
      lawyer_profiles (
        id,
        bar_association,
        bar_number,
        profiles (
          first_name,
          last_name,
          avatar_url
        )
      )
    `)
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, agreements: [] };
  }

  return { agreements: agreements || [] };
}
