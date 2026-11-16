import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600;

const DEMO_UUID_PREFIX_REGEX = /^(?:([0-9a-f])\1{5,}|[a-f]([0-9a-f])\2{6}-)/i;
const SEED_BAR_NUMBERS = new Set(["29140", "35210", "41280", "12450"]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://alya.pe").replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/abogados`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/privacidad`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/privacidad/arco`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/terminos`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/reclamaciones`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const lawyerIds = new Set<string>();
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data } = await supabase
        .from("lawyer_profiles")
        .select("id, bar_number, profiles!inner(id)")
        .eq("is_available", true)
        .limit(100);
      (data || []).forEach((row: { id: string; bar_number?: string | null }) => {
        if (
          row?.id &&
          !DEMO_UUID_PREFIX_REGEX.test(row.id) &&
          !SEED_BAR_NUMBERS.has(String(row.bar_number || "").trim())
        ) {
          lawyerIds.add(row.id);
        }
      });
    }
  } catch {
    // Continuar con rutas estáticas si no hay conectividad en compilación
  }

  const lawyerEntries: MetadataRoute.Sitemap = Array.from(lawyerIds).map((id) => ({
    url: `${baseUrl}/abogados/${id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...lawyerEntries];
}

