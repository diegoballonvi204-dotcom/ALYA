export type SubscriptionTier = "starter" | "pro" | "elite";

export type BillingPeriod = "free" | "monthly" | "annual";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "paused";

export type InvoiceStatus =
  | "paid"
  | "pending"
  | "review_pending"
  | "failed"
  | "refunded";

export type PaymentMethod = "card" | "yape" | "plin" | "bank_transfer";

export type InvoiceType = "boleta" | "factura";

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string | null;
  price_pen: number;
  billing_period: BillingPeriod;
  match_quota: number;
  storage_limit_mb: number;
  has_ai_assistant: boolean;
  has_whatsapp_alerts: boolean;
  has_radar_priority: boolean;
  boost_multiplier: number;
  max_team_members: number;
  gateway_plan_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LawyerSubscription {
  id: string;
  lawyer_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  external_provider: string;
  external_subscription_id: string | null;
  gateway_customer_id: string | null;
  card_brand: string | null;
  card_last_four: string | null;
  matches_used_this_period: number;
  trial_ended_at: string | null;
  created_at: string;
  updated_at: string;
  plans?: SubscriptionPlan;
}

export interface SubscriptionInvoice {
  id: string;
  subscription_id: string;
  lawyer_id: string;
  amount_pen: number;
  status: InvoiceStatus;
  payment_method: PaymentMethod;
  external_payment_id: string | null;
  voucher_url: string | null;
  invoice_type: InvoiceType;
  tax_id_number: string | null;
  tax_legal_name: string | null;
  invoice_number: string | null;
  invoice_pdf_url: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface MatchQuotaResult {
  allowed: boolean;
  reason?: "QUOTA_EXCEEDED" | "INACTIVE_SUBSCRIPTION";
  current_usage: number;
  max_quota: number;
  plan_tier: SubscriptionTier;
  plan_name: string;
}
