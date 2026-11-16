"use server";

import { createClient } from "@/lib/supabase/server";
import { CaseSchema, type CaseFormValues } from "@/lib/validations/case.schema";
import { calculateFiveFactorAffinity, cleanLawyerName } from "@/lib/utils";
import { revalidatePath } from "next/cache";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function dispatchNotification(
  supabase: SupabaseServerClient,
  params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }
) {
  try {
    const { error: rpcErr } = await supabase.rpc("create_notification", {
      p_user_id: params.userId,
      p_type: params.type,
      p_title: params.title,
      p_message: params.message,
      p_data: (params.data ?? {}) as any,
    });

    if (!rpcErr) {
      return { success: true };
    }

    console.warn("create_notification RPC fallback:", rpcErr.message);
  } catch (rpcErr) {
    console.warn("Excepción en create_notification RPC, usando insert directo:", rpcErr);
  }

  const { error: insertErr } = await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    data: (params.data ?? {}) as any,
  });

  if (insertErr) {
    console.error("Error emitiendo notificación:", insertErr);
    return { success: false, error: insertErr.message };
  }

  return { success: true };
}

async function ensureConversationForMatch(
  supabase: SupabaseServerClient,
  matchId: string,
  caseId: string,
  existingConvRef?: unknown
): Promise<string | null> {
  const directConvId = Array.isArray(existingConvRef)
    ? (existingConvRef[0] as { id?: string } | undefined)?.id
    : (existingConvRef as { id?: string } | null | undefined)?.id;

  if (directConvId) {
    return directConvId;
  }

  const { data: existingConv } = await supabase
    .from("conversations")
    .select("id")
    .eq("match_id", matchId)
    .maybeSingle();

  if (existingConv?.id) {
    return existingConv.id;
  }

  const { data: createdConv, error: convErr } = await supabase
    .from("conversations")
    .upsert(
      {
        match_id: matchId,
        case_id: caseId,
        is_active: true,
        last_message_at: new Date().toISOString(),
      },
      { onConflict: "match_id" }
    )
    .select("id")
    .maybeSingle();

  if (createdConv?.id) {
    return createdConv.id;
  }

  if (convErr) {
    console.warn("ensureConversationForMatch upsert warning:", convErr.message);
  }

  const { data: fallbackConv } = await supabase
    .from("conversations")
    .select("id")
    .eq("match_id", matchId)
    .maybeSingle();

  return fallbackConv?.id || null;
}

async function populateCaseMatchesForLawyers(
  supabase: SupabaseServerClient,
  caseId: string,
  caseContext: {
    clientUserId: string;
    specialtyId?: number | null;
    specialtyName?: string | null;
    city?: string | null;
    modality?: string | null;
  }
): Promise<Array<{ lawyer_id: string; total_score: number; breakdown: Record<string, unknown> }>> {
  const scoredByLawyer = new Map<
    string,
    { lawyer_id: string; total_score: number; breakdown: Record<string, unknown> }
  >();

  try {
    const { data: scoredLawyers, error: rpcErr } = await supabase.rpc(
      "calculate_case_matches",
      { p_case_id: caseId }
    );

    if (rpcErr) {
      console.error("Error calculando matches via RPC:", rpcErr);
    } else if (Array.isArray(scoredLawyers)) {
      for (const l of scoredLawyers as any[]) {
        if (l?.lawyer_id) {
          scoredByLawyer.set(l.lawyer_id, {
            lawyer_id: l.lawyer_id,
            total_score: Math.min(100, Math.max(0, Math.round(Number(l.total_score ?? 85)))),
            breakdown: (l.breakdown as Record<string, unknown>) || {},
          });
        }
      }
    }
  } catch (err) {
    console.error("Excepción invocando calculate_case_matches:", err);
  }

  // Asegurar que todos los abogados disponibles reciban una fila de match pendiente si no estaban en el RPC
  try {
    const { data: activeLawyers } = await supabase
      .from("lawyer_profiles")
      .select(`
        id,
        user_id,
        years_experience,
        virtual_attention,
        physical_attention,
        rating_average,
        total_reviews,
        is_available,
        profiles ( city ),
        lawyer_specialties (
          is_primary,
          specialty_id,
          specialties ( id, name, slug )
        )
      `)
      .eq("is_available", true)
      .neq("user_id", caseContext.clientUserId);

    if (activeLawyers && activeLawyers.length > 0) {
      for (const lawyer of activeLawyers as any[]) {
        if (scoredByLawyer.has(lawyer.id)) continue;

        const aff = calculateFiveFactorAffinity(lawyer, {
          specialtyId: caseContext.specialtyId,
          specialtyName: caseContext.specialtyName,
          city: caseContext.city,
          modality: caseContext.modality,
        });

        scoredByLawyer.set(lawyer.id, {
          lawyer_id: lawyer.id,
          total_score: aff.score,
          breakdown: aff.breakdown,
        });
      }
    }
  } catch (err) {
    console.error("Error consultando abogados activos para poblar matches:", err);
  }

  const allScored = Array.from(scoredByLawyer.values());
  if (allScored.length > 0) {
    const matchesPayload = allScored.map((l) => ({
      case_id: caseId,
      lawyer_id: l.lawyer_id,
      score: l.total_score,
      breakdown: l.breakdown as any,
      status: "pending" as const,
      user_interest: false,
      lawyer_interest: false,
    }));

    const { error: matchUpsertErr } = await supabase
      .from("matches")
      .upsert(matchesPayload, {
        onConflict: "case_id,lawyer_id",
        ignoreDuplicates: true,
      });

    if (matchUpsertErr) {
      console.error("Error insertando/actualizando matches iniciales:", matchUpsertErr);
    }
  }

  return allScored;
}

