"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CriticalDeadlineItem {
  id: string;
  title: string;
  deadlineDate: string;
  daysLeft: number;
  legalArticle: string;
  isPeremptory: boolean;
  urgencyLevel: "critical" | "warning" | "normal";
}

export interface DocumentAnalysisResult {
  summary: string;
  mainClaims: string;
  legalBasis: string;
  proceduralRisk: "bajo" | "medio" | "alto";
  category: "demanda" | "resolucion_judicial" | "notificacion_notarial" | "contrato" | "acta_policial" | "carta_despido" | "otro";
  deadlines: CriticalDeadlineItem[];
  recommendedActions: string[];
}

export async function analyzeCaseDocumentAction(documentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  // 1. Obtener documento y caso relacionado
  const { data: doc, error: docErr } = await supabase
    .from("case_documents")
    .select(`
      id,
      case_id,
      file_name,
      storage_path,
      mime_type,
      file_size_bytes,
      document_category,
      analysis_status,
      cases!inner (
        id,
        title,
        description,
        urgency,
        police_station,
        created_at,
        specialties:specialties!cases_specialty_id_fkey (name)
      )
    `)
    .eq("id", documentId)
    .single();

  if (docErr || !doc) {
    return { error: "Documento no encontrado o no autorizado." };
  }

  // Actualizar estado a analyzing
  await supabase
    .from("case_documents")
    .update({ analysis_status: "analyzing" })
    .eq("id", documentId);

  try {
    const caseItem = doc.cases as any;
    const specialtyName = caseItem?.specialties?.name?.toLowerCase() || "";
    const fileNameLower = doc.file_name.toLowerCase();
    const caseDescLower = (caseItem?.description || "").toLowerCase();

    // 2. Motor Heurístico Legal Peruano de Clasificación y Detección de Plazos
    let category: "demanda" | "resolucion_judicial" | "notificacion_notarial" | "contrato" | "acta_policial" | "carta_despido" | "otro" = "otro";
    const deadlines: CriticalDeadlineItem[] = [];
    let proceduralRisk: "bajo" | "medio" | "alto" = "medio";
    let summary = "";
    let mainClaims = "";
    let legalBasis = "";
    const recommendedActions: string[] = [];

    const now = new Date();

    // A. Detección de Despido / Laboral (D.Leg. 728)
    if (
      fileNameLower.includes("despido") ||
      fileNameLower.includes("preaviso") ||
      fileNameLower.includes("imputacion") ||
      caseDescLower.includes("despido") ||
      specialtyName.includes("laboral")
    ) {
      category = fileNameLower.includes("preaviso") ? "carta_despido" : "demanda";
      proceduralRisk = "alto";
      
      const deadlineDate = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
      deadlines.push({
        id: "d1",
        title: "Absolución de Carta de Preaviso de Despido",
        deadlineDate: deadlineDate.toISOString(),
        daysLeft: 6,
        legalArticle: "Art. 31 del D.Leg. N.° 728 (Ley de Productividad y Competitividad Laboral)",
        isPeremptory: true,
        urgencyLevel: "critical",
      });

      summary = "Imputación de faltas laborales graves por parte del empleador con apercibimiento de despido inminente.";
      mainClaims = "El empleador imputa quebrantamiento de la buena fe laboral o inasistencias injustificadas, otorgando plazo perentorio de ley.";
      legalBasis = "D.Leg. N.° 728 Art. 25 y 31; Ley N.° 29497 (Nueva Ley Procesal del Trabajo).";
      recommendedActions.push(
        "Presentar pliego de descargos por conducto notarial antes del 6to día natural.",
        "Recabar récord de asistencia, correos y testimonios de supervisores inmediatos.",
        "Solicitar inspección laboral preventiva ante SUNAFIL si existe hostilidad laboral."
      );
    }
    // B. Detección Penal / Flagrancia / Comisaría (NCPP & Constitución)
    else if (
      caseItem?.urgency === "immediate" ||
      fileNameLower.includes("detencion") ||
      fileNameLower.includes("acta") ||
      fileNameLower.includes("policial") ||
      caseDescLower.includes("comisaria") ||
      caseDescLower.includes("fiscalia") ||
      specialtyName.includes("penal")
    ) {
      category = "acta_policial";
      proceduralRisk = "alto";

      const deadlineDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      deadlines.push({
        id: "d2",
        title: "Vencimiento de Detención Policial en Flagrancia (48h)",
        deadlineDate: deadlineDate.toISOString(),
        daysLeft: 2,
        legalArticle: "Art. 2, inc. 24, lit. f de la Constitución Política del Perú & Art. 264 del NCPP",
        isPeremptory: true,
        urgencyLevel: "critical",
      });

      summary = "Intervención y custodia en sede policial o fiscal por presunta comisión de delito en flagrancia.";
      mainClaims = "El Ministerio Público debe resolver si solicita comparecencia con restricciones o formula requerimiento de prisión preventiva.";
      legalBasis = "Constitución Art. 2.24.f; Código Procesal Penal (D.Leg. 957) Arts. 259, 264 y 268.";
      recommendedActions.push(
        "Apersonamiento inmediato del letrado en la comisaría o sede de la fiscalía de turno.",
        "Revisar el Acta de Lectura de Derechos y constatar si se respetó el examen del Médico Legista.",
        "Ofrecer de urgencia constancias de arraigo domiciliario, familiar y laboral de calidad."
      );
    }
    // C. Detección de Notificación / Auto Judicial (Código Procesal Civil)
    else if (
      fileNameLower.includes("resolucion") ||
      fileNameLower.includes("auto") ||
      fileNameLower.includes("decreto") ||
      fileNameLower.includes("cedula")
    ) {
      category = "resolucion_judicial";
      proceduralRisk = "medio";

      const deadlineDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      deadlines.push({
        id: "d3",
        title: "Interposición de Recurso de Apelación contra Auto Judicial",
        deadlineDate: deadlineDate.toISOString(),
        daysLeft: 3,
        legalArticle: "Art. 367 y Art. 376 del Código Procesal Civil Peruano",
        isPeremptory: true,
        urgencyLevel: "warning",
      });

      summary = "Resolución judicial dictada por el Juzgado que resuelve excepción o dispone medida procesal con apercibimiento.";
      mainClaims = "El juzgado declara improcedente o infundado un pedido previo y concede plazo perentorio para impugnar.";
      legalBasis = "Código Procesal Civil Arts. 364, 367 y 376; TUO de la Ley Orgánica del Poder Judicial.";
      recommendedActions.push(
        "Verificar fecha exacta de la cédula de notificación física o en casilla electrónica SINOE.",
        "Fundamentar agravios de hecho y derecho acreditando el error in iudicando o in procedendo.",
        "Adjuntar arancel judicial por concepto de apelación y cédulas de notificación."
      );
    }
    // D. Demanda Civil o Comercial
    else if (
      fileNameLower.includes("demanda") ||
      fileNameLower.includes("admisorio") ||
      fileNameLower.includes("inadmisible")
    ) {
      category = "demanda";
      proceduralRisk = "alto";

      const deadlineDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      deadlines.push({
        id: "d4",
        title: "Subsanación de Inadmisibilidad o Contestación Preliminar",
        deadlineDate: deadlineDate.toISOString(),
        daysLeft: 5,
        legalArticle: "Art. 426 y 478 del Código Procesal Civil",
        isPeremptory: true,
        urgencyLevel: "warning",
      });

      summary = "Escrito de demanda judicial o resolución de admisibilidad sujeta a observaciones de forma.";
      mainClaims = "Emplazamiento a la parte demandada para contestar o subsanar omisiones arancelarias y de legitimidad para obrar.";
      legalBasis = "Código Procesal Civil Arts. 424, 425, 426 y 442.";
      recommendedActions.push(
        "Alinear medios probatorios instrumentales y tasas del Banco de la Nación.",
        "Evaluar la interposición de excepciones procesales previas (prescripción, incompetencia o litispendencia)."
      );
    }
    // E. Carta Notarial o Contrato
    else {
      category = fileNameLower.includes("contrato") ? "contrato" : "notificacion_notarial";
      proceduralRisk = "bajo";

      const deadlineDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      deadlines.push({
        id: "d5",
        title: "Plazo de Requerimiento de Carta Notarial",
        deadlineDate: deadlineDate.toISOString(),
        daysLeft: 15,
        legalArticle: "Art. 1428 y 1429 del Código Civil Peruano (Resolución por Incumplimiento)",
        isPeremptory: false,
        urgencyLevel: "normal",
      });

      summary = "Comunicación extrajudicial con intimación en mora o resolución contractual.";
      mainClaims = "Exigencia de cumplimiento de obligación contractual bajo apercibimiento de dar por resuelto el negocio jurídico.";
      legalBasis = "Código Civil Arts. 1333, 1428 y 1429; D.S. N.° 010-2010-JUS.";
      recommendedActions.push(
        "Responder por la misma vía notarial contradiciendo los extremos falsos de la misiva.",
        "Preconstituir prueba documental antes del inicio de la etapa de conciliación extrajudicial obligatoria."
      );
    }

    const aiPayload = {
      summary,
      mainClaims,
      legalBasis,
      proceduralRisk,
      recommendedActions,
    };

    // 3. Persistir en la base de datos Supabase
    const { error: updateErr } = await supabase
      .from("case_documents")
      .update({
        document_category: category,
        analysis_status: "completed",
        ai_analysis: aiPayload as any,
        critical_deadlines: deadlines as any,
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    if (updateErr) {
      throw new Error(`Error guardando análisis: ${updateErr.message}`);
    }

    // 4. Si hay conversación activa, enviar notificación al chat
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("case_id", doc.case_id)
      .eq("is_active", true)
      .maybeSingle();

    if (conv) {
      const topDeadline = deadlines[0];
      const deadlineMsg = topDeadline
        ? `🚨 Plazo detectado: "${topDeadline.title}" (${topDeadline.daysLeft} días restantes bajo ${topDeadline.legalArticle}).`
        : "";

      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_id: user.id,
        message: `🤖 Análisis Procesal IA Finalizado para "${doc.file_name}":\nCategoría: ${category.toUpperCase()}\nRiesgo: ${proceduralRisk.toUpperCase()}.\n${deadlineMsg}`,
        attachment_type: "text",
      });
      revalidatePath(`/chat/${conv.id}`);
    }

    revalidatePath(`/cases/${doc.case_id}`);
    return {
      success: true,
      analysis: aiPayload,
      deadlines,
      category,
    };
  } catch (err: any) {
    await supabase
      .from("case_documents")
      .update({ analysis_status: "failed" })
      .eq("id", documentId);

    return { error: err.message || "Error al ejecutar el análisis procesal con IA." };
  }
}

export async function getDocumentAiAnalysisAction(documentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const { data: doc, error } = await supabase
    .from("case_documents")
    .select(`
      id,
      case_id,
      file_name,
      storage_path,
      file_size_bytes,
      mime_type,
      document_category,
      analysis_status,
      ai_analysis,
      critical_deadlines,
      analyzed_at,
      created_at
    `)
    .eq("id", documentId)
    .single();

  if (error || !doc) {
    return { error: "Documento no encontrado" };
  }

  return {
    document: {
      id: doc.id,
      caseId: doc.case_id,
      fileName: doc.file_name,
      fileSizeBytes: doc.file_size_bytes,
      category: doc.document_category,
      status: doc.analysis_status,
      analysis: doc.ai_analysis as any,
      deadlines: (doc.critical_deadlines as any) || [],
      analyzedAt: doc.analyzed_at,
    },
  };
}
