-- Migración 015: Soporte de Escrow, Pasarela de Pagos y Teleasistencia Cifrada en Consultas Legales
-- ALYA LegalTech Perú

ALTER TABLE public.consultations 
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending_payment' 
    CHECK (payment_status IN ('pending_payment', 'held_escrow', 'released', 'refunded', 'disputed')),
  ADD COLUMN IF NOT EXISTS payment_method text 
    CHECK (payment_method IN ('mercadopago', 'yape', 'plin', 'bank_transfer', 'cash_in_office')),
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS voucher_url text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS released_at timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS room_passcode text,
  ADD COLUMN IF NOT EXISTS meeting_address text;

CREATE INDEX IF NOT EXISTS idx_consultations_payment_status 
  ON public.consultations(payment_status, scheduled_at);