export async function saveClientCaseDraftAction(params: {
  caseId?: string;
  title: string;
  description: string;
  specialtyId: number;
  urgency: "low" | "medium" | "high" | "immediate";
  city: string;
  modality: "virtual" | "in_person" | "hybrid";
  isConfidential?: boolean;
}) {
  const cleanTitle = params.title?.trim() || "";
  const cleanDesc = params.description?.trim() || "";

  if (cleanTitle.length < 5 || cleanTitle.length > 120) {
    return { error: "El título debe tener entre 5 y 120 caracteres." };
  }
  if (cleanDesc.length < 15 || cleanDesc.length > 3000) {
    return { error: "Describe brevemente tu situación (entre 15 y 3000 caracteres)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debes iniciar sesión para guardar tu caso legal." };
  }

  let resolvedSpecialtyId = Number(params.specialtyId);
  if (!resolvedSpecialtyId || Number.isNaN(resolvedSpecialtyId)) {
    const { data: firstSpec } = await supabase
      .from("specialties")
      .select("id")
      .limit(1)
      .maybeSingle();
    resolvedSpecialtyId = firstSpec?.id || 1;
  }

  let savedCase: any = null;
  const canUpdateExisting =
    Boolean(params.caseId) &&
    params.caseId !== "new" &&
    params.caseId !== "direct_inquiry" &&
    UUID_REGEX.test(params.caseId as string);

  if (canUpdateExisting) {
    const { data: updatedCase, error: updErr } = await supabase
      .from("cases")
      .update({
        title: cleanTitle,
        description: cleanDesc,
        specialty_id: resolvedSpecialtyId,
        urgency: params.urgency || "medium",
        city: params.city || "Lima",
        modality: params.modality || "virtual",
        is_confidential: params.isConfidential ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.caseId as string)
      .eq("user_id", user.id)
      .select(
        "id, title, description, status, city, specialty_id, urgency, modality, created_at, specialties:specialties!cases_specialty_id_fkey(name)"
      )
      .maybeSingle();

    if (updErr) {
      return { error: `No se pudo actualizar el caso: ${updErr.message}` };
    }
    savedCase = updatedCase;
  }

  if (!savedCase) {
    const { data: insertedCase, error: insErr } = await supabase
      .from("cases")
      .insert({
        user_id: user.id,
        title: cleanTitle,
        description: cleanDesc,
        specialty_id: resolvedSpecialtyId,
        urgency: params.urgency || "medium",
        city: params.city || "Lima",
        modality: params.modality || "virtual",
        is_confidential: params.isConfidential ?? true,
        status: "published",
      })
      .select(
        "id, title, description, status, city, specialty_id, urgency, modality, created_at, specialties:specialties!cases_specialty_id_fkey(name)"
      )
      .single();

    if (insErr || !insertedCase) {
      return { error: `No se pudo crear el caso: ${insErr?.message || "Error desconocido"}` };
    }
    savedCase = insertedCase;
  }

  const specialtyObj = Array.isArray(savedCase.specialties)
    ? savedCase.specialties[0]
    : savedCase.specialties;

  await populateCaseMatchesForLawyers(supabase, savedCase.id, {
    clientUserId: user.id,
    specialtyId: savedCase.specialty_id,
    specialtyName: specialtyObj?.name,
    city: savedCase.city,
    modality: savedCase.modality,
  });

  revalidatePath("/dashboard");
  revalidatePath("/lawyer/dashboard");
  revalidatePath(`/cases/${savedCase.id}/match`);

  return {
    success: true,
    caseItem: {
      ...savedCase,
      specialties: specialtyObj || null,
    },
  };
}

export async function createCaseAction(formData: CaseFormValues) {
  const validated = CaseSchema.safeParse(formData);
  if (!validated.success) {
    return { error: "Datos del formulario inválidos", details: validated.error.flatten() };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debes iniciar sesión para publicar un caso legal." };
  }

  // 1. Insertar el caso en public.cases
  const { data: newCase, error: caseErr } = await supabase
    .from("cases")
    .insert({
      user_id: user.id,
      title: validated.data.title,
      description: validated.data.description,
      specialty_id: validated.data.specialtyId,
      subspecialty_id: validated.data.subspecialtyId || null,
      urgency: validated.data.urgency,
      city: validated.data.city,
      modality: validated.data.modality,
      is_confidential: validated.data.isConfidential,
      status: "published",
    })
    .select("id, specialties:specialties!cases_specialty_id_fkey(name)")
    .single();

  if (caseErr || !newCase) {
    return { error: `Error creando el caso: ${caseErr?.message || "Desconocido"}` };
  }

  const specialtyObj = Array.isArray((newCase as any).specialties)
    ? (newCase as any).specialties[0]
    : (newCase as any).specialties;

  // 2 y 3. Calcular y persistir matches para feed bilateral
  const scoredLawyers = await populateCaseMatchesForLawyers(supabase, newCase.id, {
    clientUserId: user.id,
    specialtyId: validated.data.specialtyId,
    specialtyName: specialtyObj?.name,
    city: validated.data.city,
    modality: validated.data.modality,
  });

  if (scoredLawyers.length > 0) {
    // 3.1 Notificaciones VIP y Alertas WhatsApp para suscriptores Élite (Ley N.° 29733: sin datos personales del cliente)
    try {
      const lawyerIds = scoredLawyers.map((l) => l.lawyer_id);
      const { data: eliteLawyers } = await supabase
        .from("lawyer_subscriptions")
        .select(`
          lawyer_id,
          subscription_plans!inner (
            has_whatsapp_alerts,
            tier
          ),
          lawyer_profiles!inner (
            user_id,
            profiles:user_id (
              first_name,
              phone
            )
          )
        `)
        .in("lawyer_id", lawyerIds)
        .eq("subscription_plans.has_whatsapp_alerts", true)
        .in("status", ["active", "trialing"]);

      if (eliteLawyers && eliteLawyers.length > 0) {
        for (const el of eliteLawyers as any[]) {
          if (el.lawyer_profiles?.user_id) {
            await dispatchNotification(supabase, {
              userId: el.lawyer_profiles.user_id,
              type: "radar_vip_alert",
              title: "⚡ Radar VIP: Caso de Alta Afinidad Detectado",
              message: `Nuevo caso afín en ${validated.data.city} (Urgencia ${validated.data.urgency.toUpperCase()}). Cuentas con 15 minutos de exclusividad en tu feed profesional.`,
              data: {
                case_id: newCase.id,
                urgency: validated.data.urgency,
                city: validated.data.city,
                specialty_id: validated.data.specialtyId,
                whatsapp_dispatched: true,
                actionUrl: "/lawyer/dashboard",
              },
            });
          }
        }

        // Envío asíncrono seguro a webhook de WhatsApp (si está configurado)
        const whatsappWebhookUrl = process.env.WHATSAPP_NOTIFICATION_WEBHOOK_URL;
        if (whatsappWebhookUrl) {
          for (const el of eliteLawyers as any[]) {
            const lawyerPhone = (el.lawyer_profiles.profiles as any)?.phone;
            if (lawyerPhone) {
              fetch(whatsappWebhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  to: lawyerPhone,
                  template: "radar_vip_new_case",
                  parameters: {
                    lawyerName: (el.lawyer_profiles.profiles as any)?.first_name || "Doctor(a)",
                    urgency: validated.data.urgency.toUpperCase(),
                    city: validated.data.city,
                    portalUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://alya.legal"}/lawyer/dashboard`,
                  },
                }),
              }).catch((e) => console.error("Error enviando webhook WhatsApp VIP:", e));
            }
          }
        }
      }
    } catch (vipNotifErr) {
      console.error("Error procesando alertas VIP:", vipNotifErr);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/lawyer/dashboard");
  revalidatePath(`/cases/${newCase.id}/match`);

  return { success: true, caseId: newCase.id };
}

