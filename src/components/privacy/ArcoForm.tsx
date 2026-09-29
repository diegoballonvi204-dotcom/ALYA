"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Search,
  Edit3,
  Trash2,
  Ban,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  FileText,
  Lock,
} from "lucide-react";
import { submitArcoRequestAction } from "@/actions/arco.actions";

interface ArcoFormProps {
  initialRequests?: any[];
  userEmail?: string;
  userName?: string;
}

const ARCO_TYPES = [
  {
    type: "access" as const,
    title: "Acceso",
    icon: Search,
    color: "border-blue-200 bg-blue-50 text-[#2563EB]",
    badge: "Plazo legal: 20 días hábiles",
    desc: "Conocer qué datos personales tuyos obran en las bases de datos de ALYA Perú, con qué finalidad fueron recopilados y a quiénes fueron transferidos.",
  },
  {
    type: "rectification" as const,
    title: "Rectificación",
    icon: Edit3,
    color: "border-slate-200 bg-slate-100 text-slate-800",
    badge: "Plazo legal: 10 días hábiles",
    desc: "Actualizar, corregir o completar cualquier dato personal que resulte inexacto, erróneo o incompleto.",
  },
  {
    type: "cancellation" as const,
    title: "Cancelación",
    icon: Trash2,
    color: "border-slate-300 bg-slate-50 text-slate-700",
    badge: "Plazo legal: 10 días hábiles",
    desc: "Solicitar la supresión de tus datos personales cuando hayan dejado de ser necesarios o pertinentes para la finalidad de la plataforma.",
  },
  {
    type: "opposition" as const,
    title: "Oposición",
    icon: Ban,
    color: "border-indigo-200 bg-indigo-50 text-indigo-700",
    badge: "Plazo legal: 10 días hábiles",
    desc: "Oponerte al tratamiento de tus datos para finalidades específicas fundada en motivos legítimos y fundados.",
  },
];

export function ArcoForm({
  initialRequests = [],
  userEmail = "",
  userName = "",
}: ArcoFormProps) {
  const [requests, setRequests] = useState<any[]>(initialRequests);
  const [selectedType, setSelectedType] = useState<
    "access" | "rectification" | "cancellation" | "opposition"
  >("access");
  const [requesterName, setRequesterName] = useState(userName);
  const [requesterDni, setRequesterDni] = useState("");
  const [requesterEmail, setRequesterEmail] = useState(userEmail);
  const [justification, setJustification] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!requesterDni || !/^\d{8}$/.test(requesterDni.trim())) {
      setErrorMsg("Ingresa un número de DNI peruano válido de 8 dígitos.");
      return;
    }

    if (!justification.trim() || justification.trim().length < 20) {
      setErrorMsg("Fundamenta tu solicitud con al menos 20 caracteres.");
      return;
    }

    setIsSubmitting(true);

    const res = await submitArcoRequestAction({
      requesterName,
      requesterDni,
      requesterEmail,
      requestType: selectedType,
      justification,
    });

    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg(
        "Tu solicitud de derechos ARCO ha sido radicada formalmente ante nuestro Oficial de Privacidad. Recibirás respuesta formal en tu correo."
      );
      if (res.request) {
        setRequests((prev) => [res.request, ...prev]);
      }
      setJustification("");
    }
  };

  return (
    <div className="space-y-10">
      {/* 1. Selector de Tipo de Derecho ARCO */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          1. Selecciona el Derecho que deseas ejercer (Ley N.° 29733)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ARCO_TYPES.map((t) => {
            const isSelected = selectedType === t.type;
            const Icon = t.icon;

            return (
              <div
                key={t.type}
                onClick={() => setSelectedType(t.type)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-blue-50/60 border-[#2563EB] ring-2 ring-blue-500/20 shadow-md"
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center ${t.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {t.badge}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#0F172A] mb-1">
                    Derecho de {t.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {t.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span
                    className={`font-semibold ${
                      isSelected ? "text-[#2563EB]" : "text-slate-400"
                    }`}
                  >
                    {isSelected ? "Seleccionado ✓" : "Seleccionar"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Formulario de Radicación de Solicitud */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm">
        <div className="pb-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
              <span>Formulario Oficial de Solicitud ARCO</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Conforme al Art. 19 de la Ley N.° 29733 y el D.S. 003-2013-JUS
              (Reglamento de la Ley de Protección de Datos Personales).
            </p>
          </div>
        </div>

        {successMsg ? (
          <div className="py-10 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-[#0F172A]">
              Solicitud ARCO Registrada
            </h4>
            <p className="text-xs text-slate-500 max-w-md">{successMsg}</p>
            <button
              onClick={() => setSuccessMsg(null)}
              className="mt-4 px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
            >
              Registrar otra solicitud
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nombre Completo del Titular *
                </label>
                <input
                  type="text"
                  required
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  placeholder="Nombres y Apellidos"
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  DNI (8 dígitos) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={requesterDni}
                  onChange={(e) => setRequesterDni(e.target.value.replace(/\D/g, ""))}
                  placeholder="12345678"
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-[#0F172A] placeholder-slate-400 font-mono focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Correo Electrónico de Notificación *
                </label>
                <input
                  type="email"
                  required
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  placeholder="ejemplo@correo.pe"
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Fundamentación de la Solicitud de{" "}
                <span className="text-[#2563EB] capitalize">
                  {selectedType}
                </span>{" "}
                *
              </label>
              <textarea
                required
                rows={4}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Detalla de manera precisa los datos personales objeto de la solicitud y las razones jurídicas o fácticas en que te basas..."
                className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Mínimo 20 caracteres. Tus datos serán tratados con estricta
                reserva por el Oficial de Cumplimiento.
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Trámite regulado conforme a la Ley N.° 29733</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Radicando solicitud...</span>
                  </>
                ) : (
                  <span>Enviar Solicitud ARCO</span>
                )}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 3. Bandeja de Solicitudes Previas del Usuario */}
      {requests.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Mis Solicitudes de Derechos ARCO ({requests.length})
          </h3>

          <div className="divide-y divide-slate-100">
            {requests.map((r) => {
              const dt = new Date(r.created_at).toLocaleDateString("es-PE", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const deadline = new Date(r.deadline_at).toLocaleDateString(
                "es-PE",
                { day: "numeric", month: "short", year: "numeric" }
              );

              return (
                <div
                  key={r.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-[#2563EB]">
                        Derecho de {r.request_type}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500 font-mono">
                        DNI {r.requester_dni}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          r.status === "resolved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : r.status === "rejected"
                            ? "bg-slate-100 text-slate-700 border border-slate-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {r.status === "resolved"
                          ? "Procedente / Resuelto"
                          : r.status === "rejected"
                          ? "Improcedente"
                          : "En Trámite"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 mt-1 line-clamp-1 italic">
                      &ldquo;{r.justification}&rdquo;
                    </p>

                    <p className="text-[10px] text-slate-400 mt-1">
                      Radicado: {dt} • Fecha límite legal: {deadline}
                    </p>

                    {r.resolution_notes && (
                      <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <span className="text-[#2563EB] font-bold block text-[10px] uppercase">
                          Dictamen del Oficial de Privacidad:
                        </span>
                        {r.resolution_notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
