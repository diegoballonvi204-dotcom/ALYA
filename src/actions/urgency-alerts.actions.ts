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

  // Obtener casos urgentes vinculados a matches vigentes del abogado (única fuente de datos con el panel)
  const { data: matches, error } = await supabase
    .from("matches")
    .select(`
      id,
      status,
      cases!inner (
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
      )
    `)
    .eq("lawyer_id", lawyer.id)
    .neq("status", "discarded")
    .eq("cases.urgency", "immediate")
    .in("cases.status", ["published", "matching", "contacted", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return { error: error.message, urgentCases: [] };
  }

  const now = Date.now();
  const seenCaseIds = new Set<string>();
  const urgentCases: UrgentFlagrancyCase[] = [];

  for (const m of matches || []) {
    const c = (m as any).cases;
    if (!c || seenCaseIds.has(c.id)) continue;
    seenCaseIds.add(c.id);

    const createdTime = new Date(c.created_at).getTime();
    const hoursElapsed = Math.max(0, Math.floor((now - createdTime) / (1000 * 60 * 60)));
    // Plazo constitucional de 48 horas de detención policial
    const hoursRemainingInFlagrancy = Math.max(0, 48 - hoursElapsed);

    urgentCases.push({
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
    });
  }

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
  const rawPhone =
    caseItem.emergency_contact_phone ||
    clientProfile?.phone ||
    process.env.NEXT_PUBLIC_ALYA_EMERGENCY_PHONE ||
    "";
  const clientName = `${clientProfile?.first_name || "Cliente"} ${clientProfile?.last_name || ""}`.trim();
  const policeStation = caseItem.police_station || "la Comisaría de Turno";

  // Mensaje estructurado de asistencia jurídica urgente
  const rawMessage =
    `ALERTA DE GUARDIA LEGAL — ALYA PERÚ\n\n` +
    `Estimado(a) ${clientName}, le escribe su abogado a través de la Red de Flagrancia de ALYA.\n\n` +
    `Caso: ${caseItem.title}\n` +
    `Sede: ${policeStation} (${caseItem.city})\n` +
    `Asistencia: Me estoy apersonando y requiero coordinar inmediatamente la defensa técnica antes del vencimiento del plazo perentorio de 48h (Art. 2.24.f Constitución).\n\n` +
    `Por favor confírmeme su ubicación exacta o si se encuentra con el fiscal de turno.`;

  const digits = String(rawPhone).replace(/[^0-9]/g, "");
  const formattedPhone =
    digits.length === 9 && digits.startsWith("9")
      ? `51${digits}`
      : digits.startsWith("51") && digits.length >= 11
      ? digits
      : digits;

  const encodedText = encodeURIComponent(rawMessage);
  const whatsappUrl = formattedPhone
    ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  return {
    success: true,
    whatsappUrl,
    hasClientPhone: Boolean(caseItem.emergency_contact_phone || clientProfile?.phone),
  };
}
