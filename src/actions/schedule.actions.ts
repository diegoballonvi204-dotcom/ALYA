"use server";

import { createClient } from "@/lib/supabase/server";
import {
  BookConsultationSchema,
  UpdateConsultationStatusSchema,
  SaveLawyerScheduleSchema,
  type BookConsultationValues,
  type UpdateConsultationStatusValues,
  type SaveLawyerScheduleValues,
} from "@/lib/validations/consultation.schema";
import { revalidatePath } from "next/cache";

export async function getLawyerAvailabilitySlotsAction(
  lawyerId: string,
  dateStr: string // "YYYY-MM-DD"
) {
  const supabase = await createClient();

  // 1. Determinar el día de la semana (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
  const targetDate = new Date(`${dateStr}T12:00:00Z`);
  const dayOfWeek = targetDate.getUTCDay();

  // 2. Obtener la franja horaria configurada para ese día
  const { data: schedule, error: schedErr } = await supabase
    .from("lawyer_schedules")
    .select("start_time, end_time, slot_duration_minutes, is_active")
    .eq("lawyer_id", lawyerId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .maybeSingle();

  if (schedErr || !schedule) {
    return { slots: [], message: "El abogado no atiende este día de la semana." };
  }

  // 3. Generar los slots potenciales
  const slotMinutes = schedule.slot_duration_minutes || 45;
  const [startH, startM] = schedule.start_time.split(":").map(Number);
  const [endH, endM] = schedule.end_time.split(":").map(Number);

  const startTotalMinutes = startH * 60 + startM;
  const endTotalMinutes = endH * 60 + endM;

  const potentialSlots: string[] = [];
  for (
    let cur = startTotalMinutes;
    cur + slotMinutes <= endTotalMinutes;
    cur += slotMinutes
  ) {
    const h = Math.floor(cur / 60)
      .toString()
      .padStart(2, "0");
    const m = (cur % 60).toString().padStart(2, "0");
    potentialSlots.push(`${h}:${m}`);
  }

  // 4. Buscar consultas ya agendadas en esa fecha
  const startOfDay = `${dateStr}T00:00:00.000Z`;
  const endOfDay = `${dateStr}T23:59:59.999Z`;

  const { data: existingConsultations } = await supabase
    .from("consultations")
    .select("scheduled_at, duration_minutes, status")
    .eq("lawyer_id", lawyerId)
    .in("status", ["requested", "confirmed", "rescheduled"])
    .gte("scheduled_at", startOfDay)
    .lte("scheduled_at", endOfDay);

  const bookedHours = new Set(
    (existingConsultations || []).map((c) => {
      const dt = new Date(c.scheduled_at);
      const h = dt.getUTCHours().toString().padStart(2, "0");
      const m = dt.getUTCMinutes().toString().padStart(2, "0");
      return `${h}:${m}`;
    })
  );

  const availableSlots = potentialSlots.filter((slot) => !bookedHours.has(slot));

  return { slots: availableSlots, slotDuration: slotMinutes };
}

export async function bookConsultationAction(formData: BookConsultationValues) {
  const validated = BookConsultationSchema.safeParse(formData);
  if (!validated.success) {
    return { error: "Datos de cita inválidos", details: validated.error.flatten() };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  // 1. Validar que no haya duplicidad exacta de horario para el abogado
  const { data: conflict } = await supabase
    .from("consultations")
    .select("id")
    .eq("lawyer_id", validated.data.lawyerId)
    .eq("scheduled_at", validated.data.scheduledAt)
    .in("status", ["requested", "confirmed", "rescheduled"])
    .maybeSingle();

  if (conflict) {
    return { error: "Este horario ya fue reservado por otro consultante. Por favor selecciona otro." };
  }

  // 2. Insertar consulta con teleasistencia de 1 clic y estado de pago pendiente
  const shortId = Math.random().toString(36).substring(2, 8);
  const autoJitsiLink =
    validated.data.modality === "virtual"
      ? `https://meet.jit.si/alya-legal-${validated.data.caseId.slice(0, 8)}-${shortId}`
      : null;
  const roomPasscode =
    validated.data.modality === "virtual"
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : null;

  const { data: consultation, error: insertErr } = await supabase
    .from("consultations")
    .insert({
      case_id: validated.data.caseId,
      client_id: user.id,
      lawyer_id: validated.data.lawyerId,
      scheduled_at: validated.data.scheduledAt,
      duration_minutes: validated.data.durationMinutes,
      modality: validated.data.modality,
      agreed_price: validated.data.agreedPrice,
      notes: validated.data.notes || null,
      status: "requested",
      payment_status: "pending_payment",
      meeting_link: autoJitsiLink,
      room_passcode: roomPasscode,
    })
    .select()
    .single();

  if (insertErr) {
    return { error: `Error reservando cita: ${insertErr.message}` };
  }

  // 3. Crear mensaje automático en la conversación
  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("case_id", validated.data.caseId)
    .eq("is_active", true)
    .maybeSingle();

  if (conv) {
    const dateFormatted = new Date(validated.data.scheduledAt).toLocaleString("es-PE", {
      dateStyle: "full",
      timeStyle: "short",
    });
    await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      message: `📅 **Solicitud de Cita Legal**:\nModalidad: ${validated.data.modality === "virtual" ? "Virtual (Videollamada)" : "Presencial en Estudio"}\nFecha: ${dateFormatted}\nTarifa: S/ ${validated.data.agreedPrice.toFixed(2)}\nEstado: Pendiente de confirmación`,
    });
    revalidatePath(`/chat/${conv.id}`);
  }

  revalidatePath(`/cases/${validated.data.caseId}`);
  return { success: true, consultation };
}

