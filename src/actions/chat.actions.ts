"use server";

import { createClient } from "@/lib/supabase/server";
import {
  SendMessageSchema,
  type SendMessageValues,
} from "@/lib/validations/chat.schema";
import { revalidatePath } from "next/cache";
import type { ConversationItem } from "@/components/chat/ChatSidebar";

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
        specialties (
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

  const rawCase = conv.cases as any;
  const rawMatch = conv.matches as any;
  const rawLawyer = rawMatch?.lawyer_profiles;

  const isClient = rawCase?.user_id === user.id;
  const isLawyer = rawLawyer?.user_id === user.id;

  if (!isClient && !isLawyer) {
    return { error: "No tienes permiso para ver esta conversación." };
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
        firstName: rawLawyer?.profiles?.first_name || "Abogado",
        lastName: rawLawyer?.profiles?.last_name || "",
        avatarUrl: rawLawyer?.profiles?.avatar_url,
        barAssociation: rawLawyer?.bar_association,
        barNumber: rawLawyer?.bar_number,
        consultationPrice: rawLawyer?.consultation_price,
        ratingAverage: rawLawyer?.rating_average,
        verificationStatus: rawLawyer?.verification_status,
      }
    : {
        role: "client" as const,
        lawyerProfileId: null,
        firstName: rawCase?.profiles?.first_name || "Cliente",
        lastName: rawCase?.profiles?.last_name || "",
        avatarUrl: rawCase?.profiles?.avatar_url,
        barAssociation: null,
        barNumber: null,
        consultationPrice: null,
        ratingAverage: null,
        verificationStatus: null,
      };

  // 5. Consultar si hay una consulta agendada para este caso
  const { data: latestConsultation } = await supabase
    .from("consultations")
    .select("id, status")
    .eq("case_id", conv.case_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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
    counterpart,
    consultation: latestConsultation
      ? {
          id: latestConsultation.id,
          status: latestConsultation.status,
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
    .select("id, is_active")
    .eq("id", validated.data.conversationId)
    .single();

  if (!conv || !conv.is_active) {
    return { error: "La conversación está inactiva o no existe." };
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
        specialties (
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

  // Filtrar solo aquellas donde el usuario es cliente o abogado
  const formatted: ConversationItem[] = (convs || [])
    .filter((c: any) => {
      const caseOwner = c.cases?.user_id;
      const lawyerOwner = c.matches?.lawyer_profiles?.user_id;
      return caseOwner === user.id || lawyerOwner === user.id;
    })
    .map((c: any) => {
      const isClient = c.cases?.user_id === user.id;
      const lawyerData = c.matches?.lawyer_profiles;
      const clientData = c.cases?.profiles;

      const counterpartName = isClient
        ? `${lawyerData?.profiles?.first_name || "Abogado"} ${lawyerData?.profiles?.last_name || ""}`.trim()
        : `${clientData?.first_name || "Cliente"} ${clientData?.last_name || ""}`.trim();

      const counterpartAvatar = isClient
        ? lawyerData?.profiles?.avatar_url
        : clientData?.avatar_url;

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
        caseTitle: c.cases?.title || "Caso Legal",
        specialtyName: c.cases?.specialties?.name || "General",
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
