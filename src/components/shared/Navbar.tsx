import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Scale, LogOut, ShieldCheck, Briefcase, LogIn, UserPlus, FilePlus2, MessageSquare, Calendar, FolderKanban } from "lucide-react";
import { logoutAction } from "@/actions/auth.actions";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { MobileNav } from "./MobileNav";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  let fullName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, first_name, last_name")
      .eq("id", user.id)
      .single();

    role = profile?.role || "client";
    fullName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : (user.email ?? null);
  }

  const normalizedRole = (role || "client").toLowerCase();
  const homeHref = !user
    ? "/"
    : normalizedRole === "admin" || normalizedRole === "verifier"
    ? "/admin"
    : normalizedRole === "lawyer"
    ? "/lawyer/dashboard"
    : "/dashboard";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all shadow-xs">
      <div className="mx-auto flex h-18 w-full max-w-[1700px] items-center justify-between px-6 sm:px-10 lg:px-12">
        {/* Brand Logo */}
        <Link
          href={homeHref}
          className="flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-95 group shrink-0 py-1"
          aria-label="ALYA Inicio"
        >
          <Image
            src="/logoAlya.png"
            alt="ALYA LegalTech"
            width={160}
            height={48}
            priority
            className="h-11 sm:h-12 w-auto object-contain drop-shadow-2xs"
          />
        </Link>

        {/* Center Desktop Navigation - DYNAMIC ACCORDING TO USER ROLE */}
        <nav className="hidden md:flex items-center gap-7 text-[13px] font-semibold text-slate-600">
          {/* 1. Unauthenticated (Landing mode) */}
          {!user ? (
            <>
              <Link href="/#como-funciona" className="hover:text-[#2563EB] transition-colors">
                ¿Cómo funciona?
              </Link>
              <Link href="/#especialidades" className="hover:text-[#2563EB] transition-colors">
                Especialidades
              </Link>
              <Link href="/#matching" className="hover:text-[#2563EB] transition-colors">
                Matching Inteligente
              </Link>
              <Link href="/#para-abogados" className="hover:text-[#2563EB] transition-colors">
                Para Abogados
              </Link>
              <Link href="/#seguridad" className="hover:text-[#2563EB] transition-colors">
                Seguridad & Privacidad
              </Link>
            </>
          ) : normalizedRole === "admin" || normalizedRole === "verifier" ? (
            /* 2. Admin / Verifier options */
            <>
              <Link href="/admin" className="hover:text-[#2563EB] transition-colors">
                Panel General
              </Link>
              <Link href="/admin/verifications" className="hover:text-[#2563EB] transition-colors">
                Verificaciones
              </Link>
              <Link href="/admin/audit" className="hover:text-[#2563EB] transition-colors">
                Auditoría Forense
              </Link>
              <Link href="/admin/arco" className="hover:text-[#2563EB] transition-colors">
                Privacidad ARCO
              </Link>
            </>
          ) : normalizedRole === "lawyer" ? (
            /* 3. Lawyer Authenticated */
            <>
              <Link href="/lawyer/dashboard" className="flex items-center gap-1.5 hover:text-[#2563EB] transition-colors">
                <Briefcase className="w-4 h-4 text-[#2563EB]" />
                <span>Casos Compatibles</span>
              </Link>
              <Link href="/lawyer/schedule" className="flex items-center gap-1.5 hover:text-[#2563EB] transition-colors">
                <Calendar className="w-4 h-4 text-[#2563EB]" />
                <span>Mi Agenda</span>
              </Link>
              <Link href="/chat" className="flex items-center gap-1.5 hover:text-[#2563EB] transition-colors">
                <MessageSquare className="w-4 h-4 text-[#2563EB]" />
                <span>Mensajes</span>
              </Link>
              <Link href="/lawyer/verification" className="flex items-center gap-1.5 hover:text-[#2563EB] transition-colors">
                <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                <span>Mi Colegiatura</span>
              </Link>
            </>
          ) : (
            /* 4. Client Authenticated (Default for any authenticated user) */
            <>
              <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-[#2563EB] transition-colors">
                <FolderKanban className="w-4 h-4 text-[#2563EB]" />
                <span>Mis Casos</span>
              </Link>
              <Link href="/cases/new" className="flex items-center gap-1.5 hover:text-[#2563EB] transition-colors">
                <FilePlus2 className="w-4 h-4 text-[#2563EB]" />
                <span>Publicar Consulta</span>
              </Link>
              <Link href="/chat" className="flex items-center gap-1.5 hover:text-[#2563EB] transition-colors">
                <MessageSquare className="w-4 h-4 text-[#2563EB]" />
                <span>Mensajes</span>
              </Link>
            </>
          )}
        </nav>

        {/* Right CTA / Auth Status */}
        <div className="hidden md:flex items-center gap-3.5 shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link
                href={
                  normalizedRole === "lawyer"
                    ? "/lawyer/profile"
                    : normalizedRole === "admin" || normalizedRole === "verifier"
                    ? "/admin"
                    : "/profile"
                }
                className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 px-3 py-1.5 text-xs text-[#0F172A] shadow-xs transition-colors cursor-pointer group"
                title="Ver y editar mi perfil"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0F172A] text-white text-[10px] font-bold group-hover:bg-blue-600 transition-colors">
                  {fullName ? fullName.charAt(0) : "U"}
                </div>
                <span className="max-w-[130px] truncate font-bold">{fullName || user.email}</span>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700 uppercase font-mono border border-blue-200">
                  {role}
                </span>
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 shadow-xs transition-all"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-xl border border-slate-300/90 bg-white px-4 py-2 text-[13px] font-semibold text-[#0F172A] shadow-sm hover:border-[#2563EB] hover:bg-slate-50 hover:text-[#2563EB] hover:-translate-y-0.5 transition-all"
              >
                <LogIn className="h-4 w-4 text-[#2563EB] transition-transform group-hover:scale-110" />
                <span>Iniciar sesión</span>
              </Link>
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-[#0F172A] px-4.5 py-2 text-[13px] font-bold text-white shadow-md shadow-[#0F172A]/15 hover:bg-[#1E293B] hover:-translate-y-0.5 hover:shadow-lg transition-all border border-slate-800"
              >
                <UserPlus className="h-4 w-4 text-blue-400 transition-transform group-hover:scale-110" />
                <span>Crear cuenta</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <MobileNav user={user} role={role} fullName={fullName} />
      </div>
    </header>
  );
}
