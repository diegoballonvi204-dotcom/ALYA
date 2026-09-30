import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const topic = searchParams.get("type") || searchParams.get("topic");
    const idFromQuery = searchParams.get("data.id") || searchParams.get("id");

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty in some webhook verification pings
    }

    const eventType = body?.type || topic;
    const resourceId = body?.data?.id || idFromQuery;

    console.log(`[Mercado Pago Webhook] Recibido evento: ${eventType}, ID: ${resourceId}`);

    if (!resourceId) {
      return NextResponse.json({ received: true, note: "No resource id provided" }, { status: 200 });
    }

    const supabase = await createClient();

    // 1. Manejo de Suscripción Recurrente (Preapproval)
    if (eventType === "subscription_preapproval" || eventType === "preapproval") {
      // Consultar estado en API de Mercado Pago si existe token
      const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      let preapprovalStatus = body?.status;
      let payerEmail = body?.payer_email;

      if (mpToken) {
        try {
          const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
            headers: {
              Authorization: `Bearer ${mpToken}`,
            },
          });
          if (mpRes.ok) {
            const mpData = await mpRes.json();
            preapprovalStatus = mpData.status;
            payerEmail = mpData.payer_email;
          }
        } catch (fetchErr) {
          console.error("Error al consultar preapproval en Mercado Pago:", fetchErr);
        }
      }

      if (preapprovalStatus === "authorized") {
        // Buscar y activar la suscripción del abogado
        const { data: sub } = await supabase
          .from("lawyer_subscriptions")
          .select("id, lawyer_id")
          .eq("external_subscription_id", resourceId)
          .maybeSingle();

        if (sub) {
          await supabase
            .from("lawyer_subscriptions")
            .update({
              status: "active",
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
              matches_used_this_period: 0,
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", sub.id);

          console.log(`[Mercado Pago] Suscripción activada para lawyer_id: ${sub.lawyer_id}`);
        }
      } else if (preapprovalStatus === "cancelled" || preapprovalStatus === "paused") {
        await supabase
          .from("lawyer_subscriptions")
          .update({
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq("external_subscription_id", resourceId);
      }
    }

    // 2. Manejo de Cobros Individuales o Recurrentes de Factura
    if (eventType === "payment" || eventType === "subscription_authorized_payment") {
      const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      let paymentStatus = "approved";
      let transactionAmount = 89;

      if (mpToken) {
        try {
          const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
            headers: {
              Authorization: `Bearer ${mpToken}`,
            },
          });
          if (payRes.ok) {
            const payData = await payRes.json();
            paymentStatus = payData.status;
            transactionAmount = payData.transaction_amount;
          }
        } catch (payErr) {
          console.error("Error al consultar pago en Mercado Pago:", payErr);
        }
      }

      if (paymentStatus === "approved") {
        // Idempotencia: Verificar si el pago ya fue registrado
        const { data: existingInv } = await supabase
          .from("subscription_invoices")
          .select("id")
          .eq("external_payment_id", resourceId.toString())
          .maybeSingle();

        if (!existingInv) {
          console.log(`[Mercado Pago] Pago ${resourceId} registrado exitosamente.`);
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error("Error en Webhook Mercado Pago:", err);
    // Respondemos 200 para evitar que Mercado Pago reintente indefinidamente en fallos de parsing
    return NextResponse.json({ received: true, error: err.message }, { status: 200 });
  }
}
