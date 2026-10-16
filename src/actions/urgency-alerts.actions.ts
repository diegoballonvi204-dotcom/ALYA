"use server";

import { createClient } from "@/lib/supabase/server";

export interface UrgentFlagrancyCase {
  id: string;
  title: string;
  description: string;
  city: string;
  urgency: "immediate" | "high";
  policeStation?: string | null;
  emergencyPhone?: string | null;
  createdAt: string;
  hoursElapsed: number;
  hoursRemainingInFlagrancy: number;
  specialtyName: string;
}

export async function getUrgentFlagrancyCasesAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado", urgentCases: [] };
  }

  // Verificar si es abogado
  const { data: lawyer } = await supabase
    .from("lawyer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!lawyer) {
    return { error: "Solo abogados autorizados pueden monitorear flagrancia.", urgentCases: [] };
  }

  // Obtener casos con urgencia 'immediate' publicados o en progreso reciente
  const { data: cases, error } = await supabase
    .from("cases")
    .select(`
      id,
      title,
      description,
      city,
      urgency,
      police_station,
      emergency_contact_phone,
      created_at,
      status,
      specialties:specialties!cases_specialty_id_fkey (name)
    `)
    .in("urgency", ["immediate", "high"])
    .in("status", ["published", "matching", "contacted", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    return { error: error.message, urgentCases: [] };
  }

  const now = Date.now();
  const urgentCases: UrgentFlagrancyCase[] = (cases || []).map((c: any) => {
    const createdTime = new Date(c.created_at).getTime();
    const hoursElapsed = Math.floor((now - createdTime) / (1000 * 60 * 60));
    // Plazo constitucional de 48 horas de detención policial
    const hoursRemainingInFlagrancy = Math.max(0, 48 - hoursElapsed);

    return {
      id: c.id,
      title: c.title,
      description: c.description,
      city: c.city,
      urgency: c.urgency,
      policeStation: c.police_station || "Comisaría / Fiscalía de Turno",
      emergencyPhone: c.emergency_contact_phone,
      createdAt: c.created_at,
      hoursElapsed,
      hoursRemainingInFlagrancy,
      specialtyName: c.specialties?.name || "Derecho Penal / Flagrancia",
    };
  });

  return { urgentCases };
}

export async function generateEmergencyWhatsAppLinkAction(caseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const { data: caseItem, error } = await supabase
    .from("cases")
    .select(`
      id,
      title,
      city,
      police_station,
      emergency_contact_phone,
      profiles:user_id (first_name, last_name, phone)
    `)
    .eq("id", caseId)
    .single();

  if (error || !caseItem) {
    return { error: "Caso no encontrado." };
  }

  const clientProfile = caseItem.profiles as any;
  const targetPhone = caseItem.emergency_contact_phone || clientProfile?.phone || "51999999999";
  const clientName = `${clientProfile?.first_name || "Cliente"} ${clientProfile?.last_name || ""}`.trim();
  const policeStation = caseItem.police_station || "la Comisaría de Turno";

  // Mensaje estructurado de asistencia jurídica urgente
  const textMessage = `*ALERTA DE GUARDIA LEGAL — ALYA PERÚ* 🚨%0A%0A` +
    `Estimado(a) *${clientName}*, le escribe su abogado asignado a través de la Red de Flagrancia de ALYA.%0A%0A` +
    `📌 *Caso:* ${caseItem.title}%0A` +
    `🏛️ *Sede:* ${policeStation} (${caseItem.city})%0A` +
    `⚖️ *Asistencia:* Me estoy apersonando y requiero coordinar inmediatamente la defensa técnica antes del vencimiento del plazo perentorio de 48h (Art. 2.24.f Constitución).%0A%0A` +
    `Por favor confírmeme si se encuentra con el fiscal de turno en este momento.`;

  const cleanPhone = targetPhone.replace(/[^0-9]/g, "");
  const formattedPhone = cleanPhone.startsWith("51") ? cleanPhone : `51${cleanPhone}`;

  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${textMessage}`;

  return { success: true, whatsappUrl };
}
