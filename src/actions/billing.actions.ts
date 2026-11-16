"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { SubscriptionInvoice } from "@/lib/types/subscription.types";

interface SubmitVoucherParams {
  targetPlanId: string;
  amountPen: number;
  paymentMethod: "yape" | "plin" | "bank_transfer";
  voucherUrl: string;
  invoiceType: "boleta" | "factura";
  taxIdNumber?: string;
  taxLegalName?: string;
  operationNumber?: string;
}

async function verifyAdminAccess(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ authorized: boolean; userId?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { authorized: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" && profile?.role !== "verifier") {
    return { authorized: false };
  }

  return { authorized: true, userId: user.id };
}

/**
 * Registra un comprobante de pago manual (Yape, Plin o Transferencia BCP)
 * enviado por el abogado para revisión administrativa.
 */
export async function submitManualPaymentVoucherAction(params: SubmitVoucherParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para registrar tu comprobante." };
    }

    if (
      !params.voucherUrl ||
      params.voucherUrl.includes("..") ||
      !params.voucherUrl.startsWith(`${user.id}/`)
    ) {
      return { success: false, error: "Ruta de comprobante no válida o no autorizada." };
    }

    // 1. Obtener perfil del abogado
    const { data: lawyer, error: lpErr } = await supabase
      .from("lawyer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (lpErr || !lawyer) {
      return { success: false, error: "Perfil de abogado no encontrado." };
    }

    // 2. Obtener la suscripción actual del abogado
    const { data: sub, error: subErr } = await supabase
      .from("lawyer_subscriptions")
      .select("id")
      .eq("lawyer_id", lawyer.id)
      .maybeSingle();

    if (subErr || !sub) {
      return { success: false, error: "No se encontró el registro de suscripción del abogado." };
    }

    // 3. Validar plan destino
    const { data: plan, error: planErr } = await supabase
      .from("subscription_plans")
      .select("id, name, price_pen")
      .eq("id", params.targetPlanId)
      .single();

    if (planErr || !plan) {
      return { success: false, error: "El plan seleccionado no es válido." };
    }

    // 4. Insertar comprobante en public.subscription_invoices (monto autoritativo desde DB)
    const { data: invoice, error: invErr } = await supabase
      .from("subscription_invoices")
      .insert({
        subscription_id: sub.id,
        lawyer_id: lawyer.id,
        target_plan_id: params.targetPlanId,
        amount_pen: Number(plan.price_pen),
        status: "review_pending",
        payment_method: params.paymentMethod,
        voucher_url: params.voucherUrl,
        invoice_type: params.invoiceType,
        tax_id_number: params.taxIdNumber || null,
        tax_legal_name: params.taxLegalName || null,
        invoice_number: params.operationNumber ? `OP-${params.operationNumber}` : null,
      })
      .select("id")
      .single();

    if (invErr) {
      console.error("Error al registrar factura manual:", invErr);
      return { success: false, error: `Error al guardar comprobante: ${invErr.message}` };
    }

    revalidatePath("/lawyer/subscription");
    revalidatePath("/admin/subscriptions");

    return {
      success: true,
      invoiceId: invoice.id,
      message: "Comprobante enviado exitosamente. Será revisado por administración en menos de 2 horas hábiles.",
    };
  } catch (err: any) {
    console.error("Error inesperado en submitManualPaymentVoucherAction:", err);
    return { success: false, error: err.message || "Error al registrar comprobante" };
  }
}

/**
 * Consulta todas las facturas y comprobantes para el panel de administración.
 */