export async function interactMatchAction(matchId: string, interested: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const { data: matchRow, error: matchLookupErr } = await supabase
    .from("matches")
    .select(
      "id, case_id, lawyer_id, status, user_interest, lawyer_interest, cases!inner(user_id, title, description), lawyer_profiles(id, user_id), conversations(id)"
    )
    .eq("id", matchId)
    .maybeSingle();

  if (matchLookupErr || !matchRow) {
    return { error: "Postulación no encontrada." };
  }

  const caseOwner = Array.isArray(matchRow.cases) ? matchRow.cases[0] : matchRow.cases;
  const lawyerProfObj = Array.isArray(matchRow.lawyer_profiles)
    ? matchRow.lawyer_profiles[0]
    : matchRow.lawyer_profiles;

  if ((caseOwner as { user_id?: string } | null)?.user_id !== user.id) {
    return { error: "No autorizado para responder a esta postulación." };
  }

  const nowIso = new Date().toISOString();
  const willBeMatched =
    interested && (Boolean(matchRow.lawyer_interest) || matchRow.status === "matched");

  const updatePayload: {
    user_interest: boolean;
    user_interacted_at: string;
    status: "discarded" | "pending" | "user_interested" | "matched";
    matched_at?: string;
  } = {
    user_interest: interested,
    user_interacted_at: nowIso,
    status: !interested ? "discarded" : willBeMatched ? "matched" : "user_interested",
  };

  if (willBeMatched) {
    updatePayload.matched_at = nowIso;
  }

  const { data: updatedMatch, error } = await supabase
    .from("matches")
    .update(updatePayload)
    .eq("id", matchId)
    .select("*, conversations(*)")
    .single();

  if (error) {
    return { error: error.message };
  }

  const isMatched =
    interested &&
    (updatedMatch.status === "matched" ||
      (Boolean(updatedMatch.user_interest) && Boolean(updatedMatch.lawyer_interest)));

  let conversationId: string | null = null;

  if (interested) {
    conversationId = await ensureConversationForMatch(
      supabase,
      updatedMatch.id,
      updatedMatch.case_id,
      updatedMatch.conversations || matchRow.conversations
    );

    if (conversationId) {
      const targetConvId = conversationId;
      try {
        const { data: existingMsgs } = await supabase
          .from("messages")
          .select("id, sender_id, message")
          .eq("conversation_id", targetConvId);

        const caseTitle = (caseOwner as { title?: string } | null)?.title || "Caso Legal";
        const hasClientMessage = (existingMsgs || []).some(
          (m) => m.sender_id === user.id && !m.message?.trim().startsWith("🎉")
        );
        const hasBilateralMessage = (existingMsgs || []).some(
          (m) =>
            m.message?.includes("🎉") ||
            m.message?.includes("¡Conexión bilateral establecida!")
        );

        if (!hasClientMessage && (!existingMsgs || existingMsgs.length === 0)) {
          await supabase.from("messages").insert({
            conversation_id: targetConvId,
            sender_id: user.id,
            message: isMatched
              ? `🎉 ¡Conexión bilateral establecida! Ambas partes han confirmado su interés mutuo en el caso "${caseTitle}". Ya pueden comunicarse y coordinar la atención.`
              : `Hola Dr(a). He manifestado interés en contar con su asesoría para mi caso: "${caseTitle}". Quedo atento(a) a su confirmación para iniciar la atención.`,
          });
        } else if (isMatched && !hasBilateralMessage) {
          await supabase.from("messages").insert({
            conversation_id: targetConvId,
            sender_id: user.id,
            message:
              "🎉 ¡Conexión bilateral establecida! Ambas partes han confirmado su interés mutuo en este caso legal. Ya pueden comunicarse y coordinar la atención.",
          });
        }

        await supabase
          .from("conversations")
          .update({ is_active: true, last_message_at: nowIso })
          .eq("id", targetConvId);
      } catch (msgErr) {
        console.error("Error al registrar mensaje inicial en match:", msgErr);
      }
    }

    const lawyerUserId = (lawyerProfObj as { user_id?: string } | null)?.user_id;
    if (lawyerUserId) {
      try {
        const { data: clientProf } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();
        const clientName = `${clientProf?.first_name || "Un cliente"} ${clientProf?.last_name || ""}`.trim();
        const caseTitle = (caseOwner as { title?: string } | null)?.title || "Caso Legal";

        await dispatchNotification(supabase, {
          userId: lawyerUserId,
          type: isMatched ? "match_confirmed" : "new_client_inquiry",
          title: isMatched
            ? "🎉 ¡Conexión Bilateral Confirmada!"
            : "📩 Nuevo Cliente Interesado en tu Perfil",
          message: isMatched
            ? `${clientName} confirmó interés mutuo en el caso "${caseTitle}". Ya pueden coordinar en la sala de chat.`
            : `${clientName} ha dado "Me interesa" a tu perfil para su caso "${caseTitle}". Ingresa para aceptar y atender la consulta.`,
          data: {
            matchId: updatedMatch.id,
            caseId: updatedMatch.case_id,
            conversationId,
            actionUrl: conversationId ? `/chat/${conversationId}` : "/lawyer/dashboard",
          },
        });
      } catch (notifErr) {
        console.error("Error al notificar al abogado sobre interés del cliente:", notifErr);
      }
    }
  }

  revalidatePath("/chat");
  revalidatePath("/lawyer/dashboard");
  revalidatePath("/dashboard");
  revalidatePath(`/cases/${updatedMatch.case_id}/match`);
  if (conversationId) revalidatePath(`/chat/${conversationId}`);

  return {
    success: true,
    isMatched,
    conversationId,
  };
}

