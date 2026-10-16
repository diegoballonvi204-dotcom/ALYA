"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface PayoutRequestItem {
  id: string;
  amountPen: number;
  bankName: string;
  accountType: string;
  accountNumber: string;
  cciNumber: string;
  beneficiaryName: string;
  beneficiaryDni: string;
  status: "requested" | "processing" | "completed" | "rejected";
  adminNotes: string | null;
  transferVoucherUrl: string | null;
  requestedAt: string;
  processedAt: string | null;
}

export interface FinancialMovementItem {
  id: string;
  concept: string;
  type: "consultation" | "fee_agreement";
  amountPen: number;
  status: "held_escrow" | "released" | "refunded";
  clientName: string;
  date: string;
}

export interface LawyerFinancesSummary {
  availableBalance: number;
  escrowBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  movements: FinancialMovementItem[];
  payouts: PayoutRequestItem[];
}

export async function getLawyerFinancesAction(): Promise<{
  success: boolean;
  error?: string;
  finances?: LawyerFinancesSummary;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  // 1. Obtener perfil del abogado
  const { data: lawyer, error: lpErr } = await supabase
    .from("lawyer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (lpErr || !lawyer) {
    return { success: false, error: "Perfil de abogado no encontrado." };
  }

  // 2. Obtener consultas con pagos asociados
  const { data: consultations, error: consErr } = await supabase
    .from("consultations")
    .select(`
      id,
      agreed_price,
      payment_status,
      scheduled_at,
      created_at,
      cases!inner (
        title,
        profiles:user_id (first_name, last_name)
      )
    `)
    .eq("lawyer_id", lawyer.id)
    .in("payment_status", ["held_escrow", "released", "refunded"]);

  // 3. Obtener solicitudes de retiro existentes
  const { data: payoutRows, error: pErr } = await supabase
    .from("payout_requests")
    .select("*")
    .eq("lawyer_id", lawyer.id)
    .order("requested_at", { ascending: false });

  if (consErr || pErr) {
    return { success: false, error: "Error al consolidar la información financiera." };
  }

  let escrowBalance = 0;
  let releasedTotal = 0;
  const movements: FinancialMovementItem[] = [];

  (consultations || []).forEach((c: any) => {
    const price = Number(c.agreed_price) || 0;
    const client = c.cases?.profiles;
    const clientName = client ? `${client.first_name || ""} ${client.last_name || ""}`.trim() : "Cliente ALYA";

    if (c.payment_status === "held_escrow") {
      escrowBalance += price;
    } else if (c.payment_status === "released") {
      releasedTotal += price;
    }

    movements.push({
      id: c.id,
      concept: `Consulta Legal: "${c.cases?.title || "Asesoría Jurídica"}"`,
      type: "consultation",
      amountPen: price,
      status: c.payment_status,
      clientName,
      date: c.scheduled_at || c.created_at,
    });
  });

  // Calcular retiros ya procesados o en curso
  let completedPayouts = 0;
  let inFlightPayouts = 0;

  const payouts: PayoutRequestItem[] = (payoutRows || []).map((p: any) => {
    const amount = Number(p.amount_pen) || 0;
    if (p.status === "completed") {
      completedPayouts += amount;
    } else if (p.status === "requested" || p.status === "processing") {
      inFlightPayouts += amount;
    }

    return {
      id: p.id,
      amountPen: amount,
      bankName: p.bank_name,
      accountType: p.account_type,
      accountNumber: p.account_number,
      cciNumber: p.cci_number,
      beneficiaryName: p.beneficiary_name,
      beneficiaryDni: p.beneficiary_dni,
      status: p.status,
      adminNotes: p.admin_notes,
      transferVoucherUrl: p.transfer_voucher_url,
      requestedAt: p.requested_at,
      processedAt: p.processed_at,
    };
  });

  const availableBalance = Math.max(0, releasedTotal - completedPayouts - inFlightPayouts);
  const totalEarned = releasedTotal + escrowBalance;

  return {
    success: true,
    finances: {
      availableBalance,
      escrowBalance,
      totalEarned,
      totalWithdrawn: completedPayouts,
      movements,
      payouts,
    },
  };
}

export interface RequestPayoutParams {
  amountPen: number;
  bankName: string;
  accountType: "ahorros" | "corriente";
  accountNumber: string;
  cciNumber: string;
  beneficiaryName: string;
  beneficiaryDni: string;
}

export async function requestPayoutAction(params: RequestPayoutParams) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  // 1. Validar montos y CCI
  if (params.amountPen < 50) {
    return { success: false, error: "El monto mínimo de retiro es de S/ 50.00." };
  }

  const cleanCci = params.cciNumber.replace(/[^0-9]/g, "");
  if (cleanCci.length !== 20) {
    return {
      success: false,
      error: "El Código de Cuenta Interbancario (CCI) debe contener exactamente 20 dígitos numéricos.",
    };
  }

  if (!params.beneficiaryDni || params.beneficiaryDni.trim().length < 8) {
    return { success: false, error: "El DNI del beneficiario debe tener al menos 8 dígitos." };
  }

  // 2. Obtener saldo disponible real
  const finRes = await getLawyerFinancesAction();
  if (!finRes.success || !finRes.finances) {
    return { success: false, error: finRes.error || "No se pudo verificar el saldo disponible." };
  }

  if (params.amountPen > finRes.finances.availableBalance) {
    return {
      success: false,
      error: `Saldo insuficiente. Tu saldo disponible para retiro es S/ ${finRes.finances.availableBalance.toFixed(2)}.`,
    };
  }

  // 3. Obtener id del abogado
  const { data: lawyer } = await supabase
    .from("lawyer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!lawyer) {
    return { success: false, error: "Perfil de abogado no encontrado." };
  }

  // 4. Insertar solicitud de desembolso
  const { data: newPayout, error: insertErr } = await supabase
    .from("payout_requests")
    .insert({
      lawyer_id: lawyer.id,
      amount_pen: params.amountPen,
      bank_name: params.bankName,
      account_type: params.accountType,
      account_number: params.accountNumber,
      cci_number: cleanCci,
      beneficiary_name: params.beneficiaryName,
      beneficiary_dni: params.beneficiaryDni,
      status: "requested",
    })
    .select("id")
    .single();

  if (insertErr) {
    return { success: false, error: `Error registrando solicitud: ${insertErr.message}` };
  }

  // 5. Emitir notificación al usuario
  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "payout_requested",
    title: "Solicitud de Retiro en Proceso",
    message: `Tu solicitud de transferencia por S/ ${params.amountPen.toFixed(2)} hacia ${params.bankName} (CCI: ${cleanCci}) está en cola de liquidación.`,
    data: { payoutId: newPayout.id },
  });

  revalidatePath("/lawyer/finances");
  revalidatePath("/lawyer/dashboard");

  return {
    success: true,
    payoutId: newPayout.id,
    message: "Solicitud de desembolso registrada con éxito. La liquidación se completará en un plazo máximo de 24 horas hábiles.",
  };
}
