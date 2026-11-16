import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 503 });
    }

    const expectedHeader = `Bearer ${cronSecret}`;
    const authBuf = Buffer.from(authHeader, "utf8");
    const expectedBuf = Buffer.from(expectedHeader, "utf8");

    if (authBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(authBuf, expectedBuf)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.rpc("cron_subscription_dunning_sweep");

    if (error) {
      console.error("Error en cron_subscription_dunning_sweep:", error);
      return NextResponse.json({ success: false, error: "Error ejecutando cron" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Barrido de dunning ejecutado con éxito.",
      result: data,
    });
  } catch (err: any) {
    console.error("Error inesperado en /api/cron/subscriptions:", err);
    return NextResponse.json(
      { success: false, error: "Error interno de cron" },
      { status: 500 }
    );
  }
}
