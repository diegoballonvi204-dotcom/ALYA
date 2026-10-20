"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Briefcase, Calendar, MessageSquare, LogOut, LogIn, UserPlus, FolderKanban, ShieldCheck, CreditCard, Scale } from "lucide-react";
import { logoutAction } from "@/actions/auth.actions";

interface MobileNavProps {
  user: { email?: string | null } | null;
  role: string | null;
  fullName: string | null;
}

export function MobileNav({ user, role, fullName }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const normalizedRole = (role || "client").toLowerCase();

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-[#0F172A] shadow-xs backdrop-blur-sm hover:border-[#2563EB] transition-all"
        aria-label="Abrir menú"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen && (
        <div className="mobile-nav-panel fixed inset-x-0 top-18 z-50 border-b border-slate-200 bg-white px-5 py-6 shadow-2xl transition-all">
          <nav className="mobile-nav-content flex flex-col gap-2.5 text-base font-semibold text-slate-800">
            {/* 1. Public Links when not authenticated */}
            {!user ? (
              <>
                <Link
                  href="/abogados"
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link mobile-link-highlight px-3.5 py-2.5 rounded-xl font-bold transition-all flex items-center"
                >
                  Directorio de Abogados
                </Link>
                <Link
                  href="/#como-funciona"
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link px-3.5 py-2.5 rounded-xl transition-all flex items-center"
                >
                  ¿Cómo funciona?
                </Link>
                <Link
                  href="/#especialidades"
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link px-3.5 py-2.5 rounded-xl transition-all flex items-center"
                >
                  Especialidades
                </Link>
                <Link
                  href="/#matching"
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link px-3.5 py-2.5 rounded-xl transition-all flex items-center"
                >
                  Matching Inteligente
                </Link>
                <Link
                  href="/#para-abogados"
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link px-3.5 py-2.5 rounded-xl transition-all flex items-center"
                >
                  Para Abogados
                </Link>
                <Link
                  href="/#seguridad"
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link px-3.5 py-2.5 rounded-xl transition-all flex items-center"
                >
                  Seguridad & Privacidad
                </Link>
              </>
            ) : normalizedRole === "admin" || normalizedRole === "verifier" ? (
              /* 2. Admin role options */
              <>
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link px-3.5 py-2.5 rounded-xl transition-all flex items-center"
                >
                  Panel General
                </Link>
                <Link
                  href="/admin/verifications"
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link px-3.5 py-2.5 rounded-xl transition-all flex items-center"
                >
                  Verificaciones
                </Link>
                <Link
                  href="/admin/subscriptions"
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link px-3.5 py-2.5 rounded-xl transition-all flex items-center"
                >
                  Suscripciones
                </Link>
                <Link
                  href="/admin/audit"
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link px-3.5 py-2.5 rounded-xl transition-all flex items-center"
                >
                  Auditoría Forense
                </Link>
                <Link
                  href="/admin/arco"
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link px-3.5 py-2.5 rounded-xl transition-all flex items-center"
                >
                  Privacidad ARCO
                </Link>
              </>
            ) : normalizedRole === "lawyer" ? (
              /* 3. Lawyer role options */
              <>
                <Link
                  href="/lawyer/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all"
                >
                  <Briefcase className="w-4 h-4 text-[#2563EB]" />
                  <span>Casos Compatibles</span>
                </Link>
                <Link
                  href="/lawyer/schedule"
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all"
                >
                  <Calendar className="w-4 h-4 text-[#2563EB]" />
                  <span>Mi Agenda</span>
                </Link>
                <Link
                  href="/chat"
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-[#2563EB]" />
                  <span>Mensajes</span>
                </Link>
                <Link
                  href="/lawyer/subscription"
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all"
                >
                  <CreditCard className="w-4 h-4 text-[#2563EB]" />
                  <span>Mi Plan</span>
                </Link>
                <Link
                  href="/lawyer/verification"
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                  <span>Mi Colegiatura</span>
                </Link>
              </>
            ) : (
              /* 4. Client role options */
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all"
                >
                  <FolderKanban className="w-4 h-4 text-[#2563EB]" />
                  <span>Mis Casos</span>
                </Link>
                <Link
                  href="/abogados"
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all"
                >
                  <Scale className="w-4 h-4 text-[#2563EB]" />
                  <span>Directorio Legal</span>
                </Link>
                <Link
                  href="/chat"
                  onClick={() => setIsOpen(false)}
                  className="mobile-nav-link flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-[#2563EB]" />
                  <span>Mensajes</span>
                </Link>
              </>
            )}

            <div className="my-2 border-t border-[#E6EAF0] pt-4 mobile-divider">
              {user ? (
                <div className="flex flex-col gap-3">
                  <Link
                    href={
                      normalizedRole === "lawyer"
                        ? "/lawyer/profile"
                        : normalizedRole === "admin" || normalizedRole === "verifier"
                        ? "/admin"
                        : "/profile"
                    }
                    onClick={() => setIsOpen(false)}
                    className="mobile-user-card flex items-center gap-3 rounded-xl bg-[#F7F8FC] p-3 border border-[#E6EAF0] shadow-xs hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#101828] text-white font-bold text-xs">
                      {fullName ? fullName.charAt(0) : "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#101828] truncate">{fullName || user.email}</p>
                      <p className="text-[10px] text-[#3157D5] uppercase tracking-wider font-mono font-bold">
                        {role} • Ver Perfil
                      </p>
                    </div>
                  </Link>

                  <form action={logoutAction} className="pt-2">
                    <button
                      type="submit"
                      className="mobile-btn-logout flex w-full items-center justify-center gap-2 rounded-xl border border-[#E6EAF0] bg-white py-2.5 text-xs font-bold text-[#667085] hover:bg-slate-100 hover:text-[#101828] transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="mobile-btn-login flex items-center justify-center gap-2 rounded-xl border border-[#E6EAF0] bg-white py-3 text-sm font-semibold text-[#101828] shadow-xs hover:border-[#3157D5] transition-all"
                  >
                    <LogIn className="w-4 h-4 text-[#3157D5]" />
                    <span>Iniciar sesión</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="mobile-btn-register flex items-center justify-center gap-2 rounded-xl bg-[#101828] py-3 text-sm font-bold text-white shadow-md shadow-slate-900/10 transition-all"
                  >
                    <UserPlus className="w-4 h-4 text-blue-400" />
                    <span>Crear cuenta gratis</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
