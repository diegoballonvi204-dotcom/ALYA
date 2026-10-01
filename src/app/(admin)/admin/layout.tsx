import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  UserCheck,
  FileText,
  ExternalLink,
  ShieldCheck,
  Scale,
  CreditCard,
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "verifier") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Admin Bar - Clean, Expanded, Luxury Light */}
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between px-6 sm:px-10 lg:px-12 py-3.5">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-3 group shrink-0">
              <Image
                src="/logoAlya.png"
                alt="ALYA LegalTech"
                width={130}
                height={38}
                priority
                className="h-9 sm:h-10 w-auto object-contain group-hover:scale-105 transition-transform"
              />
              <span className="hidden sm:inline-block border-l border-slate-200 pl-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest font-semibold">
                Backoffice Administrativo
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold">
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-slate-600 hover:bg-slate-100 hover:text-[#0F172A] transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-[#2563EB]" />
                Panel General
              </Link>
              <Link
                href="/admin/verifications"
                className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-slate-600 hover:bg-slate-100 hover:text-[#0F172A] transition-colors"
              >
                <UserCheck className="w-4 h-4 text-[#2563EB]" />
                Verificaciones
              </Link>
              <Link
                href="/admin/subscriptions"
                className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-slate-600 hover:bg-slate-100 hover:text-[#0F172A] transition-colors"
              >
                <CreditCard className="w-4 h-4 text-[#2563EB]" />
                Suscripciones
              </Link>
              <Link
                href="/admin/audit"
                className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-slate-600 hover:bg-slate-100 hover:text-[#0F172A] transition-colors"
              >
                <FileText className="w-4 h-4 text-[#2563EB]" />
                Auditoría Forense
              </Link>
              <Link
                href="/admin/arco"
                className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-slate-600 hover:bg-slate-100 hover:text-[#0F172A] transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                Privacidad ARCO
              </Link>
            </nav>
          </div>

          {/* User Role Badge & Exit to App */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-[#0F172A]">
                {profile.first_name} {profile.last_name}
              </span>
              <span className="text-[10px] font-mono uppercase text-blue-600 font-bold">
                Rol: {profile.role}
              </span>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-400 hover:text-[#0F172A] transition-all shadow-sm"
            >
              <span>Ir a la App</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </Link>
          </div>
        </div>
      </header>

      {/* Sub Navigation on Mobile */}
      <div className="md:hidden border-b border-slate-200 bg-white px-4 py-2 flex items-center justify-around text-xs font-semibold text-slate-600">
        <Link href="/admin" className="py-1 hover:text-[#2563EB]">
          Panel
        </Link>
        <Link href="/admin/verifications" className="py-1 hover:text-[#2563EB]">
          Verificaciones
        </Link>
        <Link href="/admin/audit" className="py-1 hover:text-[#2563EB]">
          Auditoría
        </Link>
        <Link href="/admin/arco" className="py-1 hover:text-[#2563EB]">
          ARCO
        </Link>
      </div>

      <main className="w-full max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-12 py-8">
        {children}
      </main>
    </div>
  );
}
