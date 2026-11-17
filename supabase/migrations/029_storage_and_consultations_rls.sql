-- Migración 029: Corrección integral de almacenamiento (Storage RLS), consultas y pagos en custodia (Escrow)
-- ALYA LegalTech Perú

-- ============================================================================
-- 1. Asegurar la existencia y configuración de los buckets de Storage
-- ============================================================================

-- Bucket: case-documents (Expedientes, adjuntos de chat, comprobantes de consulta en custodia)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'case-documents',
    'case-documents',
    false,
    26214400, -- 25MB
    ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 26214400,
    allowed_mime_types = ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

-- Bucket: payment-vouchers (Comprobantes de pago de suscripciones de abogados)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payment-vouchers',
    'payment-vouchers',
    false,
    10485760, -- 10MB
    ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ];

-- ============================================================================
-- 2. Políticas RLS en storage.objects para case-documents
-- ============================================================================

-- Permitir a usuarios autenticados subir adjuntos y comprobantes
DROP POLICY IF EXISTS "Authenticated users can upload case documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload case documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'case-documents'
);

-- Permitir a usuarios autenticados actualizar/sobrescribir sus adjuntos
DROP POLICY IF EXISTS "Authenticated users can update case documents" ON storage.objects;
CREATE POLICY "Authenticated users can update case documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'case-documents'
)
WITH CHECK (
  bucket_id = 'case-documents'
);

-- Permitir a usuarios autenticados consultar/descargar adjuntos
DROP POLICY IF EXISTS "Authenticated users can read case documents" ON storage.objects;
CREATE POLICY "Authenticated users can read case documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'case-documents'
);

-- ============================================================================
-- 3. Políticas RLS en storage.objects para payment-vouchers
-- ============================================================================

DROP POLICY IF EXISTS "Lawyers can upload their payment vouchers" ON storage.objects;
CREATE POLICY "Lawyers can upload their payment vouchers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-vouchers'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin()
  )
);

DROP POLICY IF EXISTS "Lawyers can read their payment vouchers" ON storage.objects;
CREATE POLICY "Lawyers can read their payment vouchers"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-vouchers'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin()
  )
);

-- ============================================================================
-- 4. Políticas RLS para la tabla public.consultations
-- ============================================================================
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partes y admin ven consultas" ON public.consultations;
CREATE POLICY "Partes y admin ven consultas"
ON public.consultations
FOR SELECT
TO authenticated
USING (
  client_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.lawyer_profiles lp
    WHERE lp.id = consultations.lawyer_id AND lp.user_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Clientes y admin crean consultas" ON public.consultations;
CREATE POLICY "Clientes y admin crean consultas"
ON public.consultations
FOR INSERT
TO authenticated
WITH CHECK (
  client_id = auth.uid()
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Partes y admin actualizan consultas" ON public.consultations;
CREATE POLICY "Partes y admin actualizan consultas"
ON public.consultations
FOR UPDATE
TO authenticated
USING (
  client_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.lawyer_profiles lp
    WHERE lp.id = consultations.lawyer_id AND lp.user_id = auth.uid()
  )
  OR public.is_admin()
)
WITH CHECK (
  client_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.lawyer_profiles lp
    WHERE lp.id = consultations.lawyer_id AND lp.user_id = auth.uid()
  )
  OR public.is_admin()
);

-- ============================================================================
-- 5. Políticas RLS para la tabla public.case_documents
-- ============================================================================
ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partes del caso ven documentos" ON public.case_documents;
CREATE POLICY "Partes del caso ven documentos"
ON public.case_documents
FOR SELECT
TO authenticated
USING (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = case_documents.case_id AND c.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.matches m
    JOIN public.lawyer_profiles lp ON lp.id = m.lawyer_id
    WHERE m.case_id = case_documents.case_id AND lp.user_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Partes del caso suben documentos" ON public.case_documents;
CREATE POLICY "Partes del caso suben documentos"
ON public.case_documents
FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = case_documents.case_id AND c.user_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Propietarios actualizan documentos" ON public.case_documents;
CREATE POLICY "Propietarios actualizan documentos"
ON public.case_documents
FOR UPDATE
TO authenticated
USING (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = case_documents.case_id AND c.user_id = auth.uid()
  )
  OR public.is_admin()
)
WITH CHECK (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = case_documents.case_id AND c.user_id = auth.uid()
  )
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Propietarios eliminan documentos" ON public.case_documents;
CREATE POLICY "Propietarios eliminan documentos"
ON public.case_documents
FOR DELETE
TO authenticated
USING (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = case_documents.case_id AND c.user_id = auth.uid()
  )
  OR public.is_admin()
);

