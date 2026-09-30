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

  const isMatched = updatedMatch.status === "matched" || (updatedMatch.user_interest && updatedMatch.lawyer_interest);

  revalidatePath(`/cases/${updatedMatch.case_id}/match`);
  revalidatePath("/dashboard");

  return {
    success: true,
    isMatched,
    conversationId: (updatedMatch.conversations as any)?.id || null,
  };
}

export async function lawyerInteractMatchAction(matchId: string, interested: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const updatePayload: {
    lawyer_interest: boolean;
    lawyer_interacted_at: string;
    status?: "discarded" | "pending" | "lawyer_interested" | "matched";
  } = {
    lawyer_interest: interested,
    lawyer_interacted_at: new Date().toISOString(),
  };

  if (!interested) {
    updatePayload.status = "discarded";
  }

  // Si el abogado muestra interés, validar y consumir cuota de suscripción
  if (interested) {
    const { data: lawyerProfile } = await supabase
      .from("lawyer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (lawyerProfile) {
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

  const isMatched = updatedMatch.status === "matched" || (updatedMatch.user_interest && updatedMatch.lawyer_interest);

  revalidatePath("/lawyer/dashboard");

  return {
    success: true,
    isMatched,
    conversationId: (updatedMatch.conversations as any)?.id || null,
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
