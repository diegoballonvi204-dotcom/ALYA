-- Migración 017: Analizador IA Procesal de Expedientes, Plazos Críticos y Alertas de Flagrancia

-- 1. Extender case_documents con campos para análisis IA y plazos procesales peruanos
ALTER TABLE public.case_documents
  ADD COLUMN IF NOT EXISTS document_category VARCHAR(50) DEFAULT 'otro'
    CHECK (document_category IN ('demanda', 'resolucion_judicial', 'notificacion_notarial', 'contrato', 'acta_policial', 'carta_despido', 'otro')),
  ADD COLUMN IF NOT EXISTS analysis_status VARCHAR(30) DEFAULT 'pending'
    CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed')),
  ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS critical_deadlines JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Índice para consultas rápidas de documentos analizados o con plazos pendientes
CREATE INDEX IF NOT EXISTS idx_case_documents_analysis_status 
  ON public.case_documents(case_id, analysis_status);

-- 3. Extender tabla cases con metadatos para flagrancia penal y asistencia policial inmediata
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS police_station VARCHAR(150) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(30) DEFAULT NULL;