export async function lawyerInteractMatchAction(
  matchIdOrOptions:
    | string
    | {
      matchId?: string | null;
      caseId?: string;
      interested?: boolean;
    },
  maybeInterested?: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  let matchId: string | undefined;
  let caseId: string | undefined;
  let interested: boolean;

  if (typeof matchIdOrOptions === "object" && matchIdOrOptions !== null) {
    matchId = matchIdOrOptions.matchId || undefined;
    caseId = matchIdOrOptions.caseId;
    interested = matchIdOrOptions.interested ?? true;
  } else {
    matchId = matchIdOrOptions;
    interested = Boolean(maybeInterested);
  }

  // 1. Obtener perfil de abogado
  const { data: lawyerProfile } = await supabase
    .from("lawyer_profiles")
    .select("id, consultation_price, profiles(first_name, last_name)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!lawyerProfile) {
    return { error: "Perfil de abogado no encontrado" };
  }

  // 2. Buscar primero si ya existe el registro en matches para no consumir cupo en casos ya postulados o en match
  let targetMatch: any = null;

  if (matchId) {
    const { data: existing } = await supabase
      .from("matches")
      .select("id, status, user_interest, lawyer_interest, case_id, conversations(id)")
      .eq("id", matchId)
      .maybeSingle();
    targetMatch = existing;
  }

  if (!targetMatch && caseId) {
    const { data: existingByCase } = await supabase
      .from("matches")
      .select("id, status, user_interest, lawyer_interest, case_id, conversations(id)")
      .eq("case_id", caseId)
      .eq("lawyer_id", lawyerProfile.id)
      .maybeSingle();
    targetMatch = existingByCase;
  }

  const alreadyAppliedOrMatched =
    Boolean(targetMatch) &&
    (Boolean(targetMatch.lawyer_interest) || targetMatch.status === "matched");

  // 3. Si el abogado muestra interés sobre un caso nuevo (aún sin postular ni en match), validar y consumir cuota
  if (interested && !alreadyAppliedOrMatched) {
    const { data: quotaResult, error: quotaErr } = await supabase.rpc(
      "consume_lawyer_match_quota",
      { p_lawyer_id: lawyerProfile.id }
    );

    if (quotaErr) {
      console.error("Error al validar cuota de match:", quotaErr);
    } else if (quotaResult && !(quotaResult as any).allowed) {
      return {
        error: "QUOTA_EXCEEDED",
        quotaInfo: quotaResult,
      };
    }
  }

  const nowIso = new Date().toISOString();

  // 4. Actualizar o insertar match
  if (targetMatch) {
    const updatePayload: {
      lawyer_interest: boolean;
      lawyer_interacted_at: string;
      status?: "discarded" | "pending" | "lawyer_interested" | "matched";
      user_interest?: boolean;
      matched_at?: string;
    } = {
      lawyer_interest: interested,
      lawyer_interacted_at: nowIso,
    };

    if (!interested) {
      updatePayload.status = "discarded";
    } else {
      updatePayload.user_interest = true;
      updatePayload.status = "matched";
      updatePayload.matched_at = nowIso;
    }

    const { data: updated, error: updErr } = await supabase
      .from("matches")
      .update(updatePayload)
      .eq("id", targetMatch.id)
      .select("id, status, user_interest, lawyer_interest, case_id, conversations(id)")
      .single();

    if (updErr) {
      return { error: updErr.message };
    }
    targetMatch = updated;
  } else if (caseId) {
    // Caso abierto sin fila de match previa para este abogado
    const { data: inserted, error: insErr } = await supabase
      .from("matches")
      .upsert(
        {
          case_id: caseId,
          lawyer_id: lawyerProfile.id,
          score: 95,
          user_interest: true,
          lawyer_interest: interested,
          status: interested ? "matched" : "discarded",
          lawyer_interacted_at: nowIso,
          ...(interested ? { matched_at: nowIso } : {}),
        },
        { onConflict: "case_id,lawyer_id" }
      )
      .select("id, status, user_interest, lawyer_interest, case_id, conversations(id)")
      .single();

    if (insErr) {
      return { error: insErr.message };
    }
    targetMatch = inserted;
  } else {
    return { error: "Identificador de caso o match no proporcionado" };
  }

  const isMatched =
    interested &&
    (targetMatch.status === "matched" ||
      (Boolean(targetMatch.user_interest) && Boolean(targetMatch.lawyer_interest)));

  let conversationId: string | null = null;
  if (isMatched) {
    conversationId = await ensureConversationForMatch(
      supabase,
      targetMatch.id,
      targetMatch.case_id,
      targetMatch.conversations
    );

    const rawProf = (lawyerProfile as any)?.profiles;
    const lawyerProfiles = Array.isArray(rawProf) ? rawProf[0] : rawProf;
    const cleanName = cleanLawyerName(
      lawyerProfiles?.first_name,
      lawyerProfiles?.last_name
    );
    const lawyerDisplayName = `Dr(a). ${cleanName}`.trim();

    if (conversationId) {
      const targetConvId = conversationId;
      try {
        const { data: existingMsgs } = await supabase
          .from("messages")
          .select("id, message")
          .eq("conversation_id", targetConvId);

        const hasBilateralMsg = (existingMsgs || []).some(
          (m) =>
            m.message?.includes("🎉") ||
            m.message?.includes("¡Conexión bilateral establecida!")
        );

        if (!hasBilateralMsg) {
          await supabase.from("messages").insert({
            conversation_id: targetConvId,
            sender_id: user.id,
            message: `🎉 ¡Conexión bilateral establecida! ${lawyerDisplayName} ha aceptado atender tu caso legal. Ya pueden comunicarse y coordinar la atención.`,
          });
        }

        await supabase
          .from("conversations")
          .update({ is_active: true, last_message_at: nowIso })
          .eq("id", targetConvId);
      } catch (msgErr) {
        console.error("Error al insertar mensaje inaugural:", msgErr);
      }
    }

    // Notificar siempre al cliente que el abogado aceptó la consulta
    if (targetMatch.case_id) {
      try {
        const { data: caseRow } = await supabase
          .from("cases")
          .select("id, user_id, title")
          .eq("id", targetMatch.case_id)
          .maybeSingle();

        if (caseRow?.user_id) {
          const fee = Number(lawyerProfile.consultation_price ?? 0);
          const feeText = fee > 0 ? `S/ ${fee.toFixed(2)}` : "Gratuita";

          await dispatchNotification(supabase, {
            userId: caseRow.user_id,
            type: "match_confirmed",
            title: "🎉 ¡Tu abogado ha aceptado tu consulta!",
            message: `${lawyerDisplayName} aceptó atender tu caso "${caseRow.title}". Ingresa a la conversación para abonar los honorarios (${feeText}) y comenzar tu asesoría.`,
            data: {
              conversationId,
              matchId: targetMatch.id,
              caseId: targetMatch.case_id,
              lawyerName: lawyerDisplayName,
              consultationPrice: fee,
              actionUrl: conversationId ? `/chat/${conversationId}` : "/chat",
            },
          });
        }
      } catch (notifErr) {
        console.error("Error al notificar al cliente sobre match:", notifErr);
      }
    }
  }

  revalidatePath("/chat");
  revalidatePath("/lawyer/dashboard");
  revalidatePath("/dashboard");
  if (targetMatch.case_id) {
    revalidatePath(`/cases/${targetMatch.case_id}/match`);
  }
  if (conversationId) revalidatePath(`/chat/${conversationId}`);

  return {
    success: true,
    isMatched,
    conversationId,
    matchId: targetMatch.id,
  };
}

