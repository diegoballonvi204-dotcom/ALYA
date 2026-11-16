-- Migración 027: Eliminar todos los casos, su trazabilidad completa y abogados sin cuenta real en Auth
-- Conserva catálogos oficiales (specialties, subscription_plans) y cuentas reales creadas en auth.users
-- (incluyendo las cuentas @legalmatch.pe del cliente y abogado de pruebas).

BEGIN;

-- ============================================================================
-- 1. ELIMINAR TODOS LOS CASOS Y TODA SU TRAZABILIDAD
-- ============================================================================
TRUNCATE TABLE
  public.messages,
  public.conversations,
  public.case_documents,
  public.matches,
  public.fee_agreements,
  public.consultations,
  public.payout_requests,
  public.reviews,
  public.favorites,
  public.notifications,
  public.audit_logs,
  public.reports,
  public.arco_requests,
  public.cases
CASCADE;

-- Nota: Supabase bloquea borrados SQL directos sobre storage.objects (storage.protect_delete).
-- Si deseas vaciar archivos del bucket "case-documents", hazlo desde Storage > case-documents > Empty bucket.

-- ============================================================================
-- 2. ELIMINAR ABOGADOS SIN CUENTA REAL EN auth.users Y PERFILES SEMILLA/HUÉRFANOS
--    (No toca cuentas @legalmatch.pe)
-- ============================================================================
DO $$
DECLARE
  v_fake_lawyer_ids UUID[];
  v_fake_user_ids UUID[];
BEGIN
  -- A. Identificar lawyer_profiles sin usuario válido en auth.users, con Auth ficticio,
  --    con UUID semilla o con matrículas de ejemplo conocidas
  SELECT COALESCE(array_agg(DISTINCT lp.id), ARRAY[]::UUID[]),
         COALESCE(array_agg(DISTINCT lp.user_id) FILTER (WHERE lp.user_id IS NOT NULL), ARRAY[]::UUID[])
  INTO v_fake_lawyer_ids, v_fake_user_ids
  FROM public.lawyer_profiles lp
  LEFT JOIN public.profiles p ON p.id = lp.user_id
  LEFT JOIN auth.users u ON u.id = lp.user_id
  WHERE u.id IS NULL
     OR p.id IS NULL
     OR (
       (u.encrypted_password IS NULL OR u.encrypted_password = '')
       AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id)
     )
     OR u.email ~* '@(example|test)\.'
     OR lp.bar_number IN ('29140', '35210', '41280', '12450')
     OR lp.id::text ~* '^(00000000|11111111|22222222|33333333|44444444|55555555|66666666|77777777|88888888|99999999|aaaaaaaa|bbbbbbbb|cccccccc|dddddddd|eeeeeeee|ffffffff|a1111111|b2222222|c3333333|d4444444|e5555555|f6666666)-'
     OR lp.user_id::text ~* '^(00000000|11111111|22222222|33333333|44444444|55555555|66666666|77777777|88888888|99999999|aaaaaaaa|bbbbbbbb|cccccccc|dddddddd|eeeeeeee|ffffffff|a1111111|b2222222|c3333333|d4444444|e5555555|f6666666)-';

  -- B. Incluir también perfiles huérfanos o semilla sin cuenta real en auth.users
  SELECT COALESCE(array_agg(DISTINCT id), ARRAY[]::UUID[])
  INTO v_fake_user_ids
  FROM (
    SELECT unnest(v_fake_user_ids) AS id
    UNION
    SELECT p.id
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE u.id IS NULL
       OR (
         (u.encrypted_password IS NULL OR u.encrypted_password = '')
         AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id)
       )
       OR u.email ~* '@(example|test)\.'
       OR p.id::text ~* '^(00000000|11111111|22222222|33333333|44444444|55555555|66666666|77777777|88888888|99999999|aaaaaaaa|bbbbbbbb|cccccccc|dddddddd|eeeeeeee|ffffffff|a1111111|b2222222|c3333333|d4444444|e5555555|f6666666)-'
  ) t;

  -- C. Eliminar dependencias de esos abogados antes de borrar lawyer_profiles / profiles / auth.users
  DELETE FROM public.lawyer_schedules
  WHERE lawyer_id = ANY(v_fake_lawyer_ids)
     OR lawyer_id NOT IN (SELECT id FROM public.lawyer_profiles);

  DELETE FROM public.lawyer_specialties
  WHERE lawyer_id = ANY(v_fake_lawyer_ids)
     OR lawyer_id NOT IN (SELECT id FROM public.lawyer_profiles);

  DELETE FROM public.subscription_invoices
  WHERE lawyer_id = ANY(v_fake_lawyer_ids)
     OR lawyer_id NOT IN (SELECT id FROM public.lawyer_profiles);

  DELETE FROM public.lawyer_subscriptions
  WHERE lawyer_id = ANY(v_fake_lawyer_ids)
     OR lawyer_id NOT IN (SELECT id FROM public.lawyer_profiles);

  DELETE FROM public.verifications
  WHERE lawyer_id = ANY(v_fake_lawyer_ids)
     OR verified_by = ANY(v_fake_user_ids)
     OR lawyer_id NOT IN (SELECT id FROM public.lawyer_profiles);

  DELETE FROM public.lawyer_profiles
  WHERE id = ANY(v_fake_lawyer_ids)
     OR user_id = ANY(v_fake_user_ids);

  DELETE FROM public.profiles
  WHERE id = ANY(v_fake_user_ids);

  DELETE FROM auth.users
  WHERE id = ANY(v_fake_user_ids);
