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
