"use server";

import { createClient } from "@/lib/supabase/server";
import {
  SendMessageSchema,
  type SendMessageValues,
} from "@/lib/validations/chat.schema";
import { revalidatePath } from "next/cache";
import type { ConversationItem } from "@/components/chat/ChatSidebar";

function toObj<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null;
  return Array.isArray(val) ? val[0] || null : val;
}

export async function getConversationDetailsAction(conversationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  // 1. Obtener conversación con match, caso y abogado
  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .select(`
      id,
      match_id,
      case_id,
      is_active,
      last_message_at,
      created_at,
      matches (
        id,
        status,
        user_interest,
        lawyer_interest,
        score,
        lawyer_id,
        lawyer_profiles (
          id,
          user_id,
          bar_association,
          bar_number,
          consultation_price,
          years_experience,
          rating_average,
          verification_status,
          profiles (
            id,
            first_name,
            last_name,
            avatar_url,
            city
          )
        )
      ),
      cases (
        id,
        user_id,
        title,
        description,
        urgency,
        city,
        status,
        specialties:specialties!cases_specialty_id_fkey (
          id,
          name
        ),
        profiles:user_id (
          id,
          first_name,
          last_name,
          avatar_url,
          city
        )
      )
    `)
    .eq("id", conversationId)
    .single();

  if (convErr || !conv) {
    return { error: "Conversación no encontrada o sin acceso." };
  }

  const rawCase = toObj(conv.cases) as any;
  const rawMatch = toObj(conv.matches) as any;
  const rawLawyer = toObj(rawMatch?.lawyer_profiles) as any;
  const rawLawyerProfiles = toObj(rawLawyer?.profiles) as any;
  const rawCaseProfiles = toObj(rawCase?.profiles) as any;

  const isClient = rawCase?.user_id === user.id;
  const isLawyer = rawLawyer?.user_id === user.id;

  if (!isClient && !isLawyer) {
    return { error: "No tienes permiso para ver esta conversación." };
  }

  const hasMatchInterest =
    rawMatch?.status === "matched" ||
    Boolean(rawMatch?.user_interest) ||
    Boolean(rawMatch?.lawyer_interest);

  if (!rawMatch || rawMatch.status === "discarded" || !hasMatchInterest) {
    return {
      error:
        "Esta conversación aún no ha sido habilitada por ninguna de las partes.",
    };
  }

  const isBilateralMatch =
    rawMatch.status === "matched" ||
    (Boolean(rawMatch.user_interest) && Boolean(rawMatch.lawyer_interest));

  const { data: rawMessages, error: msgErr } = await supabase
    .from("messages")
    .select(`
      id,
      conversation_id,
      sender_id,
      message,
      attachment_url,
      attachment_type,
      read_at,
      created_at
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (msgErr) {
    return { error: "Error al cargar mensajes." };
  }

  const messages = (rawMessages || []).filter(
    (m) => m.message?.trim() !== "Mensaje de prueba: ignorar."
  );

  // 3. Marcar mensajes no leídos de la contraparte como leídos
  const unreadFromOther = (messages || []).filter(
    (m) => m.sender_id !== user.id && !m.read_at
  );

  if (unreadFromOther.length > 0) {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .is("read_at", null);
  }

  // 4. Determinar la información de la contraparte
  const counterpart = isClient
    ? {
        role: "lawyer" as const,
        lawyerProfileId: rawLawyer?.id,
        firstName: rawLawyerProfiles?.first_name || "Abogado",
        lastName: rawLawyerProfiles?.last_name || "",
        avatarUrl: rawLawyerProfiles?.avatar_url,
        barAssociation: rawLawyer?.bar_association,
        barNumber: rawLawyer?.bar_number,
        consultationPrice: rawLawyer?.consultation_price,
        ratingAverage: rawLawyer?.rating_average,
        verificationStatus: rawLawyer?.verification_status,
      }
    : {
        role: "client" as const,
        lawyerProfileId: null,
        firstName: rawCaseProfiles?.first_name || "Cliente",
        lastName: rawCaseProfiles?.last_name || "",
        avatarUrl: rawCaseProfiles?.avatar_url,
        barAssociation: null,
        barNumber: null,
        consultationPrice: null,
        ratingAverage: null,
        verificationStatus: null,
      };

  // 5. Consultar si hay una consulta agendada para este caso y abogado (evitando duplicados)
  let { data: latestConsultation } = await supabase
    .from("consultations")
    .select(`
      id,
      status,
      scheduled_at,
      duration_minutes,
      modality,
      agreed_price,
      meeting_link,
      payment_status,
      payment_method,
      voucher_url,
      room_passcode
    `)
    .eq("case_id", conv.case_id)
    .eq("lawyer_id", rawLawyer?.id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lawyerConsultationPrice = Number(rawLawyer?.consultation_price ?? 0);

  // Si no hay consulta previa creada para este caso y el match ya fue confirmado por ambas partes, inicializarla una sola vez
  if (!latestConsultation && isBilateralMatch && rawLawyer?.id && rawCase?.user_id) {
    const autoMeetingRoom = `https://meet.jit.si/alya-legal-${conv.case_id.replace(/-/g, "").slice(0, 8)}-${Date.now().toString().slice(-6)}`;
    if (lawyerConsultationPrice > 0) {
      const { data: createdConsultation } = await supabase
        .from("consultations")
        .insert({
          case_id: conv.case_id,
          client_id: rawCase.user_id,
          lawyer_id: rawLawyer.id,
          scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 45,
          modality: "virtual",
          meeting_link: autoMeetingRoom,
          agreed_price: lawyerConsultationPrice,
          status: "requested",
          payment_status: "pending_payment",
        })
        .select(`
          id,
          status,
          scheduled_at,
          duration_minutes,
          modality,
          agreed_price,
          meeting_link,
          payment_status,
          payment_method,
          voucher_url,
          room_passcode
        `)
        .single();
      latestConsultation = createdConsultation;
    } else {
      // Si el abogado fijó honorario en 0 (gratuito)
      const { data: createdConsultation } = await supabase
        .from("consultations")
        .insert({
          case_id: conv.case_id,
          client_id: rawCase.user_id,
          lawyer_id: rawLawyer.id,
          scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 45,
          modality: "virtual",
          meeting_link: autoMeetingRoom,
          agreed_price: 0,
          status: "confirmed",
          payment_status: "released",
        })
        .select(`
          id,
          status,
          scheduled_at,
          duration_minutes,
          modality,
          agreed_price,
          meeting_link,
          payment_status,
          payment_method,
          voucher_url,
          room_passcode
        `)
        .single();
      latestConsultation = createdConsultation;
    }
  }

  // Si existe consulta virtual pero no tiene enlace generado, asignarle uno y persistirlo
  if (latestConsultation && !latestConsultation.meeting_link && latestConsultation.modality !== "in_person") {
    const autoLink = `https://meet.jit.si/alya-legal-${latestConsultation.id.replace(/-/g, "").slice(0, 16)}`;
    await supabase
      .from("consultations")
      .update({ meeting_link: autoLink })
      .eq("id", latestConsultation.id);
    latestConsultation.meeting_link = autoLink;
  }

  let hasReviewed = false;
  if (latestConsultation) {
    const { data: rev } = await supabase
      .from("reviews")
      .select("id")
      .eq("consultation_id", latestConsultation.id)
      .maybeSingle();
    hasReviewed = !!rev;
  }

  return {
    conversation: {
      id: conv.id,
      matchId: conv.match_id,
      caseId: conv.case_id,
      isActive: conv.is_active,
      createdAt: conv.created_at,
      matchStatus: rawMatch?.status || "pending",
      userInterest: Boolean(rawMatch?.user_interest),
      lawyerInterest: Boolean(rawMatch?.lawyer_interest),
    },
    caseData: {
      id: rawCase?.id,
      title: rawCase?.title,
      description: rawCase?.description,
      urgency: rawCase?.urgency,
      city: rawCase?.city,
      status: rawCase?.status,
      specialtyName: rawCase?.specialties?.name,
    },
    isClient,
    currentUser: {
      id: user.id,
      role: isClient ? ("client" as const) : ("lawyer" as const),
    },
    counterpart: {
      ...counterpart,
      consultationPrice: lawyerConsultationPrice,
    },
    consultation: latestConsultation
      ? {
          id: latestConsultation.id,
          status: latestConsultation.status,
          scheduledAt: latestConsultation.scheduled_at,
          durationMinutes: latestConsultation.duration_minutes,
          modality: latestConsultation.modality,
          agreedPrice: Number(latestConsultation.agreed_price),
          meetingLink:
            latestConsultation.meeting_link ||
            `https://meet.jit.si/alya-legal-${latestConsultation.id.replace(/-/g, "").slice(0, 16)}`,
          paymentStatus: latestConsultation.payment_status || "pending_payment",
          paymentMethod: latestConsultation.payment_method || null,
          voucherUrl: latestConsultation.voucher_url || null,
          roomPasscode: latestConsultation.room_passcode || null,
          hasReviewed,
        }
      : null,
    messages: messages || [],
  };
}

