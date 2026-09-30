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

export interface LawyerAIBriefResult {
  title: string;
  specialtyName: string;
  urgency: string;
  city: string;
  modality: string;
  factualSummary: string[];
  proceduralAlerts: string[];
  keyQuestions: string[];
  recommendedStrategy: string;
  applicableNorms: string[];
  tierUnlocked: "pro" | "elite";
}

/**
 * Genera un Resumen Ejecutivo Confidencial asistido por IA para abogados Pro y Élite.
 * Valida que la suscripción activa del abogado tenga `has_ai_assistant = true`.
 */
export async function getLawyerCaseAIBriefAction(
  caseId: string
): Promise<{
  success: boolean;
  isLocked?: boolean;
  brief?: LawyerAIBriefResult;
  error?: string;
}> {
  try {
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

    // 2. Verificar suscripción y permiso de IA
    const { data: sub } = await supabase
      .from("lawyer_subscriptions")
      .select(`
        id,
        status,
        plan_id,
        subscription_plans (
          tier,
          has_ai_assistant,
          name
        )
      `)
      .eq("lawyer_id", lawyer.id)
      .maybeSingle();

    const planTier = (sub?.subscription_plans as any)?.tier || "starter";
    const hasAi = (sub?.subscription_plans as any)?.has_ai_assistant || false;
    const isActive = sub?.status === "active" || sub?.status === "trialing";

    if (!isActive || !hasAi) {
      return {
        success: false,
        isLocked: true,
        error: "FEATURE_LOCKED",
      };
    }

    // 3. Obtener datos del caso
    const { data: c, error: caseErr } = await supabase
      .from("cases")
      .select("*, specialties(name)")
      .eq("id", caseId)
      .single();

    if (caseErr || !c) {
      return { success: false, error: "Caso no encontrado." };
    }

    const textToAnalyze = `${c.title} ${c.description}`.toLowerCase();
    const specialtyName = (c.specialties as any)?.name || "Materia General";

    // 4. Generar Síntesis Fáctica y Análisis Legal Especializado
    const factualSummary: string[] = [
      `El solicitante expone una controversia en ${c.city} bajo modalidad ${c.modality}.`,
      `Planteamiento central: ${c.title}. Se describe una situación de afectación jurídica con urgencia calificada como "${c.urgency.toUpperCase()}".`,
      `El caso involucra la materia de ${specialtyName}, requiriendo patrocinio técnico especializado.`,
    ];

    const proceduralAlerts: string[] = [];
    const applicableNorms: string[] = [];
    let recommendedStrategy = "";

    if (specialtyName.includes("Laboral") || textToAnalyze.includes("despido") || textToAnalyze.includes("cts")) {
      proceduralAlerts.push(
        "Caducidad procesal de 30 días naturales desde el despido para interponer demanda de indemnización o reposición (Art. 36 D.Leg 728).",
        "Revisar si existió carta de imputación de falta grave y plazo de descargo previo de 6 días (Art. 31 D.Leg 728).",
        "Plazo de prescripción de 4 años para cobro de beneficios sociales adeudados (Ley 27321)."
      );
      applicableNorms.push(
        "TUO D.Leg 728 (Ley de Productividad y Competitividad Laboral)",
        "Nueva Ley Procesal del Trabajo (Ley N.° 29497)",
        "D.Leg 650 (Ley de Compensación por Tiempo de Servicios - CTS)"
      );
      recommendedStrategy =
        "Solicitar constatación policial de despido o acta de infracción SUNAFIL. En paralelo, evaluar liquidación exacta de beneficios sociales e interponer demanda laboral o conciliación en el Ministerio de Trabajo.";
    } else if (specialtyName.includes("Familia") || textToAnalyze.includes("alimentos") || textToAnalyze.includes("divorcio")) {
      proceduralAlerts.push(
        "En alimentos: no requiere conciliación previa obligatoria; la pensión devenga desde el día siguiente a la notificación de la demanda (Art. 568 CPC).",
        "En tenencia o régimen de visitas: obligatoriedad de audiencia de conciliación extrajudicial previa ante Centro acreditado por MINJUSDH."
      );
      applicableNorms.push(
        "Código de los Niños y Adolescentes (Ley N.° 27337)",
        "Código Civil Peruano (Libro de Derecho de Familia)",
        "Ley N.° 26872 (Ley de Conciliación Extrajudicial)"
      );
      recommendedStrategy =
        "Determinar capacidad económica del obligado (boletas, RUC, signos exteriores de riqueza) y necesidades del alimentista. Proceder con medida cautelar de asignación anticipada de alimentos.";
    } else if (specialtyName.includes("Penal") || textToAnalyze.includes("denuncia") || textToAnalyze.includes("comisaría")) {
      proceduralAlerts.push(
        "Diligencias preliminares urgentes: plazo ordinario de 60 días salvo flagrancia (Art. 334 NCPP).",
        "Garantizar presencia de abogado defensor en declaraciones ante Fiscalía o PNP para evitar nulidades."
      );
      applicableNorms.push(
        "Nuevo Código Procesal Penal (D.Leg 957)",
        "Código Penal Peruano (D.Leg 635)",
        "Constitución Política del Perú (Art. 2 inc. 24 - Libertad individual y debido proceso)"
      );
      recommendedStrategy =
        "Apersonamiento inmediato ante la Fiscalía Provincial Penal corporativa o DEPINCRI. Solicitar copias de la carpeta fiscal y coordinar actos de investigación pertinentes.";
    } else {
      proceduralAlerts.push(
        "Verificar exigibilidad de Conciliación Extrajudicial previa antes de interponer demanda civil (Art. 6 Ley 26872).",
        "Prescripción extintiva de 10 años para acciones personales y 2 años para indemnización extracontractual (Art. 2001 Código Civil)."
      );
      applicableNorms.push(
        "Código Civil Peruano",
        "Código Procesal Civil",
        "Ley de Conciliación Extrajudicial (Ley N.° 26872)"
      );
      recommendedStrategy =
        "Cursar Carta Notarial de requerimiento formal otorgando plazo prudencial (72 horas) para resolver la controversia. De no mediar acuerdo, convocar a Centro de Conciliación.";
    }

    const keyQuestions: string[] = [
      "¿Cuenta con documentos, cartas notariales, contratos o capturas de WhatsApp que acrediten los hechos narrados?",
      "¿Ha recibido alguna notificación formal del Poder Judicial, Fiscalía, SUNAFIL o Centro de Conciliación recientemente?",
      "¿Cuál es su pretensión u objetivo principal (indemnización económica, acuerdo pacífico o restitución de derechos)?",
      "¿Ha conversado o iniciado trámites con otro profesional del derecho previamente para este mismo caso?",
    ];

    return {
      success: true,
      brief: {
        title: c.title,
        specialtyName,
        urgency: c.urgency,
        city: c.city,
        modality: c.modality,
        factualSummary,
        proceduralAlerts,
        keyQuestions,
        recommendedStrategy,
        applicableNorms,
        tierUnlocked: planTier as "pro" | "elite",
      },
    };
  } catch (err: any) {
    console.error("Error en getLawyerCaseAIBriefAction:", err);
    return { success: false, error: err.message || "Error al generar briefing IA" };
  }
}

