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

  // 2. Insertar consulta
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

  if (validated.data.meetingLink !== undefined) {
    updatePayload.meeting_link = validated.data.meetingLink || null;
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