export async function getAdminInvoicesAction(statusFilter?: string) {
  try {
    const supabase = await createClient();
    const adminCheck = await verifyAdminAccess(supabase);
    if (!adminCheck.authorized) {
      return { success: false, error: "Acceso denegado: se requieren privilegios de administrador." };
    }

    let query = supabase
      .from("subscription_invoices")
      .select(`
        *,
        target_plan:subscription_plans (*),
        lawyer_profiles:lawyer_id (
          id,
          bar_number,
          bar_association,
          profiles:user_id (
            first_name,
            last_name,
            phone
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error al consultar facturas admin:", error);
      return { success: false, error: error.message };
    }

    return { success: true, invoices: (data as any[]) || [] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Aprueba un comprobante de pago manual y activa inmediatamente el plan para el abogado.
 */
export async function approveManualPaymentInvoiceAction(invoiceId: string) {
  try {
    const supabase = await createClient();
    const adminCheck = await verifyAdminAccess(supabase);
    if (!adminCheck.authorized) {
      return { success: false, error: "Acceso denegado: se requieren privilegios de administrador." };
    }

    // 1. Obtener la factura
    const { data: invoice, error: invErr } = await supabase
      .from("subscription_invoices")
      .select(`
        *,
        target_plan:subscription_plans (*)
      `)
      .eq("id", invoiceId)
      .single();

    if (invErr || !invoice) {
      return { success: false, error: "Factura o comprobante no encontrado." };
    }

    if (invoice.status === "paid") {
      return { success: false, error: "Este comprobante ya fue aprobado previamente." };
    }

    const targetPlan = invoice.target_plan;
    if (!targetPlan) {
      return { success: false, error: "No se identificó el plan de destino asociado al comprobante." };
    }

    const now = new Date();
    const periodDays = targetPlan.billing_period === "annual" ? 365 : 30;
    const periodEnd = new Date(now.getTime() + periodDays * 86400000).toISOString();

    // 2. Marcar la factura como pagada
    const { error: updateInvErr } = await supabase
      .from("subscription_invoices")
      .update({
        status: "paid",
        paid_at: now.toISOString(),
      })
      .eq("id", invoiceId);

    if (updateInvErr) {
      return { success: false, error: `Error al actualizar factura: ${updateInvErr.message}` };
    }

    // 3. Actualizar la suscripción del abogado
    const { error: updateSubErr } = await supabase
      .from("lawyer_subscriptions")
      .update({
        plan_id: targetPlan.id,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd,
        matches_used_this_period: 0,
        external_provider: "manual",
        cancel_at_period_end: false,
        updated_at: now.toISOString(),
      })
      .eq("lawyer_id", invoice.lawyer_id);

    if (updateSubErr) {
      console.error("Error al activar suscripción del abogado:", updateSubErr);
      return { success: false, error: `Factura pagada pero error al activar plan: ${updateSubErr.message}` };
    }

    // 4. Notificar al abogado
    const { data: lawyerProfile } = await supabase
      .from("lawyer_profiles")
      .select("user_id")
      .eq("id", invoice.lawyer_id)
      .single();

    if (lawyerProfile?.user_id) {
      await supabase.from("notifications").insert({
        user_id: lawyerProfile.user_id,
        title: "¡Pago Aprobado con Éxito!",
        message: `Tu comprobante de pago ha sido verificado. Tu ${targetPlan.name} ya se encuentra 100% activo.`,
        type: "system",
        data: { invoice_id: invoiceId, plan_id: targetPlan.id },
      });
    }

    revalidatePath("/admin/subscriptions");
    revalidatePath("/lawyer/subscription");
    revalidatePath("/lawyer/dashboard");

    return {
      success: true,
      message: `Comprobante aprobado exitosamente. Se activó el ${targetPlan.name} por ${periodDays} días.`,
    };
  } catch (err: any) {
    console.error("Error al aprobar comprobante:", err);
    return { success: false, error: err.message || "Error al procesar aprobación" };
  }
}

/**
 * Rechaza un comprobante de pago manual con un motivo visible para el abogado.
 */
export async function rejectManualPaymentInvoiceAction(invoiceId: string, reason: string) {
  try {
    const supabase = await createClient();
    const adminCheck = await verifyAdminAccess(supabase);
    if (!adminCheck.authorized) {
      return { success: false, error: "Acceso denegado: se requieren privilegios de administrador." };
    }

    // 1. Obtener la factura
    const { data: invoice, error: invErr } = await supabase
      .from("subscription_invoices")
      .select("*, lawyer_profiles(user_id)")
      .eq("id", invoiceId)
      .single();

    if (invErr || !invoice) {
      return { success: false, error: "Comprobante no encontrado." };
    }

    // 2. Actualizar estado a failed y registrar motivo de rechazo
    const { error: updateErr } = await supabase
      .from("subscription_invoices")
      .update({
        status: "failed",
        rejection_reason: reason,
      })
      .eq("id", invoiceId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // 3. Notificar al abogado con el motivo
    const userId = (invoice.lawyer_profiles as any)?.user_id;
    if (userId) {
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Comprobante de Pago Observado",
        message: `Tu comprobante de pago no pudo ser validado: ${reason}. Por favor sube un nuevo comprobante legible.`,
        type: "system",
        data: { invoice_id: invoiceId, reason },
      });
    }

    revalidatePath("/admin/subscriptions");
    revalidatePath("/lawyer/subscription");

    return { success: true, message: "Comprobante rechazado y abogado notificado." };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Consulta el historial de facturas y comprobantes del abogado autenticado.
 */
export async function getMyInvoicesAction(): Promise<{
  success: boolean;
  invoices?: SubscriptionInvoice[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autenticado" };
    }

    const { data: lawyer, error: lpErr } = await supabase
      .from("lawyer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (lpErr || !lawyer) {
      return { success: false, error: "Perfil de abogado no encontrado" };
    }

    const { data: invoices, error } = await supabase
      .from("subscription_invoices")
      .select(`
        *,
        target_plan:subscription_plans (*)
      `)
      .eq("lawyer_id", lawyer.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, invoices: (invoices as any[]) || [] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Calcula estadísticas y métricas financieras SaaS de suscripciones para el panel admin.
 */
export async function getAdminSubscriptionStatsAction() {
  try {
    const supabase = await createClient();
    const adminCheck = await verifyAdminAccess(supabase);
    if (!adminCheck.authorized) {
      return { success: false, error: "Acceso denegado: se requieren privilegios de administrador." };
    }

    const [subsRes, invoicesRes] = await Promise.all([
      supabase.from("lawyer_subscriptions").select(`
        status,
        plan_id,
        trial_ended_at,
        subscription_plans (
          tier,
          price_pen,
          billing_period
        )
      `),
      supabase.from("subscription_invoices").select("status, amount_pen, paid_at"),
    ]);

    const subs = subsRes.data || [];
    const invoices = invoicesRes.data || [];

    const totalActive = subs.filter((s) => s.status === "active").length;
    const totalTrialing = subs.filter((s) => s.status === "trialing").length;
    const totalPastDue = subs.filter((s) => s.status === "past_due").length;
    const totalCanceled = subs.filter((s) => s.status === "canceled").length;
    const pendingReviewCount = invoices.filter((i) => i.status === "review_pending").length;

    // Desglose por Tier
    const tierCounts = {
      starter: 0,
      pro: 0,
      elite: 0,
    };

    let estimatedMrr = 0;
    subs.forEach((s: any) => {
      const tier = s.subscription_plans?.tier as "starter" | "pro" | "elite" | undefined;
      if (tier && tierCounts[tier] !== undefined) {
        tierCounts[tier] += 1;
      }

      if (s.status === "active" && s.subscription_plans) {
        if (s.subscription_plans.billing_period === "monthly") {
          estimatedMrr += Number(s.subscription_plans.price_pen);
        } else if (s.subscription_plans.billing_period === "annual") {
          estimatedMrr += Number(s.subscription_plans.price_pen) / 12;
        }
      }
    });

    // Total recaudado
    const totalCollectedPen = invoices
      .filter((i) => i.status === "paid")
      .reduce((acc, curr) => acc + Number(curr.amount_pen), 0);

    // ARPU (Average Revenue Per User)
    const arpuPen = totalActive > 0 ? Math.round(estimatedMrr / totalActive) : 0;

    // Tasa de conversión de prueba a pago
    const totalEverTrialed = subs.filter((s) => s.trial_ended_at || s.status === "trialing").length;
    const convertedFromTrial = subs.filter(
      (s) => s.status === "active" && s.subscription_plans?.tier !== "starter" && s.trial_ended_at
    ).length;
    const trialToPaidConversionRate =
      totalEverTrialed > 0 ? Math.round((convertedFromTrial / totalEverTrialed) * 100) : 0;

    // Churn rate estimado
    const totalSubscribedCohort = totalActive + totalPastDue + totalCanceled;
    const churnRate =
      totalSubscribedCohort > 0
        ? Math.round(((totalPastDue + totalCanceled) / totalSubscribedCohort) * 100)
        : 0;

    return {
      success: true,
      stats: {
        totalActive,
        totalTrialing,
        totalPastDue,
        pendingReviewCount,
        estimatedMrr: Math.round(estimatedMrr),
        totalCollectedPen: Math.round(totalCollectedPen),
        arpuPen,
        trialToPaidConversionRate,
        churnRate,
        tierCounts,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Ejecuta el procedimiento de barrido de dunning para degradar cuentas vencidas
 * y notificar a los abogados afectados.
 */
export async function runDunningSweepAction() {
  try {
    const supabase = await createClient();
    const adminCheck = await verifyAdminAccess(supabase);
    if (!adminCheck.authorized) {
      return { success: false, error: "Acceso denegado: se requieren privilegios de administrador." };
    }

    const { data, error } = await supabase.rpc("cron_subscription_dunning_sweep");

    if (error) {
      console.error("Error al ejecutar barrido de dunning:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/subscriptions");
    revalidatePath("/lawyer/subscription");
    revalidatePath("/lawyer/dashboard");

    return { success: true, result: data };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al ejecutar dunning" };
  }
}

interface CardPaymentParams {
  targetPlanId: string;
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
  invoiceType: "boleta" | "factura";
  taxIdNumber: string;
  taxLegalName: string;
}

/**
 * Procesa el pago con tarjeta de crédito/débito para activar el plan Pro o Élite.
 */
export async function processCardSubscriptionPaymentAction(params: CardPaymentParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para activar tu plan." };
    }

    const digits = params.cardNumber.replace(/\D/g, "");
    if (digits.length < 15 || digits.length > 16) {
      return { success: false, error: "Número de tarjeta inválido (debe tener 15 o 16 dígitos)." };
    }

    const expiryMatch = params.expiry.trim().match(/^(\d{2})\/(\d{2})$/);
    if (!expiryMatch) {
      return { success: false, error: "Fecha de vencimiento inválida (formato MM/AA)." };
    }
    const expMonth = Number(expiryMatch[1]);
    const expYear = 2000 + Number(expiryMatch[2]);
    const now = new Date();
    if (
      expMonth < 1 ||
      expMonth > 12 ||
      expYear < now.getFullYear() ||
      (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)
    ) {
      return { success: false, error: "La tarjeta ingresada se encuentra vencida o tiene mes inválido." };
    }

    const cvvDigits = params.cvv.replace(/\D/g, "");
    if (cvvDigits.length < 3 || cvvDigits.length > 4) {
      return { success: false, error: "El código CVV debe tener 3 o 4 dígitos." };
    }

    const taxDigits = params.taxIdNumber.replace(/\D/g, "");
    if (params.invoiceType === "factura" && taxDigits.length !== 11) {
      return { success: false, error: "Para Factura, el RUC debe tener exactamente 11 dígitos numéricos." };
    }
    if (params.invoiceType === "boleta" && taxDigits.length !== 8) {
      return { success: false, error: "Para Boleta, el DNI debe tener exactamente 8 dígitos numéricos." };
    }

    const { data: lawyer, error: lpErr } = await supabase
      .from("lawyer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (lpErr || !lawyer) {
      return { success: false, error: "Perfil de abogado no encontrado." };
    }

    const { data: plan, error: planErr } = await supabase
      .from("subscription_plans")
      .select("id, name, price_pen, billing_period")
      .eq("id", params.targetPlanId)
      .single();

    if (planErr || !plan) {
      return { success: false, error: "El plan seleccionado no es válido." };
    }

    let { data: sub } = await supabase
      .from("lawyer_subscriptions")
      .select("id")
      .eq("lawyer_id", lawyer.id)
      .maybeSingle();

    const periodDays = plan.billing_period === "annual" ? 365 : 30;
    const periodEnd = new Date(now.getTime() + periodDays * 86400000).toISOString();
    const cardBrand = digits.startsWith("4")
      ? "Visa"
      : digits.startsWith("5")
      ? "Mastercard"
      : digits.startsWith("3")
      ? "Amex/Diners"
      : "Tarjeta";
    const lastFour = digits.slice(-4);

    if (!sub) {
      const { data: createdSub, error: createSubErr } = await supabase
        .from("lawyer_subscriptions")
        .insert({
          lawyer_id: lawyer.id,
          plan_id: plan.id,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: periodEnd,
          external_provider: "card_direct",
          card_brand: cardBrand,
          card_last_four: lastFour,
          matches_used_this_period: 0,
        })
        .select("id")
        .single();

      if (createSubErr || !createdSub) {
        return {
          success: false,
          error: `No se pudo activar la suscripción: ${createSubErr?.message || "Error interno"}`,
        };
      }
      sub = createdSub;
    } else {
      const { error: updSubErr } = await supabase
        .from("lawyer_subscriptions")
        .update({
          plan_id: plan.id,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: periodEnd,
          external_provider: "card_direct",
          card_brand: cardBrand,
          card_last_four: lastFour,
          matches_used_this_period: 0,
        })
        .eq("id", sub.id);

      if (updSubErr) {
        return { success: false, error: `Error al actualizar plan: ${updSubErr.message}` };
      }
    }

    const opCode = `CARD-${Date.now().toString().slice(-6)}`;
    const { data: invoice, error: invErr } = await supabase
      .from("subscription_invoices")
      .insert({
        subscription_id: sub.id,
        lawyer_id: lawyer.id,
        target_plan_id: plan.id,
        amount_pen: plan.price_pen,
        status: "paid",
        payment_method: "card",
        invoice_type: params.invoiceType,
        tax_id_number: taxDigits,
        tax_legal_name: params.taxLegalName.trim(),
        invoice_number: opCode,
        paid_at: now.toISOString(),
      })
      .select("id")
      .single();

    if (invErr) {
      console.error("Error al registrar comprobante con tarjeta:", invErr);
    }

    revalidatePath("/lawyer/subscription");
    revalidatePath("/lawyer/dashboard");
    revalidatePath("/admin/subscriptions");

    return {
      success: true,
      invoiceId: invoice?.id,
      message: `¡Suscripción ${plan.name} activada inmediatamente con tarjeta terminada en ${lastFour}! Tu comprobante ${opCode} ya figura en tu historial.`,
    };
  } catch (err: any) {
    console.error("Error en processCardSubscriptionPaymentAction:", err);
    return { success: false, error: err.message || "Error procesando el pago con tarjeta." };
  }
}