export async function sendMessageAction(formData: SendMessageValues) {
  const validated = SendMessageSchema.safeParse(formData);
  if (!validated.success) {
    return { error: "Datos de mensaje inválidos", details: validated.error.flatten() };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const { data: conv } = await supabase
    .from("conversations")
    .select(`
      id,
      is_active,
      case_id,
      cases (
        user_id
      ),
      matches (
        lawyer_profiles (
          user_id,
          consultation_price
        )
      )
    `)
    .eq("id", validated.data.conversationId)
    .single();

  if (!conv || !conv.is_active) {
    return { error: "La conversación está inactiva o no existe." };
  }

  const rawCase = toObj(conv.cases) as any;
  const isClient = rawCase?.user_id === user.id;

  // H14: Aplicar la regla de custodia (Escrow) al enviar mensajes tanto para el cliente como para el abogado
  const rawMatch = toObj(conv.matches) as any;
  const rawLawyer = toObj(rawMatch?.lawyer_profiles) as any;
  const isLawyer = rawLawyer?.user_id === user.id;

  if (!isClient && !isLawyer) {
    return { error: "No autorizado para enviar mensajes en esta conversación." };
  }

  const requiredPrice = Number(rawLawyer?.consultation_price ?? 0);

  if (requiredPrice > 0) {
    const { data: paidConsultation } = await supabase
      .from("consultations")
      .select("id, payment_status")
      .eq("case_id", conv.case_id)
      .in("payment_status", ["held_escrow", "released"])
      .limit(1)
      .maybeSingle();

    if (!paidConsultation) {
      return {
        error: isClient
          ? `Debes abonar los honorarios fijados (S/ ${requiredPrice.toFixed(2)}) antes de iniciar la conversación con el abogado.`
          : `El canal de chat permanece bloqueado hasta que el cliente complete el abono de honorarios (S/ ${requiredPrice.toFixed(2)}) en custodia ALYA.`,
      };
    }
  }

  const { data: newMsg, error: insertErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: validated.data.conversationId,
      sender_id: user.id,
      message: validated.data.message,
      attachment_url: validated.data.attachmentUrl || null,
      attachment_type: validated.data.attachmentType || null,
    })
    .select()
    .single();

  if (insertErr) {
    return { error: `Error enviando mensaje: ${insertErr.message}` };
  }

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", validated.data.conversationId);

  const recipientUserId = isClient ? rawLawyer?.user_id : rawCase?.user_id;
  if (recipientUserId && recipientUserId !== user.id) {
    try {
      const { data: senderProf } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .maybeSingle();
      const senderName = `${senderProf?.first_name || (isClient ? "Cliente" : "Dr(a).")} ${senderProf?.last_name || ""}`.trim();
      const preview = validated.data.message.trim().slice(0, 110);

      const { error: notifRpcErr } = await supabase.rpc("create_notification", {
        p_user_id: recipientUserId,
        p_type: "message",
        p_title: `Nuevo mensaje de ${senderName}`,
        p_message: preview,
        p_data: {
          conversationId: validated.data.conversationId,
          caseId: conv.case_id,
          actionUrl: `/chat/${validated.data.conversationId}`,
        },
      });

      if (notifRpcErr) {
        await supabase.from("notifications").insert({
          user_id: recipientUserId,
          type: "message",
          title: `Nuevo mensaje de ${senderName}`,
          message: preview,
          data: {
            conversationId: validated.data.conversationId,
            caseId: conv.case_id,
            actionUrl: `/chat/${validated.data.conversationId}`,
          },
        });
      }
    } catch (notifErr) {
      console.error("Error notificando nuevo mensaje:", notifErr);
    }
  }

  revalidatePath(`/chat/${validated.data.conversationId}`);
  revalidatePath(`/chat`);

  return { success: true, message: newMsg };
}