export async function toggleFavoriteAction(targetId: string, targetType: string = "lawyer") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  // Verificar si ya existe en favoritos
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
    return { success: true, isFavorite: false };
  } else {
    await supabase.from("favorites").insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
    });
    return { success: true, isFavorite: true };
  }
}

export async function directMatchWithLawyerAction(params: {
  lawyerId: string;
  caseId?: string;
  title: string;
  description: string;
  specialtyId?: number;
  city?: string;
  modality?: "virtual" | "in_person" | "hybrid";
  urgency?: "low" | "medium" | "high" | "immediate";
  isConfidential?: boolean;
  score?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debes iniciar sesión para conectar con un abogado." };
  }

  let targetCaseId: string | undefined = undefined;
  let resolvedCaseTitle = params.title?.trim() || "Consulta Jurídica";
  let resolvedCaseDesc =
    params.description?.trim() ||
    "Consulta legal directa para análisis de caso con abogado colegiado.";

  if (
    params.caseId &&
    params.caseId !== "direct_inquiry" &&
    params.caseId !== "new" &&
    UUID_REGEX.test(params.caseId)
  ) {
    const { data: ownedCase } = await supabase
      .from("cases")
      .select("id, title, description")
      .eq("id", params.caseId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (ownedCase?.id) {
      targetCaseId = ownedCase.id;
      if (ownedCase.title) resolvedCaseTitle = ownedCase.title;
      if (ownedCase.description) resolvedCaseDesc = ownedCase.description;
    }
  }

  // Si no se proporcionó un caso previo válido, reutilizamos un caso activo equivalente
  // para evitar duplicados de "Consulta Legal Directa" cuando el cliente contacta a varios abogados
  if (!targetCaseId) {
    const { data: existingOpenCase } = await supabase
      .from("cases")
      .select("id, title, description")
      .eq("user_id", user.id)
      .eq("title", resolvedCaseTitle)
      .in("status", ["published", "matching", "contacted"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingOpenCase?.id) {
      targetCaseId = existingOpenCase.id;
      if (existingOpenCase.title) resolvedCaseTitle = existingOpenCase.title;
      if (existingOpenCase.description) resolvedCaseDesc = existingOpenCase.description;
    } else {
      // Buscar una especialidad válida si no vino ID
      let resolvedSpecialtyId = params.specialtyId;
      if (!resolvedSpecialtyId) {
        const { data: firstSpec } = await supabase
          .from("specialties")
          .select("id")
          .limit(1)
          .maybeSingle();
        resolvedSpecialtyId = firstSpec?.id || 1;
      }

      const { data: newCase, error: caseErr } = await supabase
        .from("cases")
        .insert({
          user_id: user.id,
          title: resolvedCaseTitle,
          description: resolvedCaseDesc,
          specialty_id: resolvedSpecialtyId,
          city: params.city || "Lima",
          modality: params.modality || "virtual",
          urgency: params.urgency || "medium",
          is_confidential: params.isConfidential ?? true,
          status: "published",
        })
        .select("id, specialties:specialties!cases_specialty_id_fkey(name)")
        .single();

      if (caseErr || !newCase) {
        return { error: `No se pudo registrar la consulta: ${caseErr?.message || "Error desconocido"}` };
      }

      targetCaseId = newCase.id;
      const specObj = Array.isArray((newCase as any).specialties)
        ? (newCase as any).specialties[0]
        : (newCase as any).specialties;

      await populateCaseMatchesForLawyers(supabase, newCase.id, {
        clientUserId: user.id,
        specialtyId: resolvedSpecialtyId,
        specialtyName: specObj?.name,
        city: params.city || "Lima",
        modality: params.modality || "virtual",
      });
    }
  }

  // Registrar o actualizar el interés en public.matches
  const { data: existingMatch } = await supabase
    .from("matches")
    .select("id, status, lawyer_interest, conversations(id)")
    .eq("case_id", targetCaseId)
    .eq("lawyer_id", params.lawyerId)
    .maybeSingle();

  const nowIso = new Date().toISOString();
  let matchId: string;
  let isMatched = false;
  let existingConvRef: unknown = null;

  if (existingMatch) {
    matchId = existingMatch.id;
    existingConvRef = existingMatch.conversations;
    isMatched = Boolean(existingMatch.lawyer_interest) || existingMatch.status === "matched";
    const { error: updMatchErr } = await supabase
      .from("matches")
      .update({
        user_interest: true,
        user_interacted_at: nowIso,
        ...(isMatched
          ? { status: "matched", matched_at: nowIso }
          : { status: "user_interested" }),
      })
      .eq("id", existingMatch.id);

    if (updMatchErr) {
      return { error: `Error actualizando interés con el abogado: ${updMatchErr.message}` };
    }
  } else {
    // Si no existía registro de match, lo insertamos como solicitud del cliente pendiente de aceptación
    const { data: newMatch, error: matchErr } = await supabase
      .from("matches")
      .insert({
        case_id: targetCaseId,
        lawyer_id: params.lawyerId,
        score:
          typeof params.score === "number"
            ? Math.min(100, Math.max(0, Math.round(params.score)))
            : 88,
        breakdown: {
          specialty_match: true,
          modality_compatible: true,
          direct_inquiry: true,
        },
        status: "user_interested",
        user_interest: true,
        lawyer_interest: false,
        user_interacted_at: nowIso,
      })
      .select("id, conversations(id)")
      .single();

    if (matchErr || !newMatch) {
      return { error: `Error creando vinculación con abogado: ${matchErr?.message}` };
    }
    matchId = newMatch.id;
    existingConvRef = newMatch.conversations;
    isMatched = false;
  }

  // En ambos casos (pendiente de aceptación del abogado o ya en match bilateral), asegurar conversación y mensaje inicial
  const conversationId = await ensureConversationForMatch(
    supabase,
    matchId,
    targetCaseId,
    existingConvRef
  );

  if (conversationId) {
    try {
      const { data: existingMsgs } = await supabase
        .from("messages")
        .select("id, sender_id, message")
        .eq("conversation_id", conversationId);

      const hasClientInquiryMsg = (existingMsgs || []).some(
        (m) => m.sender_id === user.id && !m.message?.trim().startsWith("🎉")
      );
      const hasBilateralMsg = (existingMsgs || []).some(
        (m) =>
          m.message?.includes("🎉") ||
          m.message?.includes("¡Conexión bilateral establecida!")
      );

      if (!hasClientInquiryMsg) {
        const initialText = `Hola Dr(a). Le escribo para realizar una consulta directa sobre mi caso: "${resolvedCaseTitle}".\n\nDetalles:\n${resolvedCaseDesc}`;
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          message: initialText,
        });
      }

      if (isMatched && !hasBilateralMsg) {
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          message:
            "🎉 ¡Conexión bilateral establecida! Ambas partes han confirmado su interés mutuo en este caso legal. Ya pueden comunicarse y coordinar la atención.",
        });
      }

      await supabase
        .from("conversations")
        .update({ is_active: true, last_message_at: nowIso })
        .eq("id", conversationId);
    } catch (msgErr) {
      console.error("Error al crear mensaje inicial en consulta directa:", msgErr);
    }
  }

  // Notificar al abogado sobre la consulta directa recibida
  let lawyerUserId: string | null = null;
  const { data: lawyerProf } = await supabase
    .from("lawyer_profiles")
    .select("id, user_id")
    .eq("id", params.lawyerId)
    .maybeSingle();

  if (lawyerProf?.user_id) {
    lawyerUserId = lawyerProf.user_id;
  } else {
    const { data: lawyerByUser } = await supabase
      .from("lawyer_profiles")
      .select("id, user_id")
      .eq("user_id", params.lawyerId)
      .maybeSingle();
    lawyerUserId = lawyerByUser?.user_id || null;
  }

  if (lawyerUserId) {
    try {
      const { data: clientProf } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .maybeSingle();
      const clientName = `${clientProf?.first_name || "Un cliente"} ${clientProf?.last_name || ""}`.trim();

      await dispatchNotification(supabase, {
        userId: lawyerUserId,
        type: isMatched ? "match_confirmed" : "new_client_inquiry",
        title: isMatched
          ? "🎉 ¡Match Confirmado con Cliente!"
          : "📩 Nueva Consulta Legal Recibida",
        message: isMatched
          ? `${clientName} ha confirmado el interés mutuo en el caso: "${resolvedCaseTitle}". Ya pueden conversar en el chat.`
          : `${clientName} ha seleccionado tu perfil para su caso: "${resolvedCaseTitle}". Revisa el mensaje y acéptalo para coordinar.`,
        data: {
          matchId,
          caseId: targetCaseId,
          conversationId,
          actionUrl: conversationId ? `/chat/${conversationId}` : "/lawyer/dashboard",
        },
      });
    } catch (notifErr) {
      console.error("Error al notificar al abogado sobre nueva consulta:", notifErr);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/lawyer/dashboard");
  revalidatePath("/chat");
  if (conversationId) revalidatePath(`/chat/${conversationId}`);
  revalidatePath(`/cases/${targetCaseId}/match`);

  return {
    success: true,
    caseId: targetCaseId,
    conversationId,
    isMatched,
    message: isMatched
      ? "¡Conexión establecida con éxito! Ya puedes ingresar al chat para abonar los honorarios y comenzar la consulta."
      : "Consulta enviada al abogado. Te notificaremos en pantalla cuando el abogado acepte tu caso para proceder con el abono de honorarios e iniciar la consulta.",
  };
}

export type CaseStatus =
  | "draft"
  | "published"
  | "matching"
  | "contacted"
  | "in_consultation"
  | "in_progress"
  | "closed"
  | "cancelled";

/**
 * Actualiza el estado dentro del ciclo de vida del caso legal.
 * Autorizado para el cliente titular o el abogado con patrocinio / match confirmado.
 */
export async function updateCaseStatusAction(params: {
  caseId: string;
  status: CaseStatus;
  resolutionNotes?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  // 1. Obtener caso
  const { data: caseItem, error: caseErr } = await supabase
    .from("cases")
    .select("id, user_id, status, title")
    .eq("id", params.caseId)
    .single();

  if (caseErr || !caseItem) {
    return { success: false, error: "Caso no encontrado." };
  }

  const isClientOwner = caseItem.user_id === user.id;

  // 2. Verificar si es el abogado asignado (con match activo)
  let isMatchedLawyer = false;
  if (!isClientOwner) {
    const { data: lawyerProfile } = await supabase
      .from("lawyer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (lawyerProfile) {
      const { data: match } = await supabase
        .from("matches")
        .select("id, status")
        .eq("case_id", params.caseId)
        .eq("lawyer_id", lawyerProfile.id)
        .in("status", ["matched", "lawyer_interested"])
        .maybeSingle();

      if (match) {
        isMatchedLawyer = true;
      }
    }
  }

  if (!isClientOwner && !isMatchedLawyer) {
    return {
      success: false,
      error: "No tienes autorización para modificar el estado de este caso legal.",
    };
  }

  // 3. Actualizar estado
  const { error: updateErr } = await supabase
    .from("cases")
    .update({
      status: params.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.caseId);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  // 4. Notificar a la contraparte si existe match
  try {
    const { data: matches } = await supabase
      .from("matches")
      .select("lawyer_id, lawyer_profiles(user_id)")
      .eq("case_id", params.caseId)
      .eq("status", "matched");

    if (matches && matches.length > 0) {
      for (const m of matches) {
        const targetUserId = isClientOwner
          ? (m.lawyer_profiles as any)?.user_id
          : caseItem.user_id;

        if (targetUserId) {
          const statusLabels: Record<string, string> = {
            published: "Activo / En búsqueda",
            in_consultation: "En Consulta",
            in_progress: "En Proceso",
            closed: "Concluido / Resuelto",
            cancelled: "Cancelado",
          };
          const readable = statusLabels[params.status] || params.status;

          await dispatchNotification(supabase, {
            userId: targetUserId,
            type: "case_status_changed",
            title: `Estado de caso actualizado: ${readable}`,
            message: `El caso "${caseItem.title}" ha sido marcado como "${readable}".`,
            data: { caseId: params.caseId, newStatus: params.status },
          });
        }
      }
    }
  } catch (notifErr) {
    console.error("Error al emitir notificación de cambio de estado:", notifErr);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/cases/${params.caseId}/match`);
  revalidatePath("/lawyer/dashboard");
  revalidatePath("/chat");

  return {
    success: true,
    newStatus: params.status,
    message: "Estado del caso actualizado correctamente.",
  };
}

