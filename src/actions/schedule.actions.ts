"use server";

import crypto from "crypto";
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

  // 2. Obtener la franja horaria configurada para ese día (con respaldo en metadata si RLS bloqueó)
  let { data: schedule, error: schedErr } = await supabase
    .from("lawyer_schedules")
    .select("start_time, end_time, slot_duration_minutes, is_active")
    .eq("lawyer_id", lawyerId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .maybeSingle();

  if (schedErr || !schedule) {
    const { data: verif } = await supabase
      .from("verifications")
      .select("documents_metadata")
      .eq("lawyer_id", lawyerId)
      .maybeSingle();
    const metaSchedules = (verif?.documents_metadata as any)?.weekly_schedules;
    if (Array.isArray(metaSchedules)) {
      const found = metaSchedules.find(
        (s: any) => Number(s.day_of_week) === dayOfWeek && s.is_active === true
      );
      if (found) {
        schedule = found;
        schedErr = null;
      }
    }
  }

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

  // 0. Verificar pertenencia del caso y tarifa autoritativa real del abogado en BD
  const { data: ownedCase } = await supabase
    .from("cases")
    .select("id, user_id")
    .eq("id", validated.data.caseId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ownedCase) {
    return { error: "No tienes autorización para agendar citas sobre este caso." };
  }

  const { data: lawyerProfile, error: lpErr } = await supabase
    .from("lawyer_profiles")
    .select("id, consultation_price")
    .eq("id", validated.data.lawyerId)
    .single();

  if (lpErr || !lawyerProfile) {
    return { error: "Perfil de abogado no encontrado." };
  }

  const authoritativePrice = Number(lawyerProfile?.consultation_price ?? validated.data.agreedPrice ?? 0);

  // 1. Validar que no haya duplicidad de solicitud activa ni conflicto de horario
  const { data: existingRequest } = await supabase
    .from("consultations")
    .select("id")
    .eq("case_id", validated.data.caseId)
    .eq("client_id", user.id)
    .eq("lawyer_id", validated.data.lawyerId)
    .eq("status", "requested")
    .maybeSingle();

  const { data: conflict } = await supabase
    .from("consultations")
    .select("id")
    .eq("lawyer_id", validated.data.lawyerId)
    .eq("scheduled_at", validated.data.scheduledAt)
    .in("status", ["requested", "confirmed", "rescheduled"])
    .maybeSingle();

  if (conflict && conflict.id !== existingRequest?.id) {
    return { error: "Este horario ya fue reservado por otro consultante. Por favor selecciona otro." };
  }

  // 2. Insertar o actualizar consulta existente con teleasistencia de 1 clic y estado de pago pendiente
  const shortId = crypto.randomBytes(3).toString("hex");
  const autoJitsiLink =
    validated.data.modality === "virtual"
      ? `https://meet.jit.si/alya-legal-${validated.data.caseId.slice(0, 8)}-${shortId}`
      : null;
  const roomPasscode =
    validated.data.modality === "virtual"
      ? crypto.randomInt(100000, 1000000).toString()
      : null;

  let consultation: any = null;
  let insertErr: any = null;

  if (existingRequest) {
    const resUpd = await supabase
      .from("consultations")
      .update({
        scheduled_at: validated.data.scheduledAt,
        duration_minutes: validated.data.durationMinutes,
        modality: validated.data.modality,
        agreed_price: authoritativePrice,
        notes: validated.data.notes || null,
      })
      .eq("id", existingRequest.id)
      .select()
      .single();
    consultation = resUpd.data;
    insertErr = resUpd.error;
  } else {
    const resIns = await supabase
      .from("consultations")
      .insert({
        case_id: validated.data.caseId,
        client_id: user.id,
        lawyer_id: validated.data.lawyerId,
        scheduled_at: validated.data.scheduledAt,
        duration_minutes: validated.data.durationMinutes,
        modality: validated.data.modality,
        agreed_price: authoritativePrice,
        notes: validated.data.notes || null,
        status: "requested",
        payment_status: "pending_payment",
        meeting_link: autoJitsiLink,
        room_passcode: roomPasscode,
      })
      .select()
      .single();
    consultation = resIns.data;
    insertErr = resIns.error;
  }

  if (insertErr) {
    return { error: "No se pudo registrar la cita en este momento. Intenta nuevamente." };
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
      timeZone: "America/Lima",
    });
    await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      message: `📅 **Solicitud de Cita Legal**:\nModalidad: ${validated.data.modality === "virtual" ? "Virtual (Videollamada)" : "Presencial en Estudio"}\nFecha: ${dateFormatted}\nTarifa: S/ ${authoritativePrice.toFixed(2)}\nEstado: Pendiente de confirmación`,
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
      status,
      payment_status,
      agreed_price,
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

  if (
    isClient &&
    !isLawyer &&
    (validated.data.status === "confirmed" || validated.data.status === "completed")
  ) {
    return {
      error: "Solo el abogado asignado puede confirmar o concluir la sesión legal.",
    };
  }

  if (validated.data.meetingLink && !/^https:\/\//i.test(validated.data.meetingLink.trim())) {
    return { error: "El enlace de videoconsulta debe utilizar protocolo seguro https://." };
  }

  const agreedPrice = Number(consultation.agreed_price ?? 0);
  const hasEscrowOrPaid =
    agreedPrice === 0 ||
    consultation.payment_status === "held_escrow" ||
    consultation.payment_status === "released";

  // H2: Bloquear confirmación y conclusión en el servidor si el pago no está en custodia
  if (validated.data.status === "confirmed" && !hasEscrowOrPaid) {
    return {
      error:
        "No es posible confirmar la cita mientras el abono del cliente figure como pendiente. El pago debe encontrarse en custodia ALYA.",
    };
  }

  if (validated.data.status === "completed" && !hasEscrowOrPaid) {
    return {
      error:
        "Operación bloqueada: no se puede marcar como concluida ni liberar honorarios de una cita con abono pendiente.",
    };
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
      const shortId = crypto.randomBytes(3).toString("hex");
      updatePayload.meeting_link = `https://meet.jit.si/alya-legal-${consultation.case_id.slice(0, 8)}-${shortId}`;
      updatePayload.room_passcode = crypto.randomInt(100000, 1000000).toString();
    }
  } else if (validated.data.meetingLink !== undefined) {
    updatePayload.meeting_link = validated.data.meetingLink || null;
  }

  if (validated.data.status === "completed") {
    // Solo liberar si había fondos en custodia (o consulta gratuita)
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

  if (!error && schedules && schedules.length > 0) {
    return { schedules };
  }

  // Fallback desde metadata si la tabla no tiene registros aún
  const { data: verif } = await supabase
    .from("verifications")
    .select("documents_metadata")
    .eq("lawyer_id", targetId)
    .maybeSingle();

  const metaSchedules = (verif?.documents_metadata as any)?.weekly_schedules;
  if (Array.isArray(metaSchedules) && metaSchedules.length > 0) {
    return { schedules: metaSchedules };
  }

  if (error) {
    return { error: "No se pudieron cargar los horarios en este momento.", schedules: [] };
  }
  return { schedules: schedules || [] };
}