-- ============================================================================
-- 6. RPC Atómica SECURITY DEFINER para procesar abono en custodia (Escrow)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.submit_consultation_escrow_payment(
  p_consultation_id UUID,
  p_payment_method TEXT,
  p_operation_number TEXT,
  p_voucher_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_consultation RECORD;
  v_conv_id UUID;
  v_method_label TEXT;
  v_chat_msg TEXT;
  v_lawyer_user_id UUID;
BEGIN
  IF v_uid IS NULL AND current_user NOT IN ('postgres', 'service_role') THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  -- 1. Obtener la consulta y validar que pertenezca al usuario cliente (o admin)
  SELECT c.*, lp.user_id AS lawyer_user_id
  INTO v_consultation
  FROM public.consultations c
  JOIN public.lawyer_profiles lp ON lp.id = c.lawyer_id
  WHERE c.id = p_consultation_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Consulta legal no encontrada');
  END IF;

  IF v_consultation.client_id <> v_uid AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'No tienes autorización para abonar esta consulta');
  END IF;

  -- 2. Actualizar estado de custodia en la consulta
  UPDATE public.consultations
  SET
    payment_status = 'held_escrow',
    payment_method = p_payment_method,
    payment_reference = p_operation_number,
    voucher_url = p_voucher_url,
    paid_at = timezone('utc'::text, now())
  WHERE id = p_consultation_id;

  -- 3. Localizar conversación del caso
  SELECT id INTO v_conv_id
  FROM public.conversations
  WHERE case_id = v_consultation.case_id
  LIMIT 1;

  -- 4. Determinar etiqueta del método de pago
  CASE p_payment_method
    WHEN 'yape' THEN v_method_label := 'Yape';
    WHEN 'plin' THEN v_method_label := 'Plin';
    WHEN 'bank_transfer' THEN v_method_label := 'Transferencia BCP';
    ELSE v_method_label := COALESCE(p_payment_method, 'Transferencia Directa');
  END CASE;

  v_chat_msg := '💳 **Pago de Honorarios en Custodia (Escrow)**:' || E'\n' ||
                'Medio: ' || v_method_label || E'\n' ||
                'Operación: OP-' || p_operation_number || E'\n' ||
                'Monto: S/ ' || TO_CHAR(v_consultation.agreed_price, 'FM999,990.00') || E'\n' ||
                'Estado: **Fondos protegidos en custodia ALYA**' || E'\n' ||
                'El dinero se encuentra retenido y solo será transferido al abogado al finalizar la sesión.';

  -- 5. Insertar mensaje en el chat
  IF v_conv_id IS NOT NULL THEN
    INSERT INTO public.messages (
      conversation_id,
      sender_id,
      message,
      attachment_url,
      attachment_type
    )
    VALUES (
      v_conv_id,
      v_uid,
      v_chat_msg,
      p_voucher_url,
      'document'
    );

    UPDATE public.conversations
    SET last_message_at = timezone('utc'::text, now())
    WHERE id = v_conv_id;
  END IF;

  -- 6. Notificar al abogado de los fondos en custodia
  IF v_consultation.lawyer_user_id IS NOT NULL THEN
    PERFORM public.create_notification(
      v_consultation.lawyer_user_id,
      'payment_escrow_received',
      'Honorarios en Custodia ALYA',
      'El cliente ha realizado el abono en custodia segura de S/ ' || TO_CHAR(v_consultation.agreed_price, 'FM999,990.00') || '. Ya puedes coordinar la atención.',
      jsonb_build_object(
        'consultation_id', p_consultation_id,
        'case_id', v_consultation.case_id,
        'conversation_id', v_conv_id
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'consultation_id', p_consultation_id,
    'conversation_id', v_conv_id,
    'message', 'Abono en custodia verificado exitosamente'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_consultation_escrow_payment(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_consultation_escrow_payment(UUID, TEXT, TEXT, TEXT) TO authenticated, service_role;
