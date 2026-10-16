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

  if (
    rawMatch?.status !== "matched" ||
    !rawMatch?.user_interest ||
    !rawMatch?.lawyer_interest
  ) {
    return {
      error:
        "Esta conversación aún no ha sido confirmada por ambas partes. Te notificaremos cuando el abogado acepte tu consulta.",
    };
  }

  // 2. Obtener los mensajes de la conversación
  const { data: messages, error: msgErr } = await supabase
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

  // 5. Consultar si hay una consulta agendada para este caso
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
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lawyerConsultationPrice = Number(rawLawyer?.consultation_price ?? 0);

  // Si no hay consulta previa creada para este caso, inicializarla con el precio del abogado
  if (!latestConsultation && rawLawyer?.id && rawCase?.user_id) {
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
          meetingLink: latestConsultation.meeting_link,
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

  // Si el remitente es el cliente, verificar si el abogado requiere abono previo de honorarios
  if (isClient) {
    const rawMatch = toObj(conv.matches) as any;
    const rawLawyer = toObj(rawMatch?.lawyer_profiles) as any;
    const requiredPrice = Number(rawLawyer?.consultation_price ?? 0);

    if (requiredPrice > 0) {
      const { data: paidConsultation } = await supabase
        .from("consultations")
        .select("id, payment_status")
        .eq("case_id", conv.case_id)
        .in("payment_status", ["held_escrow", "released"])
        .maybeSingle();

      if (!paidConsultation) {
        return {
          error: `Debes abonar los honorarios fijados (S/ ${requiredPrice.toFixed(2)}) antes de iniciar la conversación con el abogado.`,
        };
      }
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

  // Filtrar únicamente conversaciones con match bilateral formalmente confirmado
  const confirmedConvs = (convs || []).filter((c: any) => {
    const matchData = toObj(c.matches);
    return (
      matchData?.status === "matched" &&
      matchData?.user_interest === true &&
      matchData?.lawyer_interest === true
    );
  });

  // Normalizar y formatear cada conversación soportando objetos o arrays de PostgREST
  const formatted: ConversationItem[] = confirmedConvs
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

      const sortedMessages = (c.messages || []).sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const lastMsg = sortedMessages[0];
      const unreadCount = sortedMessages.filter(
        (m: any) => m.sender_id !== user.id && !m.read_at
      ).length;

      return {
        id: c.id,
        caseId: c.case_id,
        caseTitle: caseData?.title || "Caso Legal",
        specialtyName: specialtyData?.name || "General",
        counterpartName,
        counterpartAvatar: counterpartAvatar || null,
        counterpartRole: isClient ? ("lawyer" as const) : ("client" as const),
        barAssociation: isClient ? lawyerData?.bar_association || null : null,
        barNumber: isClient ? lawyerData?.bar_number || null : null,
        lastMessage: lastMsg?.message || "Conversación iniciada",
        lastMessageAt: lastMsg?.created_at || c.created_at,
        unreadCount,
        isActive: c.is_active,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

  return { conversations: formatted };
}
