import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://alya.pe";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/abogados", "/privacidad", "/privacidad/arco", "/terminos", "/reclamaciones"],
        disallow: [
          "/dashboard",
          "/profile",
          "/cases/",
          "/lawyer/",
          "/admin/",
          "/chat/",
          "/onboarding/",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl.replace(/\/$/, "")}/sitemap.xml`,
  };
}

