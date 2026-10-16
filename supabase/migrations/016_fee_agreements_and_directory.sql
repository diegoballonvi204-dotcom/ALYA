-- Migración 016: Convenios de Honorarios Profesionales / Hoja de Encargo (Art. 1764 Código Civil Peruano & Ley N.° 27269)

CREATE TABLE IF NOT EXISTS public.fee_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  lawyer_id UUID NOT NULL REFERENCES public.lawyer_profiles(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  
  -- Términos Contractuales
  title VARCHAR(255) NOT NULL,
  scope_description TEXT NOT NULL,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{"title": "Etapa Prejudicial", "price": 500}, ...]
  fixed_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  success_fee_percentage NUMERIC(5, 2) DEFAULT NULL, -- ej. 15.00%
  expenses_terms TEXT NOT NULL DEFAULT 'Los aranceles judiciales, tasas del Poder Judicial y cédulas de notificación serán asumidos íntegramente por el cliente.',
  
  -- Ciclo de Firma Electrónica (Ley N.° 27269)
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_client_signature', 'signed', 'rejected', 'cancelled')),
  lawyer_signed_at TIMESTAMPTZ,
  client_signed_at TIMESTAMPTZ,
  client_full_name VARCHAR(255),
  client_dni VARCHAR(20),
  client_ip VARCHAR(100),
  client_user_agent TEXT,
  agreement_hash VARCHAR(64), -- Hash SHA-256 inmutable de los términos pactados
  document_url TEXT, -- Documento archivado en Supabase Storage
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de búsqueda y rendimiento
CREATE INDEX IF NOT EXISTS idx_fee_agreements_case_id ON public.fee_agreements(case_id);
CREATE INDEX IF NOT EXISTS idx_fee_agreements_lawyer_id ON public.fee_agreements(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_fee_agreements_client_id ON public.fee_agreements(client_id);
CREATE INDEX IF NOT EXISTS idx_fee_agreements_status ON public.fee_agreements(status);

-- RLS
ALTER TABLE public.fee_agreements ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fee_agreements' AND policyname = 'fee_agreements_select_policy'
  ) THEN
    CREATE POLICY fee_agreements_select_policy ON public.fee_agreements
      FOR SELECT
      USING (
        auth.uid() = client_id OR 
        auth.uid() IN (SELECT user_id FROM public.lawyer_profiles WHERE id = lawyer_id)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fee_agreements' AND policyname = 'fee_agreements_insert_policy'
  ) THEN
    CREATE POLICY fee_agreements_insert_policy ON public.fee_agreements
      FOR INSERT
      WITH CHECK (
        auth.uid() IN (SELECT user_id FROM public.lawyer_profiles WHERE id = lawyer_id)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fee_agreements' AND policyname = 'fee_agreements_update_policy'
  ) THEN
    CREATE POLICY fee_agreements_update_policy ON public.fee_agreements
      FOR UPDATE
      USING (
        auth.uid() = client_id OR 
        auth.uid() IN (SELECT user_id FROM public.lawyer_profiles WHERE id = lawyer_id)
      );
  END IF;
END $$;
