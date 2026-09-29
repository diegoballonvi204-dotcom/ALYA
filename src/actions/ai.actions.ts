"use server";

import { createClient } from "@/lib/supabase/server";
import {
  ClassifyCaseAISchema,
  type ClassifyCaseAIValues,
} from "@/lib/validations/ai.schema";

export interface AIClassificationResult {
  specialtyId: number | null;
  specialtyName: string;
  subspecialtyId: number | null;
  subspecialtyName: string | null;
  urgency: "low" | "medium" | "high" | "urgent";
  urgencyReason: string;
  confidence: number;
  legalEntities: string[];
  summary: string;
}

export async function classifyCaseWithAIAction(
  formData: ClassifyCaseAIValues
): Promise<{ error?: string; result?: AIClassificationResult }> {
  const validated = ClassifyCaseAISchema.safeParse(formData);
  if (!validated.success) {
    return { error: "Datos de caso insuficientes para el análisis de IA" };
  }

  const supabase = await createClient();

  // 1. Obtener especialidades activas de la base de datos
  const { data: allSpecialties, error: specErr } = await supabase
    .from("specialties")
    .select("id, name, parent_id")
    .eq("is_active", true);

  if (specErr || !allSpecialties) {
    return { error: "No se pudo consultar el catálogo legal." };
  }

  const mainSpecialties = allSpecialties.filter((s) => !s.parent_id);
  const subspecialties = allSpecialties.filter((s) => s.parent_id);

  const textToAnalyze = `${validated.data.title} ${validated.data.description}`.toLowerCase();

  // 2. Diccionario de Taxonomía Jurídica Peruana
  const domainRules = [
    {
      domain: "Derecho Laboral",
      keywords: [
        "despido",
        "liquidación",
        "sueldo",
        "cts",
        "sunafil",
        "renuncia",
        "gratificación",
        "hostigamiento",
        "empleador",
        "trabajador",
        "boletas",
        "indemnización por despido",
        "arbitrario",
        "incausado",
        "vacaciones",
        "beneficios sociales",
      ],
      subspecialtyMap: [
        { name: "Despido Arbitrario / Incausado", terms: ["despido", "botaron", "arbitrario", "incausado"] },
        { name: "Cobro de Beneficios Sociales (CTS, Grati)", terms: ["cts", "gratificación", "liquidación", "beneficios"] },
        { name: "Accidentes de Trabajo e Indemnizaciones", terms: ["accidente", "lesión laboral", "seguro de trabajo"] },
        { name: "Inspecciones SUNAFIL", terms: ["sunafil", "multa laboral", "inspección"] },
      ],
    },
    {
      domain: "Derecho de Familia",
      keywords: [
        "alimentos",
        "pensión",
        "divorcio",
        "hijo",
        "hija",
        "tenencia",
        "régimen de visitas",
        "patria potestad",
        "filiación",
        "adn",
        "violencia familiar",
        "cónyuge",
        "separación",
        "adopción",
      ],
      subspecialtyMap: [
        { name: "Fijación y Aumento de Pensión de Alimentos", terms: ["alimentos", "pensión", "manutención"] },
        { name: "Divorcio por Causal y Mutuo Acuerdo", terms: ["divorcio", "separación", "matrimonio"] },
        { name: "Tenencia Compartida y Régimen de Visitas", terms: ["tenencia", "visitas", "hijos"] },
        { name: "Filiación Extramatrimonial (Prueba de ADN)", terms: ["filiación", "reconocimiento", "adn"] },
      ],
    },
    {
      domain: "Derecho Penal",
      keywords: [
        "denuncia",
        "fiscalía",
        "delito",
        "estafa",
        "apropiación",
        "usurpación",
        "querella",
        "prisión",
        "detención",
        "policía",
        "comisaría",
        "hurto",
        "robo",
        "fraude",
        "amenaza",
        "agresión",
      ],
      subspecialtyMap: [
        { name: "Delitos Contra el Patrimonio (Estafas, Apropiación)", terms: ["estafa", "fraude", "apropiación", "dinero"] },
        { name: "Defensa en Investigación Fiscal y Detenciones", terms: ["detención", "fiscal", "comisaría", "prisión"] },
        { name: "Delitos Contra la Vida, el Cuerpo y la Salud", terms: ["agresión", "lesiones", "golpes", "vida"] },
      ],
    },
    {
      domain: "Derecho Civil",
      keywords: [
        "contrato",
        "desalojo",
        "arrendamiento",
        "inquilino",
        "alquiler",
        "hipoteca",
        "embargo",
        "deuda",
        "sucesión intestada",
        "herencia",
        "testamento",
        "compraventa",
        "propiedad",
        "terreno",
        "prescripción adquisitiva",
      ],
      subspecialtyMap: [
        { name: "Desalojo de Inquilinos Morosos / Precarios", terms: ["desalojo", "inquilino", "alquiler", "precario"] },
        { name: "Sucesión Intestada y Declaratoria de Herederos", terms: ["sucesión", "herencia", "herederos", "falleció"] },
        { name: "Saneamiento de Propiedad y Prescripción Adquisitiva", terms: ["propiedad", "terreno", "título", "prescripción"] },
        { name: "Cobranza de Deudas e Incumplimiento de Contratos", terms: ["deuda", "contrato", "pagaré", "factura"] },
      ],
    },
    {
      domain: "Derecho Comercial y Corporativo",
      keywords: [
        "empresa",
        "sociedad",
        "socio",
        "accionistas",
        "indecopi",
        "marca",
        "registro de marca",
        "sunat",
        "tributario",
        "quiebra",
        "consumidor",
        "libro de reclamaciones",
      ],
      subspecialtyMap: [
        { name: "Protección al Consumidor y Denuncias INDECOPI", terms: ["indecopi", "consumidor", "reclamaciones"] },
        { name: "Registro y Protección de Marcas y Patentes", terms: ["marca", "patente", "nombre comercial"] },
        { name: "Constitución y Conflictos Societarios", terms: ["sociedad", "empresa", "socios", "estatuto"] },
      ],
    },
  ];

  // 3. Puntuación de dominios
  let bestDomain = domainRules[0];
  let maxScore = 0;
  const matchedEntities: string[] = [];

  for (const rule of domainRules) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (textToAnalyze.includes(kw)) {
        score += 1;
        if (!matchedEntities.includes(kw)) {
          matchedEntities.push(kw);
        }
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestDomain = rule;
    }
  }

  // 4. Vincular con specialty en BD
  const matchedSpecialty = mainSpecialties.find((s) =>
    s.name.toLowerCase().includes(bestDomain.domain.toLowerCase()) ||
    bestDomain.domain.toLowerCase().includes(s.name.toLowerCase())
  ) || mainSpecialties[0];

  // 5. Vincular subspecialty
  let matchedSub = null;
  if (matchedSpecialty) {
    const subsForDomain = subspecialties.filter(
      (sub) => sub.parent_id === matchedSpecialty.id
    );

    for (const subRule of bestDomain.subspecialtyMap) {
      const hits = subRule.terms.some((t) => textToAnalyze.includes(t));
      if (hits) {
        matchedSub = subsForDomain.find((s) =>
          s.name.toLowerCase().includes(subRule.name.toLowerCase().substring(0, 10))
        );
        if (matchedSub) break;
      }
    }

    if (!matchedSub && subsForDomain.length > 0) {
      matchedSub = subsForDomain[0];
    }
  }

  // 6. Análisis de Urgencia
  let urgency: "low" | "medium" | "high" | "urgent" = "medium";
  let urgencyReason = "Consulta legal estándar sin plazos judiciales perentorios inmediatos.";

  const urgentTerms = [
    "detenido",
    "detención",
    "comisaría",
    "24 horas",
    "48 horas",
    "embargo hoy",
    "embargo mañana",
    "audiencia urgente",
    "desalojo inminente",
    "violencia física",
    "flagrancia",
  ];

  const highTerms = [
    "carta notarial",
    "notificación judicial",
    "plazo",
    "citación fiscal",
    "sunafil",
    "demanda",
    "indecopi",
    "apelar",
    "vence",
  ];

  if (urgentTerms.some((t) => textToAnalyze.includes(t))) {
    urgency = "urgent";
    urgencyReason =
      "Detectamos privación de libertad, diligencia policial inminente o riesgo de pérdida patrimonial inmediata.";
  } else if (highTerms.some((t) => textToAnalyze.includes(t))) {
    urgency = "high";
    urgencyReason =
      "Existen cartas notariales o notificaciones procesales con plazos legales de caducidad activos (3 a 10 días hábiles).";
  }

  const confidence = Math.min(0.96, Math.max(0.72, 0.7 + maxScore * 0.05));

  const summary = `Caso orientado a ${matchedSpecialty?.name || bestDomain.domain}${
    matchedSub ? ` en la subespecialidad de ${matchedSub.name}` : ""
  }. Se recomienda asistencia legal con urgencia ${urgency.toUpperCase()}.`;

  return {
    result: {
      specialtyId: matchedSpecialty ? matchedSpecialty.id : null,
      specialtyName: matchedSpecialty ? matchedSpecialty.name : bestDomain.domain,
      subspecialtyId: matchedSub ? matchedSub.id : null,
      subspecialtyName: matchedSub ? matchedSub.name : null,
      urgency,
      urgencyReason,
      confidence,
      legalEntities: matchedEntities.slice(0, 6),
      summary,
    },
  };
}
