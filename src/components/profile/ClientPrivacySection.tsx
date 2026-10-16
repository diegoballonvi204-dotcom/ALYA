"use client";

import React, { useState } from "react";
import { ShieldCheck, Lock, ExternalLink, Download } from "lucide-react";
import { ArcoPortalModal } from "@/components/profile/ArcoPortalModal";

interface ClientPrivacySectionProps {
  userName: string;
  userEmail: string;
}

export function ClientPrivacySection({
  userName,
  userEmail,
}: ClientPrivacySectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-serif text-[#0F172A]">
                Privacidad & Derechos ARCO (Ley N.° 29733)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-lg mt-0.5">
                Ejerce tus derechos de Acceso, Rectificación, Cancelación y Oposición sobre tus datos y expedientes legales conforme a la normativa peruana.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-[#2563EB] font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Ejercer Derechos ARCO</span>
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
          <span>
            Tus datos están protegidos bajo secreto profesional del Código de Ética de los Colegios de Abogados del Perú.
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Autoridad Nacional de Protección de Datos Personales
          </span>
        </div>
      </div>

      <ArcoPortalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userDefaultName={userName}
        userDefaultEmail={userEmail}
      />
    </>
  );
}
