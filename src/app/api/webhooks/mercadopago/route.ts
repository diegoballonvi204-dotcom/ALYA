import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

function verifyMercadoPagoSignature(params: {
  secret: string;
  xSignature: string | null;
  xRequestId: string | null;
  resourceId: string;
}): boolean {
  if (!params.xSignature || !params.xRequestId) {
    return false;
  }

  let ts = "";
  let v1 = "";
  for (const part of params.xSignature.split(",")) {
    const [key, val] = part.split("=").map((s) => s.trim());
    if (key === "ts") ts = val || "";
    else if (key === "v1") v1 = val || "";
  }

  if (!ts || !v1 || !/^[a-f0-9]{64}$/i.test(v1)) {
    return false;
  }

  const manifest = `id:${params.resourceId};request-id:${params.xRequestId};ts:${ts};`;
  const expected = crypto
    .createHmac("sha256", params.secret)
    .update(manifest)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(v1.toLowerCase(), "hex");
  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export async function POST(req: NextRequest) {
  try {
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpToken) {
      return NextResponse.json(
        { error: "Webhook token not configured" },
        { status: 503 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const topic = searchParams.get("type") || searchParams.get("topic");
    const idFromQuery = searchParams.get("data.id") || searchParams.get("id");

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty in some webhook pings
    }

    const eventType = String(body?.type || topic || "");
    const rawResourceId = body?.data?.id ?? idFromQuery;
    const resourceId = rawResourceId !== undefined && rawResourceId !== null ? String(rawResourceId).trim() : "";

    if (!resourceId || !/^[a-zA-Z0-9_-]{1,64}$/.test(resourceId)) {
      return NextResponse.json(
        { error: "Identificador de recurso inválido" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const isValidSig = verifyMercadoPagoSignature({
        secret: webhookSecret,
        xSignature: req.headers.get("x-signature"),
        xRequestId: req.headers.get("x-request-id"),
        resourceId,
      });

      if (!isValidSig) {
        return NextResponse.json(
          { error: "Firma de webhook inválida" },
          { status: 401 }
        );
      }
    }

    const supabase = await createClient();

    // 1. Manejo de Suscripción Recurrente (Preapproval)
    if (eventType === "subscription_preapproval" || eventType === "preapproval") {
      let preapprovalStatus: string | null = null;

      try {
        const mpRes = await fetch(
          `https://api.mercadopago.com/preapproval/${encodeURIComponent(resourceId)}`,
          {
            headers: {
              Authorization: `Bearer ${mpToken}`,
            },
          }
        );
        if (mpRes.ok) {
          const mpData = await mpRes.json();
          preapprovalStatus = typeof mpData?.status === "string" ? mpData.status : null;
        }
      } catch (fetchErr) {
        console.error("Error al consultar preapproval en Mercado Pago:", fetchErr);
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
      let paymentStatus: string | null = null;

      try {
        const payRes = await fetch(
          `https://api.mercadopago.com/v1/payments/${encodeURIComponent(resourceId)}`,
          {
            headers: {
              Authorization: `Bearer ${mpToken}`,
            },
          }
        );
        if (payRes.ok) {
          const payData = await payRes.json();
          paymentStatus = typeof payData?.status === "string" ? payData.status : null;

          // Manejo de pago de consulta legal en custodia (Escrow)
          const externalRef = payData?.external_reference;
          if (
            typeof externalRef === "string" &&
            externalRef.startsWith("consultation_") &&
            paymentStatus === "approved"
          ) {
            const consultationId = externalRef.replace("consultation_", "");
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(consultationId)) {
              await supabase
                .from("consultations")
                .update({
                  payment_status: "held_escrow",
                  payment_method: "mercadopago",
                  payment_reference: resourceId,
                  paid_at: new Date().toISOString(),
                })
                .eq("id", consultationId);

              const { data: c } = await supabase
                .from("consultations")
                .select("case_id, agreed_price, client_id")
                .eq("id", consultationId)
                .single();

              if (c) {
                const { data: conv } = await supabase
                  .from("conversations")
                  .select("id")
                  .eq("case_id", c.case_id)
                  .maybeSingle();

                if (conv) {
                  await supabase.from("messages").insert({
                    conversation_id: conv.id,
                    sender_id: c.client_id,
                    message: `💳 **Pago de Honorarios Confirmado (Escrow)**:\nMedio: Mercado Pago (Pago ID: ${resourceId})\nMonto: S/ ${Number(c.agreed_price).toFixed(2)}\nEstado: **Fondos en custodia garantizada por ALYA**\nLa sala de videollamada y los enlaces se encuentran 100% habilitados.`,
                  });
                }
              }
            }
          }
        }
      } catch (payErr) {
        console.error("Error al consultar pago en Mercado Pago:", payErr);
      }

      if (paymentStatus === "approved") {
        const { data: existingInv } = await supabase
          .from("subscription_invoices")
          .select("id")
          .eq("external_payment_id", resourceId)
          .maybeSingle();

        if (!existingInv) {
          console.log(`[Mercado Pago] Pago ${resourceId} verificado y procesado.`);
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error("Error en Webhook Mercado Pago:", err);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
