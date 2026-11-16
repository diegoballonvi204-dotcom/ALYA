-- Migración 028: Corrección integral de notificaciones, RLS de contraparte, matches y conversaciones
-- ALYA LegalTech Perú

-- ============================================================================
-- 1. RPC SECURITY DEFINER para emitir notificaciones a cualquier usuario
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  IF auth.uid() IS NULL AND current_user NOT IN ('postgres', 'service_role', 'supabase_admin') THEN
    RAISE EXCEPTION 'No autenticado para emitir notificaciones';
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data
  )
  VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    COALESCE(p_data, '{}'::jsonb)
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role;

-- ============================================================================
-- 2. Políticas RLS de public.notifications
-- ============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "notifications_select_own"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin()
);

CREATE POLICY "notifications_update_own"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin()
)
WITH CHECK (
  user_id = auth.uid()
  OR public.is_admin()
);

CREATE POLICY "notifications_insert_authenticated"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================================
-- 3. Funciones helper SECURITY DEFINER sin recursión RLS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.can_lawyer_view_case(p_case_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_lawyer_id UUID;
  v_case_status TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT lp.id INTO v_lawyer_id
  FROM public.lawyer_profiles lp
  WHERE lp.user_id = v_uid
  LIMIT 1;

  IF v_lawyer_id IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.matches m
    WHERE m.case_id = p_case_id
      AND m.lawyer_id = v_lawyer_id
      AND m.status IS DISTINCT FROM 'discarded'
  ) THEN
    RETURN true;
  END IF;

  SELECT c.status::TEXT INTO v_case_status
  FROM public.cases c
  WHERE c.id = p_case_id
  LIMIT 1;

  IF v_case_status IN ('published', 'matching') THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.can_lawyer_view_case(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_lawyer_view_case(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_view_counterpart_profile(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL OR p_profile_id IS NULL THEN
    RETURN false;
  END IF;

  IF v_uid = p_profile_id THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.matches m
    JOIN public.cases c ON c.id = m.case_id
    JOIN public.lawyer_profiles lp ON lp.id = m.lawyer_id
    WHERE m.status IS DISTINCT FROM 'discarded'
      AND (
        (c.user_id = v_uid AND lp.user_id = p_profile_id)
        OR (lp.user_id = v_uid AND c.user_id = p_profile_id)
      )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.can_view_counterpart_profile(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_counterpart_profile(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_match_participant(p_match_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL OR p_match_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.matches m
    JOIN public.cases c ON c.id = m.case_id
    JOIN public.lawyer_profiles lp ON lp.id = m.lawyer_id
    WHERE m.id = p_match_id
      AND (c.user_id = v_uid OR lp.user_id = v_uid)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_match_participant(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_match_participant(UUID) TO authenticated, service_role;

-- ============================================================================
-- 4. Actualizar política SELECT de public.profiles para leer contrapartes
-- ============================================================================
DROP POLICY IF EXISTS "public_read_lawyer_base_profiles" ON public.profiles;
CREATE POLICY "public_read_lawyer_base_profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (
  role = 'lawyer'
  OR id = auth.uid()
  OR public.is_admin_or_verifier()
  OR public.can_view_counterpart_profile(id)
);

-- ============================================================================
-- 5. Políticas RLS para public.matches, public.conversations y public.messages
-- ============================================================================
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partes ven sus matches" ON public.matches;
CREATE POLICY "Partes ven sus matches"
ON public.matches
FOR SELECT
TO authenticated
USING (
  public.is_match_participant(id)
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Partes insertan matches" ON public.matches;
CREATE POLICY "Partes insertan matches"
ON public.matches
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.cases c WHERE c.id = matches.case_id AND c.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.lawyer_profiles lp WHERE lp.id = matches.lawyer_id AND lp.user_id = auth.uid())
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Partes actualizan sus matches" ON public.matches;
CREATE POLICY "Partes actualizan sus matches"
ON public.matches
FOR UPDATE
TO authenticated
USING (
  public.is_match_participant(id)
  OR public.is_admin()
)
WITH CHECK (
  public.is_match_participant(id)
  OR public.is_admin()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participantes ven sus conversaciones" ON public.conversations;
CREATE POLICY "Participantes ven sus conversaciones"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  public.is_match_participant(match_id)
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Miembros del match pueden crear conversacion" ON public.conversations;
CREATE POLICY "Miembros del match pueden crear conversacion"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_match_participant(match_id)
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Participantes actualizan sus conversaciones" ON public.conversations;
CREATE POLICY "Participantes actualizan sus conversaciones"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  public.is_match_participant(match_id)
  OR public.is_admin()
)
WITH CHECK (
  public.is_match_participant(match_id)
  OR public.is_admin()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participantes ven mensajes de sus conversaciones" ON public.messages;
CREATE POLICY "Participantes ven mensajes de sus conversaciones"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations conv
    WHERE conv.id = messages.conversation_id
      AND public.is_match_participant(conv.match_id)
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Participantes envian mensajes en sus conversaciones" ON public.messages;
CREATE POLICY "Participantes envian mensajes en sus conversaciones"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.conversations conv
    WHERE conv.id = messages.conversation_id
      AND public.is_match_participant(conv.match_id)
  )
);

DROP POLICY IF EXISTS "Participantes actualizan lectura de mensajes" ON public.messages;
CREATE POLICY "Participantes actualizan lectura de mensajes"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations conv
    WHERE conv.id = messages.conversation_id
      AND public.is_match_participant(conv.match_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.conversations conv
    WHERE conv.id = messages.conversation_id
      AND public.is_match_participant(conv.match_id)
  )
);

-- ============================================================================
-- 6. Trigger AFTER INSERT OR UPDATE en public.matches para crear conversaciones
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_matches_after_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.status IN ('matched', 'user_interested', 'lawyer_interested') THEN
        INSERT INTO public.conversations (match_id, case_id, is_active, last_message_at)
        VALUES (NEW.id, NEW.case_id, true, timezone('utc'::text, now()))
        ON CONFLICT (match_id) DO NOTHING;

        IF NEW.status = 'matched' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'matched') THEN
            UPDATE public.cases
            SET status = 'contacted', updated_at = timezone('utc'::text, now())
            WHERE id = NEW.case_id AND status = 'published';
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_matches_after ON public.matches;
CREATE TRIGGER trg_matches_after
AFTER INSERT OR UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.handle_matches_after_trigger();

-- ============================================================================
-- 7. Habilitar Realtime en notifications y messages si la publicación existe
-- ============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object OR undefined_object THEN
    NULL;
  END;
END $$;
