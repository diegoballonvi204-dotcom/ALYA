-- Migration 020: Fix matches bilateral trigger timing
-- Separates BEFORE trigger (status calculation) and AFTER trigger (conversation creation)
-- to avoid violating foreign key constraint conversations_match_id_fkey on INSERT.

DO $$
BEGIN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_matches_bilateral ON public.matches;';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_matches_bilateral_insert ON public.matches;';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_matches_after ON public.matches;';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_matches_before ON public.matches;';
END $$;

CREATE OR REPLACE FUNCTION public.handle_matches_before_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.user_interest = true AND NEW.lawyer_interest = true THEN
        NEW.status := 'matched';
        IF NEW.matched_at IS NULL THEN
            NEW.matched_at := timezone('utc'::text, now());
        END IF;
    ELSIF NEW.user_interest = true AND (NEW.lawyer_interest = false OR NEW.lawyer_interest IS NULL) THEN
        IF TG_OP = 'INSERT' OR NEW.status = 'pending' THEN
            NEW.status := 'user_interested';
        END IF;
    ELSIF NEW.lawyer_interest = true AND (NEW.user_interest = false OR NEW.user_interest IS NULL) THEN
        IF TG_OP = 'INSERT' OR NEW.status = 'pending' THEN
            NEW.status := 'lawyer_interested';
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_matches_after_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.status = 'matched' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'matched') THEN
        INSERT INTO public.conversations (match_id, case_id)
        VALUES (NEW.id, NEW.case_id)
        ON CONFLICT (match_id) DO NOTHING;
        
        UPDATE public.cases 
        SET status = 'contacted', updated_at = timezone('utc'::text, now())
        WHERE id = NEW.case_id AND status = 'published';
    END IF;

    RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_matches_before
BEFORE INSERT OR UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION handle_matches_before_trigger();

CREATE TRIGGER trg_matches_after
AFTER INSERT OR UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION handle_matches_after_trigger();

-- RLS: Permitir que tanto el cliente como el abogado puedan insertar matches
DO $$
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Propietario del caso inserta matches" ON public.matches;';
    EXECUTE 'DROP POLICY IF EXISTS "Partes insertan matches" ON public.matches;';
END $$;

CREATE POLICY "Partes insertan matches" ON public.matches
FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM cases c WHERE c.id = matches.case_id AND c.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM lawyer_profiles lp WHERE lp.id = matches.lawyer_id AND lp.user_id = auth.uid())
    OR is_admin()
);