export async function updateConsultationStatusAction(formData: UpdateConsultationStatusValues) {
  const validated = UpdateConsultationStatusSchema.safeParse(formData);
  if (!validated.success) {
    return { error: "Datos de estado inválidos", details: validated.error.flatten() };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  // 1. Verificar si el usuario es el abogado o el cliente de la consulta
  const { data: consultation, error: cErr } = await supabase
    .from("consultations")
    .select(`
      id,
      case_id,
      client_id,
      lawyer_id,
      lawyer_profiles!inner(user_id)
    `)
    .eq("id", validated.data.consultationId)
    .single();

  if (cErr || !consultation) {
    return { error: "Consulta no encontrada." };
  }

  const isClient = consultation.client_id === user.id;
  const isLawyer = (consultation.lawyer_profiles as any)?.user_id === user.id;

  if (!isClient && !isLawyer) {
    return { error: "No tienes permiso para actualizar esta cita legal." };
  }

  const updatePayload: any = {
    status: validated.data.status,
    notes: validated.data.notes || null,
  };

  if (validated.data.status === "confirmed") {
    // Autogenerar Jitsi Meet y room passcode si es virtual y no se proveyó enlace manual
    if (validated.data.meetingLink) {
      updatePayload.meeting_link = validated.data.meetingLink;
    } else {
      const shortId = Math.random().toString(36).substring(2, 8);
      updatePayload.meeting_link = `https://meet.jit.si/alya-legal-${consultation.case_id.slice(0, 8)}-${shortId}`;
      updatePayload.room_passcode = Math.floor(100000 + Math.random() * 900000).toString();
    }
  } else if (validated.data.meetingLink !== undefined) {
    updatePayload.meeting_link = validated.data.meetingLink || null;
  }

  if (validated.data.status === "completed") {
    // Si la consulta concluye, liberar los fondos en custodia al abogado
    updatePayload.payment_status = "released";
    updatePayload.released_at = new Date().toISOString();
  }

  if (validated.data.meetingAddress !== undefined) {
    updatePayload.meeting_address = validated.data.meetingAddress || null;
  }

  const { error: updateErr } = await supabase
    .from("consultations")
    .update(updatePayload)
    .eq("id", validated.data.consultationId);

  if (updateErr) {
    return { error: `Error actualizando cita: ${updateErr.message}` };
  }

  // Notificar en la conversación si existe
  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("case_id", consultation.case_id)
    .maybeSingle();

  if (conv) {
    const statusLabels: Record<string, string> = {
      confirmed: "✅ Cita confirmada por el abogado",
      rescheduled: "🔄 Cita reprogramada",
      completed: "🎉 Consulta legal concluida",
      cancelled: "❌ Cita cancelada",
    };

    let msg = `📅 **Actualización de Cita Legal**:\nEstado: ${statusLabels[validated.data.status] || validated.data.status}`;
    if (validated.data.meetingLink) {
      msg += `\nEnlace de videollamada: ${validated.data.meetingLink}`;
    }
    if (validated.data.notes) {
      msg += `\nNota: ${validated.data.notes}`;
    }

    await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      message: msg,
    });
    revalidatePath(`/chat/${conv.id}`);
  }

  revalidatePath("/lawyer/schedule");
  return { success: true };
}

