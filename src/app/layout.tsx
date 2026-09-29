import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import { Navbar } from "@/components/shared/Navbar";
import { NavbarWrapper } from "@/components/shared/NavbarWrapper";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const serif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "ALYA Perú — Encuentra al Abogado Ideal para tu Caso",
  description:
    "ALYA es la plataforma LegalTech de alta gama. Matching jurídico de precisión mediante algoritmos ponderados y verificación oficial de colegiatura.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${sans.variable} ${serif.variable} scroll-smooth`}>
      <body className="font-sans antialiased selection:bg-blue-600/20 selection:text-[#0F172A] flex min-h-screen flex-col bg-[#F8FAFC] text-[#0F172A] overflow-x-hidden">
        <QueryProvider>
          <NavbarWrapper>
            <Navbar />
          </NavbarWrapper>
          <main className="flex-1">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
