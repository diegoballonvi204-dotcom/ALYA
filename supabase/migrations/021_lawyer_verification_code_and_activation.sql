-- 021_lawyer_verification_code_and_activation.sql
-- Añadir campos para código de verificación por correo y estado de activación

ALTER TABLE public.lawyer_profiles 
ADD COLUMN IF NOT EXISTS is_activated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS activation_code VARCHAR(12);

ALTER TABLE public.verifications 
ADD COLUMN IF NOT EXISTS activation_code VARCHAR(12),
ADD COLUMN IF NOT EXISTS is_code_verified BOOLEAN DEFAULT false;

-- Mantener activados los perfiles que ya estaban verificados
UPDATE public.lawyer_profiles SET is_activated = true WHERE verification_status = 'verified';
UPDATE public.verifications SET is_code_verified = true WHERE identity_status = 'verified' AND bar_status = 'verified';

-- Función para obtener de forma segura el correo y datos del abogado al aprobar
CREATE OR REPLACE FUNCTION public.get_lawyer_user_email(p_lawyer_id UUID)
RETURNS TABLE (email TEXT, first_name TEXT, last_name TEXT) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
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

