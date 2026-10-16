-- Migración 018: Tabla de Solicitudes de Desembolso / Retiro de Honorarios (Payouts) y Liquidaciones

CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID NOT NULL REFERENCES public.lawyer_profiles(id) ON DELETE RESTRICT,
  amount_pen NUMERIC(10, 2) NOT NULL CHECK (amount_pen >= 50.00),
  bank_name VARCHAR(100) NOT NULL,
  account_type VARCHAR(50) DEFAULT 'ahorros' CHECK (account_type IN ('ahorros', 'corriente')),
  account_number VARCHAR(50) NOT NULL,
  cci_number VARCHAR(30) NOT NULL,
  beneficiary_name VARCHAR(200) NOT NULL,
  beneficiary_dni VARCHAR(20) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'requested' 
    CHECK (status IN ('requested', 'processing', 'completed', 'rejected')),
  admin_notes TEXT,
  transfer_voucher_url TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad
CREATE POLICY "Abogados pueden ver y crear sus solicitudes de desembolso"
  ON public.payout_requests FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.lawyer_profiles WHERE id = lawyer_id));

CREATE POLICY "Administradores pueden gestionar todos los payouts"
  ON public.payout_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'verifier')));

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_payout_requests_lawyer 
  ON public.payout_requests(lawyer_id, status);

CREATE INDEX IF NOT EXISTS idx_payout_requests_status 
  ON public.payout_requests(status, requested_at);