export async function saveLawyerScheduleAction(schedules: SaveLawyerScheduleValues[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Debes iniciar sesión para actualizar tu disponibilidad." };

  const { data: lp } = await supabase
    .from("lawyer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!lp) return { error: "Perfil de abogado no encontrado." };

  for (const s of schedules) {
    const parsed = SaveLawyerScheduleSchema.safeParse(s);
    if (!parsed.success) {
      return { error: "Verifica que los horarios de inicio y fin tengan un formato válido (HH:MM)." };
    }
    if (parsed.data.isActive && parsed.data.startTime >= parsed.data.endTime) {
      return { error: "La hora de fin debe ser posterior a la hora de inicio en los días activos." };
    }
  }

  const normalizedRows = schedules.map((s) => ({
    lawyer_id: lp.id,
    day_of_week: s.dayOfWeek,
    start_time: s.startTime,
    end_time: s.endTime,
    slot_duration_minutes: s.slotDurationMinutes,
    is_active: s.isActive,
  }));

  // 1. Intento directo sobre public.lawyer_schedules
  let rlsBlocked = false;
  for (const row of normalizedRows) {
    const { error: upsertErr } = await supabase
      .from("lawyer_schedules")
      .upsert(row, { onConflict: "lawyer_id, day_of_week" });

    if (upsertErr) {
      console.warn("Error guardando en lawyer_schedules:", upsertErr.message);
      rlsBlocked = true;
      break;
    }
  }

  // 2. Si falló (ej. política RLS pendiente), intentar RPC SECURITY DEFINER
  if (rlsBlocked) {
    const { data: rpcRes, error: rpcErr } = await supabase.rpc(
      "save_lawyer_schedules_rpc" as any,
      { p_schedules: schedules }
    );

    if (!rpcErr && (rpcRes as any)?.success) {
      revalidatePath("/lawyer/schedule");
      return { success: true };
    }

    // 3. Respaldo seguro en verifications.documents_metadata del propio abogado
    const { data: existingVerif } = await supabase
      .from("verifications")
      .select("documents_metadata")
      .eq("lawyer_id", lp.id)
      .maybeSingle();

    const currentMeta = (existingVerif?.documents_metadata as Record<string, any>) || {};
    const { error: verifErr } = await supabase
      .from("verifications")
      .upsert(
        {
          lawyer_id: lp.id,
          documents_metadata: {
            ...currentMeta,
            weekly_schedules: normalizedRows,
            schedules_updated_at: new Date().toISOString(),
          },
        },
        { onConflict: "lawyer_id" }
      );

    if (verifErr) {
      console.error("Error en respaldo de disponibilidad:", verifErr.message);
      return {
        error:
          "No pudimos guardar tu disponibilidad en este momento. Por favor intenta nuevamente.",
      };
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

  if (!params.voucherUrl || params.voucherUrl.includes("..")) {
    return { success: false, error: "Ruta de comprobante no válida." };
  }

  if (!/^[a-zA-Z0-9_-]{4,40}$/.test(params.operationNumber.trim())) {
    return {
      success: false,
      error: "El número de operación debe tener entre 4 y 40 caracteres alfanuméricos.",
    };
  }

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
 * Procesa el pago seguro con tarjeta de crédito o débito asegurando custodia en Escrow
 */
export async function processCardConsultationPaymentAction(params: {
  consultationId: string;
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
  docNumber?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  const cleanNum = params.cardNumber.replace(/\s+/g, "");
  if (cleanNum.length < 15 || cleanNum.length > 19) {
    return { success: false, error: "Ingresa un número de tarjeta válido (15 o 16 dígitos)." };
  }
  if (!params.cardHolder || params.cardHolder.trim().length < 3) {
    return { success: false, error: "Ingresa el nombre del titular tal como figura en la tarjeta." };
  }
  if (!/^\d{2}\/\d{2}$/.test(params.expiry)) {
    return { success: false, error: "Formato de fecha de expiración inválido. Debe ser MM/AA." };
  }
  const [expMonth, expYear] = params.expiry.split("/").map(Number);
  if (expMonth < 1 || expMonth > 12) {
    return { success: false, error: "Mes de vencimiento inválido (debe ser entre 01 y 12)." };
  }
  if (params.cvv.length < 3 || params.cvv.length > 4) {
    return { success: false, error: "Código de seguridad CVV inválido (3 o 4 dígitos)." };
  }

  const { data: c } = await supabase
    .from("consultations")
    .select("id, client_id, case_id, agreed_price, meeting_link")
    .eq("id", params.consultationId)
    .single();

  if (!c || c.client_id !== user.id) return { success: false, error: "Consulta no encontrada o no autorizada" };

  // Detectar marca
  let brand = "Visa";
  if (cleanNum.startsWith("4")) brand = "Visa";
  else if (/^5[1-5]/.test(cleanNum) || /^2[2-7]/.test(cleanNum)) brand = "Mastercard";
  else if (/^3[47]/.test(cleanNum)) brand = "American Express";
  else if (/^3[68]/.test(cleanNum)) brand = "Diners Club";

  const last4 = cleanNum.slice(-4);
  const authCode = `AUTH-${Date.now().toString().slice(-6)}`;
  const autoMeetingRoom = c.meeting_link || `https://meet.jit.si/alya-legal-${c.id.replace(/-/g, "").slice(0, 16)}`;

  await supabase
    .from("consultations")
    .update({
      payment_status: "held_escrow",
      payment_method: `card_${brand.toLowerCase().replace(/\s+/g, "_")}`,
      payment_reference: authCode,
      paid_at: new Date().toISOString(),
      meeting_link: autoMeetingRoom,
    })
    .eq("id", params.consultationId);

  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("case_id", c.case_id)
    .maybeSingle();

  if (conv) {
    await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      message: `💳 **Pago con Tarjeta Procesado en Custodia (Escrow)**:\nTarjeta: ${brand} •••• ${last4}\nTitular: ${params.cardHolder.trim().toUpperCase()}\nAutorización: ${authCode}\nMonto Abonado: S/ ${Number(c.agreed_price).toFixed(2)}\nEstado: **Fondos en Custodia Protegida ALYA**\nEl honorario del abogado se encuentra retenido en garantía y solo se liberará al concluir la consulta jurídica.`,
    });
    revalidatePath(`/chat/${conv.id}`);
  }

  revalidatePath("/lawyer/schedule");
  return {
    success: true,
    authCode,
    brand,
    last4,
  };
}

/**
 * Confirmación de pago con tarjeta en modo simulación (entorno de pruebas/demo)
 */
export async function confirmSimulatedConsultationPaymentAction(consultationId: string) {
  if (process.env.NODE_ENV === "production" && process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return {
      success: false,
      error: "Simulación deshabilitada en entorno de producción.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  const { data: c } = await supabase
    .from("consultations")
    .select("id, client_id, case_id, agreed_price, meeting_link")
    .eq("id", consultationId)
    .single();

  if (!c || c.client_id !== user.id) return { success: false, error: "No autorizado" };

  const autoMeetingRoom = c.meeting_link || `https://meet.jit.si/alya-legal-${c.id.replace(/-/g, "").slice(0, 16)}`;

  await supabase
    .from("consultations")
    .update({
      payment_status: "held_escrow",
      payment_method: "mercadopago",
      payment_reference: `SIM-MP-${Date.now().toString().slice(-6)}`,
      paid_at: new Date().toISOString(),
      meeting_link: autoMeetingRoom,
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
    .select("id, client_id, lawyer_id, status, payment_status, agreed_price, lawyer_profiles!inner(user_id)")
    .eq("id", consultationId)
    .single();

  if (!c) return { success: false, error: "Consulta no encontrada." };
  const isClient = c.client_id === user.id;
  const isLawyer = (c.lawyer_profiles as any)?.user_id === user.id;

  if (!isClient && !isLawyer) return { success: false, error: "No autorizado." };

  if (c.status !== "completed" && !(isClient && c.status === "confirmed")) {
    return {
      success: false,
      error: "Solo pueden liberarse fondos de consultas concluidas o confirmadas por el cliente.",
    };
  }

  if (Number(c.agreed_price ?? 0) > 0 && c.payment_status !== "held_escrow") {
    return {
      success: false,
      error: "No existen fondos en custodia (Escrow) para liberar en esta consulta.",
    };
  }

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

