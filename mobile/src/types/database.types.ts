export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface CaseDocumentItem {
  id: string;
  case_id: string;
  uploaded_by: string;
  file_name: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  visibility: "private_client" | "shared_match";
  document_category: "demanda" | "resolucion_judicial" | "notificacion_notarial" | "contrato" | "acta_policial" | "carta_despido" | "otro";
  analysis_status: "pending" | "analyzing" | "completed" | "failed";
  ai_analysis: {
    summary?: string;
    mainClaims?: string;
    legalBasis?: string;
    proceduralRisk?: "bajo" | "medio" | "alto";
    recommendedActions?: string[];
  } | null;
  critical_deadlines: Array<{
    title: string;
    deadlineDate: string;
    daysLeft: number;
    legalArticle: string;
    isPeremptory: boolean;
    urgencyLevel: "critical" | "warning" | "normal";
  }> | null;
  analyzed_at: string | null;
  created_at: string;
}

export interface CaseItem {
  id: string;
  title: string;
  description: string;
  city: string;
  modality: "presential" | "virtual" | "both";
  urgency: "immediate" | "high" | "medium" | "low";
  status: "draft" | "published" | "matching" | "contacted" | "in_consultation" | "in_progress" | "closed" | "cancelled";
  police_station?: string | null;
  emergency_contact_phone?: string | null;
  specialty_id: number;
  created_at: string;
  specialties?: {
    name: string;
  };
}

export interface ConsultationItem {
  id: string;
  case_id: string;
  lawyer_id: string;
  scheduled_at: string;
  duration_minutes: number;
  modality: "virtual" | "presential" | "both";
  agreed_price: number;
  status: "requested" | "confirmed" | "completed" | "cancelled" | "rescheduled";
  payment_status: "pending_payment" | "held_escrow" | "released" | "refunded" | "disputed";
  meeting_link?: string | null;
  room_passcode?: string | null;
}