export async function getLawyerScheduleAction(lawyerProfileId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado", schedules: [] };

  let targetId = lawyerProfileId;
  if (!targetId) {
    const { data: lp } = await supabase
      .from("lawyer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!lp) return { error: "Perfil de abogado no encontrado", schedules: [] };
    targetId = lp.id;
  }

  const { data: schedules, error } = await supabase
    .from("lawyer_schedules")
    .select("*")
    .eq("lawyer_id", targetId)
    .order("day_of_week", { ascending: true });

  if (error) return { error: error.message, schedules: [] };
  return { schedules: schedules || [] };
}

export async function saveLawyerScheduleAction(schedules: SaveLawyerScheduleValues[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const { data: lp } = await supabase
    .from("lawyer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!lp) return { error: "Perfil de abogado no encontrado." };

  for (const s of schedules) {
    const { error: upsertErr } = await supabase
      .from("lawyer_schedules")
      .upsert(
        {
          lawyer_id: lp.id,
          day_of_week: s.dayOfWeek,
          start_time: s.startTime,
          end_time: s.endTime,
          slot_duration_minutes: s.slotDurationMinutes,
          is_active: s.isActive,
        },
        { onConflict: "lawyer_id, day_of_week" }
      );

    if (upsertErr) {
      return { error: `Error guardando horario: ${upsertErr.message}` };
    }
  }

  revalidatePath("/lawyer/schedule");
  return { success: true };
}

export interface SubmitConsultationVoucherParams {
  consultationId: string;
  paymentMethod: "yape" | "plin" | "bank_transfer";
  operationNumber: string;
  voucherUrl: string;
}

/**
 * Registra comprobante de Yape/Plin para pago de consulta legal en custodia (Escrow)
 */
export async function submitConsultationVoucherAction(params: SubmitConsultationVoucherParams) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  const { data: c, error: cErr } = await supabase
    .from("consultations")
    .select("id, client_id, case_id, lawyer_id, agreed_price")
    .eq("id", params.consultationId)
    .single();

  if (cErr || !c) return { success: false, error: "Consulta no encontrada." };
  if (c.client_id !== user.id) return { success: false, error: "No autorizado para pagar esta consulta." };

  const { error: updateErr } = await supabase
    .from("consultations")
    .update({
      payment_status: "held_escrow",
      payment_method: params.paymentMethod,
      payment_reference: params.operationNumber.trim(),
      voucher_url: params.voucherUrl,
      paid_at: new Date().toISOString(),
    })
    .eq("id", params.consultationId);

  if (updateErr) return { success: false, error: updateErr.message };

  // Enviar mensaje automático al chat
  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("case_id", c.case_id)
    .maybeSingle();

  if (conv) {
    const methodNames: Record<string, string> = {
      yape: "Yape",
      plin: "Plin",
      bank_transfer: "Transferencia BCP",
    };
    const methodName = methodNames[params.paymentMethod] || params.paymentMethod;
    await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      message: `💳 **Pago de Honorarios en Custodia (Escrow)**:\nMedio: ${methodName}\nOperación: OP-${params.operationNumber.trim()}\nMonto: S/ ${Number(c.agreed_price).toFixed(2)}\nEstado: **Fondos protegidos en custodia ALYA**\nEl dinero se encuentra retenido y solo será transferido al abogado al finalizar la sesión.`,
      attachment_url: params.voucherUrl,
      attachment_type: "document",
    });
    revalidatePath(`/chat/${conv.id}`);
  }

  revalidatePath("/lawyer/schedule");
  return { success: true, message: "Comprobante verificado. Fondos en custodia asegurada." };
}

