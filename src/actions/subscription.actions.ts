"use server";

import { createClient } from "@/lib/supabase/server";
import {
  SubscriptionPlan,
  LawyerSubscription,
  MatchQuotaResult,
} from "@/lib/types/subscription.types";

/**
 * Obtiene el catálogo de planes de suscripción activos.
 */
export async function getSubscriptionPlansAction(): Promise<{
  success: boolean;
  plans?: SubscriptionPlan[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price_pen", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, plans: (data as any[]) || [] };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al obtener planes" };
  }
}

/**
 * Obtiene la suscripción activa del abogado autenticado junto con su plan y cuotas.
 */
export async function getMyLawyerSubscriptionAction(): Promise<{
  success: boolean;
  subscription?: LawyerSubscription;
  plan?: SubscriptionPlan;
  daysRemaining?: number;
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

    // 1. Obtener ID del perfil de abogado
    const { data: lawyer, error: lpErr } = await supabase
      .from("lawyer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (lpErr || !lawyer) {
      return { success: false, error: "Perfil de abogado no encontrado" };
    }

    // 2. Obtener suscripción y plan
    const { data: sub, error: subErr } = await supabase
      .from("lawyer_subscriptions")
      .select(`
        *,
        plans:subscription_plans (*)
      `)
      .eq("lawyer_id", lawyer.id)
      .maybeSingle();

    if (subErr) {
      return { success: false, error: subErr.message };
    }

    // Si aún no tiene registro, asignar starter
    if (!sub) {
      const { data: newSub } = await supabase
        .from("lawyer_subscriptions")
        .insert({
          lawyer_id: lawyer.id,
          plan_id: "starter",
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        })
        .select("*, plans:subscription_plans(*)")
        .single();

      return {
        success: true,
        subscription: newSub as any,
        plan: (newSub as any)?.plans,
        daysRemaining: 30,
      };
    }

    // Calcular días restantes de facturación
    const endDate = new Date(sub.current_period_end);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      success: true,
      subscription: sub as any,
      plan: (sub as any)?.plans,
      daysRemaining,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Error al consultar suscripción",
    };
  }
}

/**
 * Valida y consume 1 match para el abogado autenticado mediante la RPC atómica.
 */
export async function consumeMatchQuotaAction(lawyerProfileId: string): Promise<MatchQuotaResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("consume_lawyer_match_quota", {
    p_lawyer_id: lawyerProfileId,
  });

  if (error) {
    console.error("Error al consumir cuota de match:", error);
    return {
      allowed: false,
      reason: "INACTIVE_SUBSCRIPTION",
      current_usage: 0,
      max_quota: 0,
      plan_tier: "starter",
      plan_name: "Plan Básico",
    };
  }

  return (data as unknown) as MatchQuotaResult;
}