END $$;

-- ============================================================================
-- 3. REINICIAR CONTADORES DE TRAZABILIDAD EN CUENTAS REALES QUE PERMANEZCAN
-- ============================================================================
UPDATE public.lawyer_profiles
SET total_reviews = 0,
    rating_average = 5.0;

UPDATE public.lawyer_subscriptions
SET matches_used_this_period = 0;

-- ============================================================================
-- 4. RESTAURAR CUENTAS DE PRUEBA (@legalmatch.pe) SI FUERON ELIMINADAS O DESINCRONIZADAS
--    Contraseña asignada por defecto: AlyaTemp2026!
--    (Puedes cambiar v_client_password / v_lawyer_password antes de ejecutar el SQL)
-- ============================================================================
DO $$
DECLARE
  v_client_password TEXT := 'AlyaTemp2026!';
  v_lawyer_password TEXT := 'AlyaTemp2026!';
  v_instance_id UUID;
  v_client_user_id UUID;
  v_lawyer_user_id UUID;
  v_lawyer_profile_id UUID;
  v_specialty_id INT;
  v_plan_id TEXT;
BEGIN
  SET LOCAL search_path = public, auth, extensions;

  SELECT COALESCE(
    (SELECT instance_id FROM auth.users WHERE instance_id IS NOT NULL LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  ) INTO v_instance_id;

  -- 4A. Cuenta Cliente: cliente@legalmatch.pe (Juan Pérez)
  SELECT id INTO v_client_user_id
  FROM auth.users
  WHERE lower(email) = 'cliente@legalmatch.pe'
  LIMIT 1;

  IF v_client_user_id IS NULL THEN
    v_client_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      email_change_token_current,
      phone_change,
      phone_change_token,
      reauthentication_token,
      recovery_token,
      email_change_confirm_status,
      is_sso_user,
      is_anonymous,
      deleted_at,
      banned_until
    )
    VALUES (
      v_instance_id,
      v_client_user_id,
      'authenticated',
      'authenticated',
      'cliente@legalmatch.pe',
      crypt(v_client_password, gen_salt('bf', 10)),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"first_name":"Juan","last_name":"Pérez","city":"Lima","role":"client"}'::jsonb,
      NOW(),
      NOW(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      0,
      false,
      false,
      NULL,
      NULL
    );
  ELSE
    UPDATE auth.users
    SET instance_id = v_instance_id,
        aud = 'authenticated',
        role = 'authenticated',
        encrypted_password = crypt(v_client_password, gen_salt('bf', 10)),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = '{"first_name":"Juan","last_name":"Pérez","city":"Lima","role":"client"}'::jsonb,
        confirmation_token = '',
        email_change = '',
        email_change_token_new = '',
        email_change_token_current = '',
        phone_change = '',
        phone_change_token = '',
        reauthentication_token = '',
        recovery_token = '',
        email_change_confirm_status = 0,
        is_sso_user = false,
        is_anonymous = false,
        deleted_at = NULL,
        banned_until = NULL,
        updated_at = NOW()
    WHERE id = v_client_user_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities
    WHERE user_id = v_client_user_id AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      v_client_user_id,
      jsonb_build_object(
        'sub', v_client_user_id::text,
        'email', 'cliente@legalmatch.pe',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      v_client_user_id::text,
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    city,
    country,
    role,
    is_active,
    consent_accepted_at
  )
  VALUES (
    v_client_user_id,
    'Juan',
    'Pérez',
    'Lima',
    'PE',
    'client',
    true,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = 'client',
    is_active = true;

  -- 4B. Cuenta Abogado: carlos.ramos@legalmatch.pe (Carlos Ramos)
  SELECT id INTO v_lawyer_user_id
  FROM auth.users
  WHERE lower(email) = 'carlos.ramos@legalmatch.pe'
  LIMIT 1;

  IF v_lawyer_user_id IS NULL THEN
    v_lawyer_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      email_change_token_current,
      phone_change,
      phone_change_token,
      reauthentication_token,
      recovery_token,
      email_change_confirm_status,
      is_sso_user,
      is_anonymous,
      deleted_at,
      banned_until
    )
    VALUES (
      v_instance_id,
      v_lawyer_user_id,
      'authenticated',
      'authenticated',
      'carlos.ramos@legalmatch.pe',
      crypt(v_lawyer_password, gen_salt('bf', 10)),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"first_name":"Carlos","last_name":"Ramos","city":"Lima","role":"lawyer"}'::jsonb,
      NOW(),
      NOW(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      0,
      false,
      false,
      NULL,
      NULL
    );
  ELSE
    UPDATE auth.users
    SET instance_id = v_instance_id,
        aud = 'authenticated',
        role = 'authenticated',
        encrypted_password = crypt(v_lawyer_password, gen_salt('bf', 10)),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = '{"first_name":"Carlos","last_name":"Ramos","city":"Lima","role":"lawyer"}'::jsonb,
        confirmation_token = '',
        email_change = '',
        email_change_token_new = '',
        email_change_token_current = '',
        phone_change = '',
        phone_change_token = '',
        reauthentication_token = '',
        recovery_token = '',
        email_change_confirm_status = 0,
        is_sso_user = false,
        is_anonymous = false,
        deleted_at = NULL,
        banned_until = NULL,
        updated_at = NOW()
    WHERE id = v_lawyer_user_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities
    WHERE user_id = v_lawyer_user_id AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      v_lawyer_user_id,
      jsonb_build_object(
        'sub', v_lawyer_user_id::text,
        'email', 'carlos.ramos@legalmatch.pe',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      v_lawyer_user_id::text,
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    city,
    country,
    role,
    is_active,
    consent_accepted_at
  )
  VALUES (
    v_lawyer_user_id,
    'Carlos',
    'Ramos',
    'Lima',
    'PE',
    'lawyer',
    true,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = 'lawyer',
    is_active = true;

  INSERT INTO public.lawyer_profiles (
    user_id,
    bar_association,
    bar_number,
    professional_title,
    years_experience,
    bio,
    consultation_price,
    currency,
    virtual_attention,
    physical_attention,
    is_available,
    verification_status,
    verified_at,
    is_activated,
    rating_average,
    total_reviews
  )
  VALUES (
    v_lawyer_user_id,
    'Colegio de Abogados de Lima (CAL)',
    '54892',
    'Abogado Litigante Especialista',
    8,
    'Abogado colegiado y habilitado en el CAL. Asesoría legal en materia laboral, civil y corporativa en Lima.',
    150,
    'PEN',
    true,
    true,
    true,
    'verified',
    NOW(),
    true,
    5.0,
    0
  )
  ON CONFLICT (user_id) DO UPDATE SET
    is_available = true,
    verification_status = 'verified',
    is_activated = true
  RETURNING id INTO v_lawyer_profile_id;

  INSERT INTO public.verifications (
    lawyer_id,
    bar_status,
    identity_status,
    bar_verified_at,
    identity_verified_at,
    is_code_verified
  )
  VALUES (
    v_lawyer_profile_id,
    'verified',
    'verified',
    NOW(),
    NOW(),
    true
  )
  ON CONFLICT (lawyer_id) DO UPDATE SET
    bar_status = 'verified',
    identity_status = 'verified',
    is_code_verified = true;

  SELECT id INTO v_specialty_id
  FROM public.specialties
  WHERE is_active = true
  ORDER BY display_order ASC, id ASC
  LIMIT 1;

  IF v_specialty_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.lawyer_specialties
    WHERE lawyer_id = v_lawyer_profile_id AND specialty_id = v_specialty_id
  ) THEN
    INSERT INTO public.lawyer_specialties (
      lawyer_id,
      specialty_id,
      is_primary,
      experience_years
    )
    VALUES (
      v_lawyer_profile_id,
      v_specialty_id,
      true,
      8
    );
  END IF;

  SELECT COALESCE(
    (SELECT id FROM public.subscription_plans WHERE id = 'starter' LIMIT 1),
    (SELECT id FROM public.subscription_plans LIMIT 1)
  ) INTO v_plan_id;

  IF v_plan_id IS NOT NULL THEN
    INSERT INTO public.lawyer_subscriptions (
      lawyer_id,
      plan_id,
      status,
      matches_used_this_period,
      current_period_start,
      current_period_end
    )
    VALUES (
      v_lawyer_profile_id,
      v_plan_id,
      'active',
      0,
      NOW(),
      NOW() + INTERVAL '1 month'
    )
    ON CONFLICT (lawyer_id) DO NOTHING;
  END IF;
END $$;

COMMIT;
