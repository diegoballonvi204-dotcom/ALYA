"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, Briefcase, Calendar, MessageSquare, User, LogOut, LogIn, UserPlus, FolderKanban, FilePlus2, ShieldCheck } from "lucide-react";
import { logoutAction } from "@/actions/auth.actions";

interface MobileNavProps {
  user: any;
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
        <div className="fixed inset-x-0 top-16 z-50 border-b border-slate-200 bg-white/98 px-5 py-6 shadow-2xl backdrop-blur-xl transition-all">
          <nav className="flex flex-col gap-3 text-base font-semibold text-slate-700">
            {/* 1. Public Links when not authenticated */}
            {!user ? (
              <>
                <Link
                  href="/#como-funciona"
                  onClick={() => setIsOpen(false)}
                  className="py-2 hover:text-[#2563EB] transition-colors"
                >
                  ¿Cómo funciona?
                </Link>
                <Link
                  href="/#especialidades"
                  onClick={() => setIsOpen(false)}
                  className="py-2 hover:text-[#2563EB] transition-colors"
                >
                  Especialidades
                </Link>
                <Link
                  href="/#matching"
                  onClick={() => setIsOpen(false)}
                  className="py-2 hover:text-[#2563EB] transition-colors"
                >
                  Matching Inteligente
                </Link>
                <Link
                  href="/#para-abogados"
                  onClick={() => setIsOpen(false)}
                  className="py-2 hover:text-[#2563EB] transition-colors"
                >
                  Para Abogados
                </Link>
                <Link
                  href="/#seguridad"
                  onClick={() => setIsOpen(false)}
                  className="py-2 hover:text-[#2563EB] transition-colors"
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
                  className="py-2 hover:text-[#2563EB] transition-colors"
                >
                  Panel General
                </Link>
                <Link
                  href="/admin/verifications"
                  onClick={() => setIsOpen(false)}
                  className="py-2 hover:text-[#2563EB] transition-colors"
                >
                  Verificaciones
                </Link>
                <Link
                  href="/admin/audit"
                  onClick={() => setIsOpen(false)}
                  className="py-2 hover:text-[#2563EB] transition-colors"
                >
                  Auditoría Forense
                </Link>
                <Link
                  href="/admin/arco"
                  onClick={() => setIsOpen(false)}
                  className="py-2 hover:text-[#2563EB] transition-colors"
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
                  className="flex items-center gap-2 py-2 hover:text-[#2563EB] transition-colors"
                >
                  <Briefcase className="w-4 h-4 text-[#2563EB]" />
                  <span>Casos Compatibles</span>
                </Link>
                <Link
                  href="/lawyer/schedule"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 py-2 hover:text-[#2563EB] transition-colors"
                >
                  <Calendar className="w-4 h-4 text-[#2563EB]" />
                  <span>Mi Agenda</span>
                </Link>
                <Link
                  href="/chat"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 py-2 hover:text-[#2563EB] transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-[#2563EB]" />
                  <span>Mensajes</span>
                </Link>
                <Link
                  href="/lawyer/verification"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 py-2 hover:text-[#2563EB] transition-colors"
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
                  className="flex items-center gap-2 py-2 hover:text-[#2563EB] transition-colors"
                >
                  <FolderKanban className="w-4 h-4 text-[#2563EB]" />
                  <span>Mis Casos</span>
                </Link>
                <Link
                  href="/cases/new"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 py-2 hover:text-[#2563EB] transition-colors"
                >
                  <FilePlus2 className="w-4 h-4 text-[#2563EB]" />
                  <span>Publicar Consulta</span>
                </Link>
                <Link
                  href="/chat"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 py-2 hover:text-[#2563EB] transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-[#2563EB]" />
                  <span>Mensajes</span>
                </Link>
              </>
            )}

            <div className="my-2 border-t border-slate-200/80 pt-4">
              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200/80 shadow-xs">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0F172A] text-white font-bold text-xs">
                      {fullName ? fullName.charAt(0) : "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#0F172A] truncate">{fullName || user.email}</p>
                      <p className="text-[10px] text-blue-600 uppercase tracking-wider font-mono font-bold">{role}</p>
                    </div>
                  </div>

                  <form action={logoutAction} className="pt-2">
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
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
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-[#0F172A] shadow-sm hover:border-[#2563EB]"
                  >
                    <LogIn className="w-4 h-4 text-[#2563EB]" />
                    <span>Iniciar sesión</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#0F172A] py-3 text-sm font-bold text-white shadow-md shadow-slate-900/20 border border-slate-800"
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
