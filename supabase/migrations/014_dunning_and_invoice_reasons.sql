-- Migración 014: Dunning automático y razones de rechazo de facturas
-- Agrega trazabilidad de rechazo a subscription_invoices y función RPC de barrido de dunning

-- 1. Agregar columna rejection_reason a facturas
ALTER TABLE public.subscription_invoices 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Función de barrido diario de dunning (Dunning Sweep)
CREATE OR REPLACE FUNCTION public.cron_subscription_dunning_sweep()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_trial_downgrades INT := 0;
    v_past_due_cancels INT := 0;
    v_now TIMESTAMPTZ := NOW();
    r RECORD;
BEGIN
    -- A. Degradar pruebas vencidas a starter y registrar término de trial
    FOR r IN 
        SELECT id, lawyer_id 
        FROM public.lawyer_subscriptions
        WHERE status = 'trialing' AND current_period_end < v_now
    LOOP
        UPDATE public.lawyer_subscriptions
        SET plan_id = 'starter',
            status = 'active',
            matches_used_this_period = 0,
            trial_ended_at = v_now,
            current_period_start = v_now,
            current_period_end = v_now + INTERVAL '1 month',
            updated_at = v_now
        WHERE id = r.id;

        -- Notificar al abogado
        INSERT INTO public.notifications (user_id, type, title, message, data)
        SELECT 
            lp.user_id,
            'system',
            'Período de Prueba PRO Concluido',
            'Tu período de prueba PRO ha culminado y tu cuenta ha pasado al Plan Básico Colegiado. Actualiza a Pro para recuperar el Asistente IA y los 30 contactos mensuales.',
            jsonb_build_object('event', 'trial_ended', 'downgraded_to', 'starter')
        FROM public.lawyer_profiles lp
        WHERE lp.id = r.lawyer_id;

        v_trial_downgrades := v_trial_downgrades + 1;
    END LOOP;

    -- B. Degradar cuentas past_due que superaron 3 días de gracia
    FOR r IN 
        SELECT id, lawyer_id 
        FROM public.lawyer_subscriptions
        WHERE status = 'past_due' AND current_period_end + INTERVAL '3 days' < v_now
    LOOP
        UPDATE public.lawyer_subscriptions
        SET plan_id = 'starter',
            status = 'canceled',
            matches_used_this_period = 0,
            current_period_start = v_now,
            current_period_end = v_now + INTERVAL '1 month',
            updated_at = v_now
        WHERE id = r.id;

        -- Notificar al abogado
        INSERT INTO public.notifications (user_id, type, title, message, data)
        SELECT 
            lp.user_id,
            'system',
            'Membresía Suspendida por Pago Pendiente',
            'Ha concluido el período de gracia de 3 días sin registrarse el pago de tu membresía. Tu cuenta ha sido ajustada al Plan Básico.',
            jsonb_build_object('event', 'past_due_canceled')
        FROM public.lawyer_profiles lp
        WHERE lp.id = r.lawyer_id;

        v_past_due_cancels := v_past_due_cancels + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'trial_downgrades', v_trial_downgrades,
        'past_due_cancels', v_past_due_cancels,
        'executed_at', v_now
    );
END;
$$;
