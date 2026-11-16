-- Migración 025: Correcciones integrales de auditoría (RLS, custodia, unicidad de citas y lectura pública)

-- ============================================================================
-- H1: Políticas RLS de lawyer_schedules y RPC atómica
-- ============================================================================
ALTER TABLE public.lawyer_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Abogados gestionan sus horarios" ON public.lawyer_schedules;
DROP POLICY IF EXISTS "Lectura publica de horarios de abogados" ON public.lawyer_schedules;
DROP POLICY IF EXISTS "lawyer_schedules_select_policy" ON public.lawyer_schedules;
DROP POLICY IF EXISTS "lawyer_schedules_manage_policy" ON public.lawyer_schedules;

CREATE POLICY "lawyer_schedules_select_policy"
ON public.lawyer_schedules
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "lawyer_schedules_manage_policy"
ON public.lawyer_schedules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lawyer_profiles lp
    WHERE lp.id = lawyer_schedules.lawyer_id
      AND lp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lawyer_profiles lp
    WHERE lp.id = lawyer_schedules.lawyer_id
      AND lp.user_id = auth.uid()
  )
);

-- Asegurar restricción única (lawyer_id, day_of_week) para upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.lawyer_schedules'::regclass
      AND contype = 'u'
  ) THEN
    ALTER TABLE public.lawyer_schedules
      ADD CONSTRAINT lawyer_schedules_lawyer_day_unique UNIQUE (lawyer_id, day_of_week);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.save_lawyer_schedules_rpc(p_schedules JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lawyer_id UUID;
  v_item JSONB;
BEGIN
  SELECT id INTO v_lawyer_id
  FROM public.lawyer_profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_lawyer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Perfil de abogado no encontrado');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_schedules)
  LOOP
    INSERT INTO public.lawyer_schedules (
      lawyer_id,
      day_of_week,
      start_time,
      end_time,
      slot_duration_minutes,
      is_active
    )
    VALUES (
      v_lawyer_id,
      (v_item->>'dayOfWeek')::INT,
      (v_item->>'startTime')::TIME,
      (v_item->>'endTime')::TIME,
      COALESCE((v_item->>'slotDurationMinutes')::INT, 45),
      COALESCE((v_item->>'isActive')::BOOLEAN, true)
    )
    ON CONFLICT (lawyer_id, day_of_week)
    DO UPDATE SET
      start_time = EXCLUDED.start_time,
      end_time = EXCLUDED.end_time,
      slot_duration_minutes = EXCLUDED.slot_duration_minutes,
      is_active = EXCLUDED.is_active;
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================================
-- H3: Lectura pública de perfiles de abogados en el directorio (anon + auth)
-- ============================================================================
DROP POLICY IF EXISTS "public_read_lawyer_profiles" ON public.lawyer_profiles;
CREATE POLICY "public_read_lawyer_profiles"
ON public.lawyer_profiles
FOR SELECT
TO anon, authenticated
USING (is_available = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "public_read_lawyer_specialties" ON public.lawyer_specialties;
CREATE POLICY "public_read_lawyer_specialties"
ON public.lawyer_specialties
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "public_read_specialties" ON public.specialties;
CREATE POLICY "public_read_specialties"
ON public.specialties
FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "public_read_reviews" ON public.reviews;
CREATE POLICY "public_read_reviews"
ON public.reviews
FOR SELECT
TO anon, authenticated
USING (is_published = true);

DROP POLICY IF EXISTS "public_read_lawyer_base_profiles" ON public.profiles;
CREATE POLICY "public_read_lawyer_base_profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (
  role = 'lawyer'
  OR id = auth.uid()
  OR is_admin_or_verifier()
);

-- ============================================================================
-- H10: Limpiar citas duplicadas pendientes y prevenir duplicados futuros
-- ============================================================================
WITH ranked_pending AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY case_id, client_id, lawyer_id
      ORDER BY created_at DESC
    ) AS rn
  FROM public.consultations
  WHERE status = 'requested'
    AND (payment_status IS NULL OR payment_status = 'pending_payment')
)
UPDATE public.consultations
SET status = 'cancelled',
    notes = COALESCE(notes, '') || ' [Cancelada automáticamente por duplicidad]'
WHERE id IN (SELECT id FROM ranked_pending WHERE rn > 1);

-- Caducar solicitudes pendientes vencidas (más de 48h desde creación/fecha programada)
UPDATE public.consultations
SET status = 'cancelled',
    notes = COALESCE(notes, '') || ' [Solicitud caducada tras 48h sin abono]'
WHERE status = 'requested'
  AND (payment_status IS NULL OR payment_status = 'pending_payment')
  AND created_at < NOW() - INTERVAL '48 hours';

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_consultation_request
ON public.consultations (case_id, client_id, lawyer_id)
WHERE status = 'requested';

-- Limpiar mensaje de prueba dejado durante la auditoría
DELETE FROM public.messages
WHERE message = 'Mensaje de prueba: ignorar.';