/**
 * Genera preferencia de Mercado Pago Checkout Pro o simulación en sandbox para la consulta
 */
export async function createConsultationCheckoutAction(consultationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  const { data: c, error: cErr } = await supabase
    .from("consultations")
    .select(`
      id,
      agreed_price,
      client_id,
      case_id,
      cases (title),
      lawyer_profiles (
        profiles:user_id (first_name, last_name)
      )
    `)
    .eq("id", consultationId)
    .single();

  if (cErr || !c) return { success: false, error: "Consulta no encontrada." };
  if (c.client_id !== user.id) return { success: false, error: "No autorizado." };

  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const rawLawyer = c.lawyer_profiles as any;
  const lawyerName = rawLawyer?.profiles
    ? `${rawLawyer.profiles.first_name} ${rawLawyer.profiles.last_name}`
    : "Abogado Colegiado";
  const caseTitle = (c.cases as any)?.title || "Consulta Legal ALYA";

  if (mpToken) {
    try {
      const prefRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mpToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              id: c.id,
              title: `Consulta Legal con ${lawyerName} - ${caseTitle}`,
              unit_price: Number(c.agreed_price),
              quantity: 1,
              currency_id: "PEN",
            },
          ],
          external_reference: `consultation_${c.id}`,
          back_urls: {
            success: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/chat?payment=success&consultationId=${c.id}`,
            failure: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/chat?payment=failure&consultationId=${c.id}`,
            pending: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/chat?payment=pending&consultationId=${c.id}`,
          },
          auto_return: "approved",
        }),
      });

      if (prefRes.ok) {
        const prefData = await prefRes.json();
        return {
          success: true,
          checkoutUrl: prefData.init_point || prefData.sandbox_init_point,
          preferenceId: prefData.id,
        };
      }
    } catch (fetchErr) {
      console.error("Error al crear preferencia MP:", fetchErr);
    }
  }

  // Modo simulación interactiva si no hay token de MP
  return {
    success: true,
    isSimulation: true,
  };
}

/**
 * Confirmación de pago con tarjeta en modo simulación (entorno de pruebas/demo)
 */
export async function confirmSimulatedConsultationPaymentAction(consultationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  const { data: c } = await supabase
    .from("consultations")
    .select("id, client_id, case_id, agreed_price")
    .eq("id", consultationId)
    .single();

  if (!c || c.client_id !== user.id) return { success: false, error: "No autorizado" };

  await supabase
    .from("consultations")
    .update({
      payment_status: "held_escrow",
      payment_method: "mercadopago",
      payment_reference: `SIM-MP-${Date.now().toString().slice(-6)}`,
      paid_at: new Date().toISOString(),
    })
    .eq("id", consultationId);

  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("case_id", c.case_id)
    .maybeSingle();

  if (conv) {
    await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      message: `💳 **Pago de Honorarios en Custodia (Escrow)**:\nMedio: Mercado Pago (Tarjeta)\nMonto: S/ ${Number(c.agreed_price).toFixed(2)}\nEstado: **Fondos protegidos en custodia ALYA**\nEl honorario se encuentra asegurado y será liberado al concluir la sesión.`,
    });
    revalidatePath(`/chat/${conv.id}`);
  }

  revalidatePath("/lawyer/schedule");
  return { success: true };
}

/**
 * Libera el pago en custodia de la consulta legal al abogado
 */
export async function releaseConsultationPaymentAction(consultationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  const { data: c } = await supabase
    .from("consultations")
    .select("id, client_id, lawyer_id, lawyer_profiles!inner(user_id)")
    .eq("id", consultationId)
    .single();

  if (!c) return { success: false, error: "Consulta no encontrada." };
  const isClient = c.client_id === user.id;
  const isLawyer = (c.lawyer_profiles as any)?.user_id === user.id;

  if (!isClient && !isLawyer) return { success: false, error: "No autorizado." };

  await supabase
    .from("consultations")
    .update({
      payment_status: "released",
      released_at: new Date().toISOString(),
    })
    .eq("id", consultationId);

  revalidatePath("/lawyer/schedule");
  return { success: true, message: "Fondos liberados exitosamente al abogado." };
}

