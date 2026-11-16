"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Send, FileCheck2 } from "lucide-react";

export function ComplaintsBookForm() {
  const [fullName, setFullName] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [recordType, setRecordType] = useState<"reclamo" | "queja">("reclamo");
  const [serviceType, setServiceType] = useState("Plataforma Digital / Suscripción");
  const [amountClaimed, setAmountClaimed] = useState("");
  const [detail, setDetail] = useState("");
  const [requestSolution, setRequestSolution] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!/^\d{8}$/.test(dni)) {
      setErrorMsg("Ingresa un DNI peruano válido de 8 dígitos numéricos.");
      return;
    }
    if (detail.trim().length < 20) {
      setErrorMsg("Describe el detalle del reclamo o queja con al menos 20 caracteres.");
      return;
    }

    const code = `LR-ALYA-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    setSubmittedCode(code);
  };

  if (submittedCode) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold font-mono text-emerald-800">
          Hoja de Reclamación N.° {submittedCode}
        </span>
        <h2 className="text-2xl font-bold text-[#0F172A] font-serif">
          Reclamación Registrada Conforme a Ley
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          Hemos registrado tu {recordType} a nombre de <strong>{fullName}</strong> (DNI {dni}). Conforme al D.S. N.° 011-2011-PCM y modificatorias, el plazo máximo de respuesta es de <strong>15 días hábiles improrrogables</strong> al correo <strong>{email}</strong>.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmittedCode(null);
            setDetail("");
            setRequestSolution("");
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white cursor-pointer"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Registrar otra hoja</span>
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6"
    >
      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Identificación del Consumidor */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 font-mono border-b border-slate-100 pb-2">
          1. Identificación del Consumidor Reclamante
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="lr-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Nombres y Apellidos Completos *
            </label>
            <input
              id="lr-name"
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej: María Elena Torres Vargas"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="lr-dni" className="block text-xs font-semibold text-slate-700 mb-1">
              DNI (8 dígitos numéricos) *
            </label>
            <input
              id="lr-dni"
              type="text"
              inputMode="numeric"
              pattern="\d{8}"
              maxLength={8}
              required
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="12345678"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="lr-email" className="block text-xs font-semibold text-slate-700 mb-1">
              Correo Electrónico *
            </label>
            <input
              id="lr-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@correo.pe"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="lr-phone" className="block text-xs font-semibold text-slate-700 mb-1">
              Teléfono / Celular *
            </label>
            <input
              id="lr-phone"
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="999 888 777"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="lr-address" className="block text-xs font-semibold text-slate-700 mb-1">
              Domicilio (Distrito / Ciudad) *
            </label>
            <input
              id="lr-address"
              type="text"
              required
              autoComplete="street-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: Av. Arequipa 1200, Lima"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Detalle del Servicio y Reclamación */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 font-mono border-b border-slate-100 pb-2">
          2. Identificación del Bien / Servicio y Detalle
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="lr-type" className="block text-xs font-semibold text-slate-700 mb-1">
              Tipo de Registro *
            </label>
            <select
              id="lr-type"
              value={recordType}
              onChange={(e) => setRecordType(e.target.value as "reclamo" | "queja")}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="reclamo">Reclamo (Disconformidad con el servicio)</option>
              <option value="queja">Queja (Malestar por atención)</option>
            </select>
          </div>

          <div>
            <label htmlFor="lr-service" className="block text-xs font-semibold text-slate-700 mb-1">
              Servicio Relacionado *
            </label>
            <select
              id="lr-service"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="Plataforma Digital / Suscripción">Plataforma Digital / Suscripción</option>
              <option value="Custodia de Honorarios / Pago">Custodia de Honorarios / Pago</option>
              <option value="Soporte y Atención al Usuario">Soporte y Atención al Usuario</option>
            </select>
          </div>

          <div>
            <label htmlFor="lr-amount" className="block text-xs font-semibold text-slate-700 mb-1">
              Monto Reclamado (S/, opcional)
            </label>
            <input
              id="lr-amount"
              type="text"
              value={amountClaimed}
              onChange={(e) => setAmountClaimed(e.target.value)}
              placeholder="Ej: 150.00"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="lr-detail" className="block text-xs font-semibold text-slate-700 mb-1">
            Detalle del Reclamo o Queja *
          </label>
          <textarea
            id="lr-detail"
            rows={4}
            required
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Describe detalladamente los hechos ocurridos, fechas y número de operación si aplica..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="lr-solution" className="block text-xs font-semibold text-slate-700 mb-1">
            Pedido Concreto del Consumidor *
          </label>
          <textarea
            id="lr-solution"
            rows={2}
            required
            value={requestSolution}
            onChange={(e) => setRequestSolution(e.target.value)}
            placeholder="¿Qué solución o acción solicitas?"
            className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl">
          <strong>Nota INDECOPI:</strong> La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante INDECOPI.
        </p>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 px-6 py-3 text-xs font-bold text-white shadow-md cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4 text-blue-400" />
          <span>Registrar Hoja de Reclamación</span>
        </button>
      </div>
    </form>
  );
}

