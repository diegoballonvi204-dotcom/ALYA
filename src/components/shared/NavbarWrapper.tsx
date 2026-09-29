"use client";

import { usePathname } from "next/navigation";

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Ocultar la barra pública en el backoffice administrativo para no duplicar encabezados
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return <>{children}</>;
}
