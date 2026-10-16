"use server";

import { createClient } from "@/lib/supabase/server";
import { CaseSchema, type CaseFormValues } from "@/lib/validations/case.schema";
import { revalidatePath } from "next/cache";

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
    .select("id")
    .single();

  if (caseErr || !newCase) {
    return { error: `Error creando el caso: ${caseErr?.message || "Desconocido"}` };
  }

  // 2. Invocar cálculo del motor de matching explicable
  const { data: scoredLawyers, error: rpcErr } = await supabase.rpc(
    "calculate_case_matches",
    { p_case_id: newCase.id }
  );

  if (rpcErr) {
    console.error("Error calculando matches:", rpcErr);
  }

  // 3. Persistir matches calculados para feed bilateral
  if (scoredLawyers && scoredLawyers.length > 0) {
    const matchesPayload = scoredLawyers.map((l: any) => ({
      case_id: newCase.id,
      lawyer_id: l.lawyer_id,
      score: l.total_score,
      breakdown: l.breakdown,
      status: "pending" as const,
      user_interest: false,
      lawyer_interest: false,
    }));

    const { error: matchInsertErr } = await supabase
      .from("matches")
      .insert(matchesPayload);

    if (matchInsertErr) {
      console.error("Error insertando matches iniciales:", matchInsertErr);
    }

    // 3.1 Notificaciones VIP y Alertas WhatsApp para suscriptores Élite (Ley N.° 29733: sin datos personales del cliente)
    try {
      const lawyerIds = scoredLawyers.map((l: any) => l.lawyer_id);
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
        const notifPayloads = eliteLawyers.map((el: any) => ({
          user_id: el.lawyer_profiles.user_id,
          type: "radar_vip_alert",
          title: "⚡ Radar VIP: Caso de Alta Afinidad Detectado",
          message: `Nuevo caso afín en ${validated.data.city} (Urgencia ${validated.data.urgency.toUpperCase()}). Cuentas con 15 minutos de exclusividad en tu feed profesional.`,
          data: {
            case_id: newCase.id,
            urgency: validated.data.urgency,
            city: validated.data.city,
            specialty_id: validated.data.specialtyId,
            whatsapp_dispatched: true,
          },
        }));

        await supabase.from("notifications").insert(notifPayloads);

        // Envío asíncrono seguro a webhook de WhatsApp (si está configurado)
        const whatsappWebhookUrl = process.env.WHATSAPP_NOTIFICATION_WEBHOOK_URL;
        if (whatsappWebhookUrl) {
          for (const el of eliteLawyers) {
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

  const updatePayload: {
    user_interest: boolean;
    user_interacted_at: string;
    status?: "discarded" | "pending" | "user_interested" | "matched";
  } = {
    user_interest: interested,
    user_interacted_at: new Date().toISOString(),
  };

  if (!interested) {
    updatePayload.status = "discarded";
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
    updatedMatch.status === "matched" ||
    (Boolean(updatedMatch.user_interest) && Boolean(updatedMatch.lawyer_interest));

  let conversationId: string | null = null;
  if (isMatched) {
    const rawConv = updatedMatch.conversations;
    const directConvId = Array.isArray(rawConv) ? rawConv[0]?.id : (rawConv as any)?.id;

    if (directConvId) {
      conversationId = directConvId;
    } else {
      const { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .eq("match_id", matchId)
        .maybeSingle();

      if (conv?.id) {
        conversationId = conv.id;
      } else {
        const { data: createdConv } = await supabase
          .from("conversations")
          .insert({
            match_id: matchId,
            case_id: updatedMatch.case_id,
            is_active: true,
          })
          .select("id")
          .single();
        conversationId = createdConv?.id || null;
      }
    }

    if (conversationId) {
      const targetConvId = conversationId;
      try {
        const { data: existingMsgs } = await supabase
          .from("messages")
          .select("id")
          .eq("conversation_id", targetConvId)
          .limit(1);

        if (!existingMsgs || existingMsgs.length === 0) {
          await supabase.from("messages").insert({
            conversation_id: targetConvId,
            sender_id: user.id,
            message:
              "🎉 ¡Conexión bilateral establecida! Ambas partes han confirmado su interés mutuo en este caso legal. Ya pueden comunicarse y coordinar la atención.",
          });
        }
      } catch (msgErr) {
        console.error("Error al registrar mensaje inaugural:", msgErr);
      }
    }
  }

  revalidatePath("/chat");
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

  // 2. Si el abogado muestra interés, validar y consumir cuota de suscripción
  if (interested) {
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

  // 3. Buscar si ya existe el registro en matches
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

  // 4. Actualizar o insertar match
  if (targetMatch) {
    const updatePayload: {
      lawyer_interest: boolean;
      lawyer_interacted_at: string;
      status?: "discarded" | "pending" | "lawyer_interested" | "matched";
      user_interest?: boolean;
    } = {
      lawyer_interest: interested,
      lawyer_interacted_at: new Date().toISOString(),
    };

    if (!interested) {
      updatePayload.status = "discarded";
    } else {
      updatePayload.user_interest = true;
      updatePayload.status = "matched";
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
          lawyer_interacted_at: new Date().toISOString(),
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
    const rawConv = targetMatch.conversations;
    const directConvId = Array.isArray(rawConv) ? rawConv[0]?.id : (rawConv as any)?.id;

    if (directConvId) {
      conversationId = directConvId;
    } else {
      const { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .eq("match_id", targetMatch.id)
        .maybeSingle();

      if (conv?.id) {
        conversationId = conv.id;
      } else {
        const { data: createdConv } = await supabase
          .from("conversations")
          .insert({
            match_id: targetMatch.id,
            case_id: targetMatch.case_id,
            is_active: true,
          })
          .select("id")
          .single();
        conversationId = createdConv?.id || null;
      }
    }

    if (conversationId) {
      const targetConvId = conversationId;
      try {
        const { data: existingMsgs } = await supabase
          .from("messages")
          .select("id")
          .eq("conversation_id", targetConvId)
          .limit(1);

        if (!existingMsgs || existingMsgs.length === 0) {
          await supabase.from("messages").insert({
            conversation_id: targetConvId,
            sender_id: user.id,
            message:
              "🎉 ¡Conexión bilateral establecida! Ambas partes han confirmado su interés mutuo en este caso legal. Ya pueden comunicarse y coordinar la atención.",
          });
        }
      } catch (msgErr) {
        console.error("Error al insertar mensaje inaugural:", msgErr);
      }

      // Notificar al cliente que el abogado aceptó la consulta
      if (targetMatch.case_id) {
        try {
          const { data: caseRow } = await supabase
            .from("cases")
            .select("id, user_id, title")
            .eq("id", targetMatch.case_id)
            .maybeSingle();

          if (caseRow?.user_id) {
            const rawProf = (lawyerProfile as any)?.profiles;
            const lawyerProfiles = Array.isArray(rawProf) ? rawProf[0] : rawProf;
            const lawyerName = `${lawyerProfiles?.first_name || "Dr(a)."} ${lawyerProfiles?.last_name || "Abogado"}`.trim();
            const fee = Number(lawyerProfile.consultation_price ?? 0);
            const feeText = fee > 0 ? `S/ ${fee.toFixed(2)}` : "Gratuita";

            await supabase.from("notifications").insert({
              user_id: caseRow.user_id,
              type: "match_confirmed",
              title: "🎉 ¡Tu abogado ha aceptado tu consulta!",
              message: `El ${lawyerName} aceptó atender tu caso "${caseRow.title}". Ingresa a la conversación para abonar los honorarios (${feeText}) y comenzar tu asesoría.`,
              data: {
                conversationId: targetConvId,
                matchId: targetMatch.id,
                caseId: targetMatch.case_id,
                lawyerName,
                consultationPrice: fee,
                actionUrl: `/chat/${targetConvId}`,
              },
            });
          }
        } catch (notifErr) {
          console.error("Error al notificar al cliente sobre match:", notifErr);
        }
      }
    }
  }

  revalidatePath("/chat");
  revalidatePath("/lawyer/dashboard");
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
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debes iniciar sesión para conectar con un abogado." };
  }

  let targetCaseId = params.caseId;

  // Si no se proporcionó un caso previo, creamos el caso con los detalles indicados
  if (!targetCaseId) {
    const defaultTitle = params.title?.trim() || "Consulta Jurídica";
    const defaultDesc =
      params.description?.trim() ||
      "Consulta legal directa para análisis de caso con abogado colegiado.";

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
        title: defaultTitle,
        description: defaultDesc,
        specialty_id: resolvedSpecialtyId,
        city: params.city || "Lima",
        modality: params.modality || "virtual",
        urgency: params.urgency || "medium",
        is_confidential: params.isConfidential ?? true,
        status: "published",
      })
      .select("id")
      .single();

    if (caseErr || !newCase) {
      return { error: `No se pudo registrar la consulta: ${caseErr?.message || "Error desconocido"}` };
    }

    targetCaseId = newCase.id;

    try {
      await supabase.rpc("calculate_case_matches", { p_case_id: newCase.id });
    } catch {
      // Ignorar cálculo secundario
    }
  }

  // Registrar o actualizar el interés en public.matches
  const { data: existingMatch } = await supabase
    .from("matches")
    .select("id, status, lawyer_interest")
    .eq("case_id", targetCaseId)
    .eq("lawyer_id", params.lawyerId)
    .maybeSingle();

  let matchId: string;
  let isMatched = false;
  let conversationId: string | null = null;

  if (existingMatch) {
    matchId = existingMatch.id;
    isMatched = Boolean(existingMatch.lawyer_interest);
    await supabase
      .from("matches")
      .update({
        user_interest: true,
        user_interacted_at: new Date().toISOString(),
        ...(isMatched
          ? { status: "matched", matched_at: new Date().toISOString() }
          : { status: "user_interested" }),
      })
      .eq("id", existingMatch.id);
  } else {
    // Si no existía registro de match, lo insertamos como solicitud del cliente pendiente de aceptación
    const { data: newMatch, error: matchErr } = await supabase
      .from("matches")
      .insert({
        case_id: targetCaseId,
        lawyer_id: params.lawyerId,
        score: 96,
        breakdown: {
          specialty_match: true,
          modality_compatible: true,
          direct_inquiry: true,
        },
        status: "user_interested",
        user_interest: true,
        lawyer_interest: false,
        user_interacted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (matchErr || !newMatch) {
      return { error: `Error creando vinculación con abogado: ${matchErr?.message}` };
    }
    matchId = newMatch.id;
    isMatched = false;
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

      await supabase.from("notifications").insert({
        user_id: lawyerUserId,
        type: "new_client_inquiry",
        title: "📩 Nueva Consulta Legal Recibida",
        message: `${clientName} ha seleccionado tu perfil para su caso: "${params.title?.trim() || "Consulta Jurídica"}". Revisa y acéptalo en tu panel para coordinar.`,
        data: {
          matchId,
          caseId: targetCaseId,
          actionUrl: "/lawyer/dashboard",
        },
      });
    } catch (notifErr) {
      console.error("Error al notificar al abogado sobre nueva consulta:", notifErr);
    }
  }

  // Si ya existía match mutuo bilateral (el abogado ya había mostrado interés antes), creamos o buscamos la conversación
  if (isMatched) {
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id")
      .eq("match_id", matchId)
      .maybeSingle();

    if (existingConv?.id) {
      conversationId = existingConv.id;
    } else {
      const { data: createdConv } = await supabase
        .from("conversations")
        .insert({
          match_id: matchId,
          case_id: targetCaseId,
          is_active: true,
        })
        .select("id")
        .single();
      conversationId = createdConv?.id || null;
    }

    if (conversationId) {
      const { data: existingMsgs } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", conversationId)
        .limit(1);

      if (!existingMsgs || existingMsgs.length === 0) {
        const initialText = `Hola Dr(a). Le escribo para realizar una consulta directa sobre mi caso: "${params.title?.trim() || "Consulta Jurídica"}".\n\nDetalles:\n${params.description?.trim() || "Solicito su evaluación jurídica para coordinar la estrategia y posible patrocinio."}`;

        await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          message: initialText,
        });

        await supabase
          .from("conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", conversationId);
      }
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

          await supabase.from("notifications").insert({
            user_id: targetUserId,
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