export async function markMessagesAsReadAction(conversationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const { data: conv } = await supabase
    .from("conversations")
    .select(`
      id,
      cases ( user_id ),
      matches ( lawyer_profiles ( user_id ) )
    `)
    .eq("id", conversationId)
    .maybeSingle();

  if (!conv) return { error: "Conversación no encontrada" };

  const rawCase = toObj(conv.cases) as any;
  const rawMatch = toObj(conv.matches) as any;
  const rawLawyer = toObj(rawMatch?.lawyer_profiles) as any;
  if (rawCase?.user_id !== user.id && rawLawyer?.user_id !== user.id) {
    return { error: "No autorizado" };
  }

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  return { success: true };
}

export async function getUserConversationsAction(): Promise<{
  error?: string;
  conversations: ConversationItem[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado", conversations: [] };
  }

  // Obtener perfil del usuario para saber su rol principal
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  const isUserLawyer = profile?.role === "lawyer";

  // Buscamos todas las conversaciones asociadas al usuario
  const { data: convs, error } = await supabase
    .from("conversations")
    .select(`
      id,
      match_id,
      case_id,
      is_active,
      last_message_at,
      created_at,
      cases (
        id,
        user_id,
        title,
        specialties:specialties!cases_specialty_id_fkey (
          name
        ),
        profiles:user_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      ),
      matches (
        id,
        status,
        user_interest,
        lawyer_interest,
        lawyer_profiles (
          id,
          user_id,
          bar_association,
          bar_number,
          verification_status,
          profiles (
            id,
            first_name,
            last_name,
            avatar_url
          )
        )
      ),
      messages (
        id,
        sender_id,
        message,
        read_at,
        created_at
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, conversations: [] };
  }

  // Filtrar conversaciones vigentes donde exista interés de al menos una parte (incluye user_interested, lawyer_interested y matched)
  const confirmedConvs = (convs || []).filter((c: any) => {
    const matchData = toObj(c.matches);
    const caseData = toObj(c.cases);
    const lawyerData = toObj(matchData?.lawyer_profiles);

    const isParticipant =
      caseData?.user_id === user.id || lawyerData?.user_id === user.id;

    if (!isParticipant || !matchData || matchData.status === "discarded") {
      return false;
    }

    return (
      matchData.status === "matched" ||
      matchData.user_interest === true ||
      matchData.lawyer_interest === true
    );
  });

  // Normalizar, deduplicar y formatear cada conversación (H20)
  const rawFormattedWithKeys = confirmedConvs
    .map((c: any) => {
      const caseData = toObj(c.cases);
      const matchData = toObj(c.matches);
      const lawyerData = toObj(matchData?.lawyer_profiles);
      const lawyerProfiles = toObj(lawyerData?.profiles);
      const clientProfiles = toObj(caseData?.profiles);
      const specialtyData = toObj(caseData?.specialties);

      const isClient = caseData?.user_id === user.id;

      const counterpartName = isClient
        ? `${lawyerProfiles?.first_name || "Abogado"} ${lawyerProfiles?.last_name || ""}`.trim()
        : `${clientProfiles?.first_name || "Cliente"} ${clientProfiles?.last_name || ""}`.trim();

      const counterpartAvatar = isClient
        ? lawyerProfiles?.avatar_url
        : clientProfiles?.avatar_url;

      const sortedMessages = (c.messages || [])
        .filter((m: any) => m.message?.trim() !== "Mensaje de prueba: ignorar.")
        .sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

      const lastMsg = sortedMessages[0];
      const unreadCount = sortedMessages.filter(
        (m: any) => m.sender_id !== user.id && !m.read_at
      ).length;

      const fallbackMessage =
        matchData?.status === "user_interested"
          ? "Solicitud de asesoría enviada"
          : "Conversación iniciada";

      const item: ConversationItem = {
        id: c.id,
        caseId: c.case_id,
        caseTitle: caseData?.title || "Caso Legal",
        specialtyName: specialtyData?.name || "General",
        counterpartName,
        counterpartAvatar: counterpartAvatar || null,
        counterpartRole: isClient ? ("lawyer" as const) : ("client" as const),
        barAssociation: isClient ? lawyerData?.bar_association || null : null,
        barNumber: isClient ? lawyerData?.bar_number || null : null,
        lastMessage: (lastMsg?.message || fallbackMessage).replace(/\*\*/g, ""),
        lastMessageAt: lastMsg?.created_at || c.last_message_at || c.created_at,
        unreadCount,
        isActive: c.is_active,
        matchStatus: matchData?.status || null,
      };

      const dedupKey = `${c.case_id}:${lawyerData?.id || matchData?.id || c.id}`;

      return { item, dedupKey };
    })
    .sort(
      (a, b) =>
        new Date(b.item.lastMessageAt).getTime() -
        new Date(a.item.lastMessageAt).getTime()
    );

  // Evitar conversaciones duplicadas para el mismo caso y abogado/match
  const seenConversations = new Set<string>();
  const formatted: ConversationItem[] = [];
  for (const entry of rawFormattedWithKeys) {
    if (seenConversations.has(entry.dedupKey)) continue;
    seenConversations.add(entry.dedupKey);
    formatted.push(entry.item);
  }

  return { conversations: formatted };
}
