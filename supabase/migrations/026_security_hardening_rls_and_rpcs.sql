-- Migración 026: Endurecimiento de seguridad (RLS, Triggers Anti-Escalada, RPCs SECURITY DEFINER y Constraints)
-- ALYA LegalTech Perú

-- ============================================================================
-- 1. Prevenir escalada de privilegios en public.profiles
-- ============================================================================
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Permitir operaciones del sistema / service_role / SQL Editor (auth.uid() IS NULL)
  -- o ejecutadas por un administrador/verificador autenticado.
  IF auth.uid() IS NULL OR public.is_admin_or_verifier() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS NOT NULL AND NEW.role NOT IN ('client', 'lawyer') THEN
      RAISE EXCEPTION 'Acceso denegado: no puedes asignarte un rol privilegiado';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      IF NEW.role IN ('admin', 'verifier') THEN
        RAISE EXCEPTION 'Acceso denegado: no puedes asignarte el rol %', NEW.role;
      END IF;

      -- Solo permitir transición legítima de onboarding (client -> lawyer) o completar perfil sin rol
      IF NOT (
        (OLD.role = 'client' AND NEW.role = 'lawyer')
        OR (OLD.role IS NULL AND NEW.role IN ('client', 'lawyer'))
      ) THEN
        RAISE EXCEPTION 'Acceso denegado: cambio de rol no permitido';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- ============================================================================
-- 2. Prevenir auto-verificación y manipulación de reputación en public.lawyer_profiles
-- ============================================================================
CREATE OR REPLACE FUNCTION public.prevent_lawyer_self_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Permitir service_role / SQL Admin, administradores/verificadores y triggers internos (ej. recálculo de reseñas)
  IF auth.uid() IS NULL OR public.is_admin_or_verifier() OR pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.verification_status IN ('verified', 'approved') OR COALESCE(NEW.is_activated, false) THEN
      RAISE EXCEPTION 'Acceso denegado: solo administración puede verificar o activar un perfil profesional';
    END IF;
    IF COALESCE(NEW.total_reviews, 0) <> 0 THEN
      RAISE EXCEPTION 'Acceso denegado: no puedes manipular métricas iniciales de reseñas';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
       AND NEW.verification_status IN ('verified', 'approved') THEN
      RAISE EXCEPTION 'Acceso denegado: no puedes aprobar tu propia verificación profesional';
    END IF;

    IF NEW.is_activated IS DISTINCT FROM OLD.is_activated
       AND COALESCE(NEW.is_activated, false)
       AND OLD.verification_status IS DISTINCT FROM 'verified' THEN
      RAISE EXCEPTION 'Acceso denegado: el perfil debe ser verificado antes de activarse';
    END IF;

    IF NEW.rating_average IS DISTINCT FROM OLD.rating_average
       OR NEW.total_reviews IS DISTINCT FROM OLD.total_reviews THEN
      RAISE EXCEPTION 'Acceso denegado: no puedes alterar tu calificación ni conteo de reseñas';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_lawyer_self_verification ON public.lawyer_profiles;
CREATE TRIGGER trg_prevent_lawyer_self_verification
  BEFORE INSERT OR UPDATE ON public.lawyer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_lawyer_self_verification();

-- ============================================================================
-- 3. Endurecer RPCs SECURITY DEFINER expuestos
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_lawyer_user_email(p_lawyer_id UUID)
RETURNS TABLE (email TEXT, first_name TEXT, last_name TEXT)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin_or_verifier() THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  RETURN QUERY
  SELECT
    u.email::TEXT,
    p.first_name::TEXT,
    p.last_name::TEXT
  FROM public.lawyer_profiles lp
  JOIN auth.users u ON u.id = lp.user_id
  LEFT JOIN public.profiles p ON p.id = lp.user_id
  WHERE lp.id = p_lawyer_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_lawyer_user_email(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_lawyer_user_email(UUID) TO authenticated, service_role;

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
    IF auth.uid() IS NOT NULL AND NOT public.is_admin_or_verifier() THEN
        RAISE EXCEPTION 'Acceso denegado';
    END IF;

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

REVOKE ALL ON FUNCTION public.cron_subscription_dunning_sweep() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cron_subscription_dunning_sweep() TO authenticated, service_role;

-- ============================================================================
-- 4. Restringir RLS en payout_requests (separar SELECT/INSERT y eliminar UPDATE/DELETE del abogado)
-- ============================================================================
DROP POLICY IF EXISTS "Abogados pueden ver y crear sus solicitudes de desembolso" ON public.payout_requests;
DROP POLICY IF EXISTS "Abogados pueden ver sus solicitudes de desembolso" ON public.payout_requests;
DROP POLICY IF EXISTS "Abogados pueden crear sus solicitudes de desembolso" ON public.payout_requests;

CREATE POLICY "Abogados pueden ver sus solicitudes de desembolso"
  ON public.payout_requests FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.lawyer_profiles WHERE id = lawyer_id));

CREATE POLICY "Abogados pueden crear sus solicitudes de desembolso"
  ON public.payout_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    status = 'requested'
    AND processed_at IS NULL
    AND transfer_voucher_url IS NULL
    AND auth.uid() IN (SELECT user_id FROM public.lawyer_profiles WHERE id = lawyer_id)
  );

-- ============================================================================
-- 5. Actualizar CHECK constraint de consultations.payment_method para soportar tarjetas
-- ============================================================================
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  FOR v_constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'consultations'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%payment_method%'
  LOOP
    EXECUTE format('ALTER TABLE public.consultations DROP CONSTRAINT IF EXISTS %I', v_constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.consultations
  ADD CONSTRAINT consultations_payment_method_check
  CHECK (
    payment_method IN (
      'mercadopago',
      'yape',
      'plin',
      'bank_transfer',
      'cash_in_office',
      'card',
      'card_visa',
      'card_mastercard',
      'card_american_express',
      'card_diners_club'
    )
  );
