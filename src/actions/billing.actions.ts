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

    // 4. Insertar comprobante en public.subscription_invoices
    const { data: invoice, error: invErr } = await supabase
      .from("subscription_invoices")
      .insert({
        subscription_id: sub.id,
        lawyer_id: lawyer.id,
        target_plan_id: params.targetPlanId,
        amount_pen: params.amountPen,
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
