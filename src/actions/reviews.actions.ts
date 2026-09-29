"use server";

import { createClient } from "@/lib/supabase/server";
import {
  CreateReviewSchema,
  type CreateReviewValues,
} from "@/lib/validations/review.schema";
import { revalidatePath } from "next/cache";

export async function submitReviewAction(formData: CreateReviewValues) {
  const validated = CreateReviewSchema.safeParse(formData);
  if (!validated.success) {
    return { error: "Datos de calificación inválidos", details: validated.error.flatten() };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  // 1. Validar que la consulta pertenezca al usuario cliente
  const { data: consultation, error: cErr } = await supabase
    .from("consultations")
    .select("id, client_id, lawyer_id, case_id, status, scheduled_at")
    .eq("id", validated.data.consultationId)
    .single();

  if (cErr || !consultation) {
    return { error: "Consulta no encontrada." };
  }

  if (consultation.client_id !== user.id) {
    return { error: "Solo el cliente que reservó la consulta puede calificarla." };
  }

  // Si la consulta estaba confirmada y la fecha ya pasó, auto-marcarla como completed para permitir calificar
  if (consultation.status !== "completed") {
    const isPast = new Date(consultation.scheduled_at).getTime() <= Date.now();
    if (consultation.status === "confirmed" && isPast) {
      await supabase
        .from("consultations")
        .update({ status: "completed" })
        .eq("id", consultation.id);
    } else {
      return {
        error:
          "La consulta aún no ha sido marcada como concluida. Podrás calificarla tan pronto finalice.",
      };
    }
  }

  // 2. Verificar que no exista ya una reseña para esta consulta
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("consultation_id", validated.data.consultationId)
    .maybeSingle();

  if (existingReview) {
    return { error: "Esta consulta ya cuenta con una valoración registrada." };
  }

  // 3. Insertar la reseña en public.reviews
  // Los triggers trg_reviews_recalculate y trg_review_notify_lawyer se ejecutan automáticamente en Supabase
  const { data: newReview, error: insertErr } = await supabase
    .from("reviews")
    .insert({
      consultation_id: validated.data.consultationId,
      case_id: validated.data.caseId,
      client_id: user.id,
      lawyer_id: validated.data.lawyerId,
      communication_score: validated.data.communicationScore,
      punctuality_score: validated.data.punctualityScore,
      clarity_score: validated.data.clarityScore,
      attention_score: validated.data.attentionScore,
      comment: validated.data.comment?.trim() || null,
      is_published: true,
    })
    .select()
    .single();

  if (insertErr) {
    return { error: `Error registrando reseña: ${insertErr.message}` };
  }

  revalidatePath(`/cases/${validated.data.caseId}`);
  revalidatePath(`/lawyer/schedule`);
  revalidatePath(`/dashboard`);

  return { success: true, review: newReview };
}

export async function getLawyerReviewsAction(lawyerProfileId: string) {
  const supabase = await createClient();

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select(`
      id,
      communication_score,
      punctuality_score,
      clarity_score,
      attention_score,
      comment,
      created_at,
      profiles:client_id (
        first_name,
        city
      )
    `)
    .eq("lawyer_id", lawyerProfileId)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, reviews: [] };
  }

  const formatted = (reviews || []).map((r: any) => {
    const avgScore = Number(
      (
        (r.communication_score +
          r.punctuality_score +
          r.clarity_score +
          r.attention_score) /
        4.0
      ).toFixed(1)
    );

    return {
      id: r.id,
      clientName: r.profiles?.first_name || "Cliente Verificado",
      clientCity: r.profiles?.city || "Lima",
      communicationScore: r.communication_score,
      punctualityScore: r.punctuality_score,
      clarityScore: r.clarity_score,
      attentionScore: r.attention_score,
      averageScore: avgScore,
      comment: r.comment,
      createdAt: r.created_at,
    };
  });

  return { reviews: formatted };
}

export async function getConsultationReviewStatusAction(consultationId: string) {
  const supabase = await createClient();

  const { data: review } = await supabase
    .from("reviews")
    .select("id, communication_score, punctuality_score, clarity_score, attention_score, comment")
    .eq("consultation_id", consultationId)
    .maybeSingle();

  return { hasReviewed: !!review, review: review || null };
}
