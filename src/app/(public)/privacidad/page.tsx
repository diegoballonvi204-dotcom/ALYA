import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Database,
  UserCheck,
  FileText,
  Scale,
  ArrowRight,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-12 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-widest text-[#2563EB] px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 font-mono">
          Marco Regulatorio Peruano • Ley N.° 29733
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight font-serif">
          Política de Protección de Datos Personales
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
          En cumplimiento de la Ley N.° 29733, Ley de Protección de Datos
          Personales, y su Reglamento aprobado por D.S. N.° 003-2013-JUS,
          ALYA LegalTech Perú S.A.C. informa a sus usuarios sobre el tratamiento y
          resguardo de su información.
        </p>
      </div>

      {/* ARCO CTA Banner */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs">
        <div>
          <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider font-mono">
            Tus Derechos como Titular
          </span>
          <h3 className="text-xl font-bold text-[#0F172A] mt-0.5 font-serif">
            ¿Deseas ejercer tus Derechos ARCO?
          </h3>
          <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
            Puedes solicitar formalmente el Acceso, Rectificación, Cancelación u
            Oposición de tus datos personales a través de nuestro portal oficial
            gratuito con plazos de ley garantizados.
          </p>
        </div>

        <Link
          href="/privacidad/arco"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-6 py-3 text-xs font-bold text-white shadow-md shadow-slate-900/10 shrink-0 transition-all hover:shadow-lg hover:-translate-y-0.5"
        >
          <span>Portal de Derechos ARCO</span>
          <ArrowRight className="w-4 h-4 text-blue-400" />
        </Link>
      </div>

      {/* Structured Sections */}
      <div className="space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
        {/* 1. Bancos de Datos Inscritos */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-base font-bold text-[#0F172A] font-serif">
            <Database className="w-5 h-5 text-[#2563EB]" />
            <h2>1. Bancos de Datos Personales Registrados</h2>
          </div>
          <p className="text-slate-500 text-xs">
            ALYA LegalTech Perú S.A.C., con domicilio en Lima, Perú, declara que los
            datos personales recopilados se incorporan en los siguientes bancos
            de datos ante la Autoridad Nacional de Protección de Datos Personales
            (ANPDP):
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <li className="p-4 rounded-xl bg-slate-50/70 border border-slate-200">
              <span className="font-bold text-[#0F172A] block mb-1">
                Banco: Usuarios y Clientes
              </span>
              Finalidad: Registro, autenticación, publicación de consultas y
              matching con abogados colegiados.
            </li>
            <li className="p-4 rounded-xl bg-slate-50/70 border border-slate-200">
              <span className="font-bold text-[#0F172A] block mb-1">
                Banco: Abogados Colegiados
              </span>
              Finalidad: Verificación de habilitación profesional en colegios de
              abogados (CAL, CAA, etc.) y gestión de honorarios.
            </li>
            <li className="p-4 rounded-xl bg-slate-50/70 border border-slate-200">
              <span className="font-bold text-[#0F172A] block mb-1">
                Banco: Expedientes y Consultas
              </span>
              Finalidad: Bóveda documental cifrada, agendamiento de citas y
              mensajería confidencial.
            </li>
          </ul>
        </section>

        {/* 2. Tratamiento de Datos Sensibles y Secreto Profesional */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-base font-bold text-[#0F172A] font-serif">
            <Lock className="w-5 h-5 text-emerald-600" />
            <h2>2. Tratamiento de Datos Sensibles y Secreto Profesional</h2>
          </div>
          <p>
            Reconocemos que las controversias jurídicas pueden involucrar
            categorías especiales o datos sensibles (afectaciones laborales,
            procesos penales, filiación o patrimonio familiar). Al publicar un
            caso, el usuario otorga su consentimiento previo, libre, informado y
            expreso para que su relato fáctico sea analizado exclusivamente con
            fines de compatibilidad jurídica.
          </p>
          <p className="text-slate-500 text-xs">
            Las comunicaciones entre el cliente y el abogado colegiado a través
            del chat seguro y la bóveda documental están amparadas por el secreto
            profesional legal (Art. 2 inc. 18 de la Constitución Política del
            Perú y Código de Ética del Abogado).
          </p>
        </section>

        {/* 3. Medidas de Seguridad Técnicas y Organizativas */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-base font-bold text-[#0F172A] font-serif">
            <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
            <h2>3. Medidas de Seguridad y Encriptación</h2>
          </div>
          <p>
            Implementamos estrictas medidas técnicas y organizativas para
            garantizar la seguridad de los datos personales:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-2">
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200">
              <span className="font-semibold text-[#0F172A] block mb-0.5">
                • Cifrado y URLs Firmadas Temporales:
              </span>
              Los documentos del caso nunca son públicos; se descargan únicamente
              mediante tokens firmados con caducidad de 1 hora.
            </div>
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200">
              <span className="font-semibold text-[#0F172A] block mb-0.5">
                • Aislamiento Multi-Tenant (RLS):
              </span>
              Políticas a nivel de fila en PostgreSQL aseguran que ningún usuario
              ajeno al match bilateral pueda interceptar mensajes o expedientes.
            </div>
          </div>
        </section>

        {/* 4. Enmascaramiento de Identidad Pre-Match */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-base font-bold text-[#0F172A] font-serif">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <h2>4. Principio de Minimización y Enmascaramiento Pre-Match</h2>
          </div>
          <p>
            En estricto cumplimiento del principio de proporcionalidad, los
            abogados en el feed de casos compatibles solo visualizan la materia,
            descripción de los hechos, ciudad y urgencia. Los nombres completos,
            números de teléfono y correos electrónicos del consultante se
            mantienen cifrados hasta que ambas partes expresen mutuo interés y se
            consolide el match bilateral.
          </p>
        </section>

        {/* 5. Plazos de Atención y Procedimiento ARCO */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-base font-bold text-[#0F172A] font-serif">
            <Scale className="w-5 h-5 text-[#2563EB]" />
            <h2>5. Procedimiento y Plazos de Atención de Derechos ARCO</h2>
          </div>
          <p>
            Toda solicitud presentada ante el portal de Derechos ARCO será
            atendida sin costo alguno dentro de los plazos improrrogables
            establecidos en el D.S. N.° 003-2013-JUS:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-500">
            <li>
              <strong className="text-slate-800">Derecho de Acceso:</strong>{" "}
              Máximo 20 días hábiles desde la radicación de la solicitud.
            </li>
            <li>
              <strong className="text-slate-800">
                Derechos de Rectificación, Cancelación y Oposición:
              </strong>{" "}
              Máximo 10 días hábiles.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
