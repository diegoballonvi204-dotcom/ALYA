import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pluralize(count: number, singular: string, plural?: string): string {
  const p = plural || `${singular}s`;
  return count === 1 ? singular : p;
}

/**
 * Normaliza el nombre completo de un abogado evitando prefijos duplicados (ej. "Dr. Dra.", "Dr. Dr.")
 */
export function cleanLawyerName(firstName?: string | null, lastName?: string | null): string {
  const raw = `${firstName || ""} ${lastName || ""}`.trim();
  if (!raw) return "Abogado Colegiado";
  return raw.replace(/^(?:(?:Dr\.?|Dra\.?|Abg\.?)\s+)+/i, "").trim();
}

export function formatLawyerTitleName(firstName?: string | null, lastName?: string | null): string {
  const raw = `${firstName || ""} ${lastName || ""}`.trim();
  if (!raw) return "Abogado Colegiado";
  const prefixMatch = raw.match(/^(Dra?\.?|Abg\.?)\s+/i);
  const clean = cleanLawyerName(firstName, lastName);
  const prefix = prefixMatch ? (prefixMatch[1].endsWith(".") ? prefixMatch[1] : `${prefixMatch[1]}.`) : "Dr(a).";
  return `${prefix} ${clean}`.trim();
}

/**
 * Formatea el colegio profesional y matrícula sin duplicar siglas (ej. evita "CAL CAL 12345")
 */
export function formatBarLabel(barAssociation?: string | null, barNumber?: string | null): string {
  const assoc = (barAssociation || "CAL").trim();
  const num = (barNumber || "").trim();
  if (!num) return assoc;
  if (assoc.toUpperCase().includes("CAL") && num.toUpperCase().startsWith("CAL")) {
    return num;
  }
  if (assoc.toUpperCase() === "CAL" || assoc.toUpperCase().includes("(CAL)")) {
    return `CAL ${num}`;
  }
  return `${assoc} ${num}`;
}

/**
 * Formateo determinista de fechas y horas en zona America/Lima para evitar errores de hidratación React #418
 */
export function formatLimaTime(dateInput: string | Date): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  });
}

export function formatLimaDate(
  dateInput: string | Date,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }
): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-PE", {
    ...options,
    timeZone: "America/Lima",
  });
}

export function formatLimaDateTime(dateInput: string | Date): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  });
}

export interface AffinityCriteria {
  specialtyId?: number | null;
  specialtyName?: string | null;
  city?: string | null;
  modality?: string | null;
}

export interface AffinityResult {
  score: number;
  breakdown: {
    specialty_match: boolean;
    subspecialty_match: boolean;
    same_city: boolean;
    modality_compatible: boolean;
    is_available: boolean;
  };
}

/**
 * Calcula la afinidad real ponderada con los 5 factores anunciados en ALYA:
 * 1. Materia & Especialidad (35%)
 * 2. Años de Experiencia (25%)
 * 3. Distrito Judicial / Ciudad (15%)
 * 4. Disponibilidad y Modalidad (15%)
 * 5. Reputación Multidimensional (10%)
 */
export function calculateFiveFactorAffinity(
  lawyer: {
    years_experience?: number | null;
    virtual_attention?: boolean | null;
    physical_attention?: boolean | null;
    rating_average?: number | null;
    total_reviews?: number | null;
    is_available?: boolean | null;
    profiles?: { city?: string | null } | null;
    lawyer_specialties?: Array<{
      is_primary?: boolean | null;
      specialty_id?: number | null;
      specialties?: { id?: number | null; name?: string | null; slug?: string | null } | null;
    }> | null;
  },
  criteria: AffinityCriteria
): AffinityResult {
  const targetSpecName = (criteria.specialtyName || "").toLowerCase().trim();
  const targetSpecId = criteria.specialtyId ? Number(criteria.specialtyId) : null;
  const targetCity = (criteria.city || "Lima").toLowerCase().trim();
  const targetModality = (criteria.modality || "virtual").toLowerCase().trim();

  const lawyerSpecs = lawyer.lawyer_specialties || [];
  let primaryMatch = false;
  let secondaryMatch = false;

  for (const ls of lawyerSpecs) {
    const sId = ls.specialty_id ?? ls.specialties?.id;
    const sName = (ls.specialties?.name || "").toLowerCase().trim();
    const isIdMatch = targetSpecId !== null && sId !== null && sId !== undefined && Number(sId) === targetSpecId;
    const isNameMatch =
      Boolean(targetSpecName) &&
      Boolean(sName) &&
      (sName === targetSpecName || sName.includes(targetSpecName) || targetSpecName.includes(sName));

    if (isIdMatch || isNameMatch) {
      if (ls.is_primary) primaryMatch = true;
      else secondaryMatch = true;
    }
  }

  // Factor 1: Materia & Especialidad (35%)
  const specialty_match = primaryMatch || secondaryMatch;
  const subspecialty_match = primaryMatch;
  const specialtyScore = primaryMatch ? 35 : secondaryMatch ? 26 : 8;

  // Factor 2: Años de Experiencia (25%)
  const expYears = Math.max(0, Number(lawyer.years_experience || 0));
  const experienceScore = Math.min(25, Math.round((Math.min(expYears, 15) / 15) * 25));

  // Factor 3: Distrito Judicial / Ciudad (15%)
  const lawyerCity = (lawyer.profiles?.city || "").toLowerCase().trim();
  const same_city = Boolean(targetCity && lawyerCity && lawyerCity === targetCity);
  const cityScore = same_city ? 15 : targetModality === "virtual" && lawyer.virtual_attention ? 8 : 3;

  // Factor 4: Disponibilidad y Modalidad (15%)
  const is_available = lawyer.is_available !== false;
  let modality_compatible = false;
  if (targetModality === "virtual") {
    modality_compatible = Boolean(lawyer.virtual_attention);
  } else if (targetModality === "in_person" || targetModality === "physical" || targetModality === "presencial") {
    modality_compatible = Boolean(lawyer.physical_attention);
  } else {
    modality_compatible = Boolean(lawyer.virtual_attention || lawyer.physical_attention);
  }
  const availabilityScore = (is_available ? 8 : 2) + (modality_compatible ? 7 : 1);

  // Factor 5: Reputación Multidimensional (10%)
  const rating = Math.min(5, Math.max(0, Number(lawyer.rating_average || 4.5)));
  const reviewsBonus = Number(lawyer.total_reviews || 0) > 0 ? 2 : 1;
  const reputationScore = Math.min(10, Math.round((rating / 5) * 8) + reviewsBonus);

  const rawTotal = specialtyScore + experienceScore + cityScore + availabilityScore + reputationScore;
  const score = Math.min(99, Math.max(40, Math.round(rawTotal)));

  return {
    score,
    breakdown: {
      specialty_match,
      subspecialty_match,
      same_city,
      modality_compatible,
      is_available,
    },
  };
}

