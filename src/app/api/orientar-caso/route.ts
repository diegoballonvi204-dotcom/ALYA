import { NextResponse } from "next/server";
import { classifyCaseWithAIAction } from "@/actions/ai.actions";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Payload inválido al orientar el caso." },
        { status: 400 }
      );
    }

    const rawTitle = String(body.titulo ?? body.title ?? "Consulta Legal").trim();
    const rawDescription = String(body.detalles ?? body.description ?? "").trim();
    const rawCity = body.city ? String(body.city).trim() : "Lima";

    if (rawDescription.length < 15) {
      return NextResponse.json(
        {
          error:
            "Escribe al menos 15 caracteres en los detalles para orientar tu consulta.",
        },
        { status: 400 }
      );
    }

    if (rawDescription.length > 5000 || rawTitle.length > 200) {
      return NextResponse.json(
        {
          error:
            "El título (máx. 200 caracteres) o los detalles (máx. 5,000 caracteres) superan el límite permitido.",
        },
        { status: 400 }
      );
    }

    const { error, result } = await classifyCaseWithAIAction({
      title: rawTitle.length >= 3 ? rawTitle : "Consulta Legal",
      description: rawDescription,
      city: rawCity,
    });

    if (error || !result) {
      return NextResponse.json(
        { error: error || "No se pudo orientar el caso en este momento." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      materiaSugerida: result.specialtyName,
      specialtyId: result.specialtyId,
      specialtyName: result.specialtyName,
      subspecialtyId: result.subspecialtyId,
      subspecialtyName: result.subspecialtyName,
      urgency: result.urgency,
      urgencyReason: result.urgencyReason,
      confidence: result.confidence,
      legalEntities: result.legalEntities,
      summary: result.summary,
      result,
    });
  } catch (err: unknown) {
    console.error("Error en POST /api/orientar-caso:", err);
    return NextResponse.json(
      { error: "Error interno en el servicio de orientación legal." },
      { status: 500 }
    );
  }
}

