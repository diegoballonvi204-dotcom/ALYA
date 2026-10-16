-- Migración 019: Fix para creación de conversaciones, RLS de INSERT y trigger bilateral para INSERT/UPDATE

-- 1. Política de INSERT en public.conversations para miembros autenticados del match
DROP POLICY IF EXISTS "Miembros del match pueden crear conversacion" ON public.conversations;
CREATE POLICY "Miembros del match pueden crear conversacion"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.matches m
    JOIN public.cases c ON c.id = m.case_id
    JOIN public.lawyer_profiles lp ON lp.id = m.lawyer_id
    WHERE m.id = conversations.match_id
      AND (c.user_id = auth.uid() OR lp.user_id = auth.uid())
  )
);

-- 2. Actualizar función del trigger bilateral para contemplar TG_OP = 'INSERT'
CREATE OR REPLACE FUNCTION public.handle_bilateral_match_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Caso 1: Ambas partes mostraron interés (Bilateral Match o Direct Match)
    IF NEW.user_interest = true AND NEW.lawyer_interest = true THEN
        IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM 'matched' OR OLD.user_interest = false OR OLD.lawyer_interest = false)) THEN
            NEW.status := 'matched';
            IF NEW.matched_at IS NULL THEN
                NEW.matched_at := timezone('utc'::text, now());
            END IF;
            
            -- Crear conversación privada de forma atómica
            INSERT INTO public.conversations (match_id, case_id)
            VALUES (NEW.id, NEW.case_id)
            ON CONFLICT (match_id) DO NOTHING;
            
            -- Actualizar estado del caso a 'contacted' si estaba publicado
            UPDATE public.cases 
            SET status = 'contacted', updated_at = timezone('utc'::text, now())
            WHERE id = NEW.case_id AND status = 'published';
        END IF;
    -- Caso 2: Solo el cliente mostró interés
    ELSIF NEW.user_interest = true AND (NEW.lawyer_interest = false OR NEW.lawyer_interest IS NULL) THEN
        IF TG_OP = 'INSERT' OR NEW.status = 'pending' THEN
            NEW.status := 'user_interested';
        END IF;
    -- Caso 3: Solo el abogado mostró interés
    ELSIF NEW.lawyer_interest = true AND (NEW.user_interest = false OR NEW.user_interest IS NULL) THEN
        IF TG_OP = 'INSERT' OR NEW.status = 'pending' THEN
            NEW.status := 'lawyer_interested';
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- 3. Recrear trigger para BEFORE INSERT OR UPDATE
DROP TRIGGER IF EXISTS trg_matches_bilateral ON public.matches;
CREATE TRIGGER trg_matches_bilateral
BEFORE INSERT OR UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION handle_bilateral_match_trigger();
