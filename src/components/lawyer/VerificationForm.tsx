"use client";

import { useState } from "react";
import DocumentUploader from "./DocumentUploader";
import { submitLawyerDocumentsAction } from "@/actions/verification.actions";
import { ShieldCheck, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface VerificationFormProps {
  lawyerId: string;
  userId: string;
  existingDocs?: {
    dni_front?: string;
    dni_back?: string;
    bar_card?: string;
    habilitation_cert?: string;
  } | null;
  status: string;
  rejectionReason?: string | null;
}

export default function VerificationForm({
  lawyerId,
  userId,
  existingDocs,
  status,
  rejectionReason,
}: VerificationFormProps) {
  const router = useRouter();

  const [dniFront, setDniFront] = useState(existingDocs?.dni_front || "");
  const [dniBack, setDniBack] = useState(existingDocs?.dni_back || "");
  const [barCard, setBarCard] = useState(existingDocs?.bar_card || "");
  const [habilitation, setHabilitation] = useState(
    existingDocs?.habilitation_cert || ""
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!dniFront || !dniBack || !barCard) {
      setErrorMsg("Debes adjuntar el anverso/reverso del DNI y tu Carné de Colegiatura.");
      return;
    }

    setLoading(true);

    try {
      const res = await submitLawyerDocumentsAction({
        lawyerId,
        dniFrontPath: dniFront,
        dniBackPath: dniBack,
        barCardPath: barCard,
        habilitationCertPath: habilitation || null,
      });

      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(
          "¡Documentación enviada con éxito! Tu expediente ha ingresado a la cola de validación con el Colegio de Abogados."
        );
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al enviar la verificación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Alert if observed or rejected */}
      {status === "observed" && (
        <div className="rounded-2xl border border-slate-300 bg-slate-100 p-5 text-slate-800 space-y-1">
          <div className="flex items-center gap-2 font-bold text-[#0F172A] text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-slate-700" />
            Expediente Observado por Moderación
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {rejectionReason ||
              "Se detectaron observaciones en tu documentación. Por favor actualiza los archivos indicados para proceder con la habilitación."}
          </p>
        </div>
      )}

      {status === "verified" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-emerald-900 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600" />
          <div className="text-xs">
            <strong className="block text-sm font-bold text-[#0F172A]">
              Colegiatura Verificada y Habilitada
            </strong>
            Tu condición profesional se encuentra validada ante el Colegio de Abogados. Tu perfil luce la insignia oficial de verificación.
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-slate-50 p-3.5 text-xs text-[#0F172A] shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-slate-700" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Grid of Uploaders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DocumentUploader
          label="1. DNI — Anverso (Frontal) *"
          description="Fotografía o escaneo nítido del lado frontal de tu DNI."
          docKey="dni_front"
          userId={userId}
          onUploaded={setDniFront}
          existingPath={dniFront}
        />

        <DocumentUploader
          label="2. DNI — Reverso (Posterior) *"
          description="Fotografía o escaneo del lado posterior de tu DNI."
          docKey="dni_back"
          userId={userId}
          onUploaded={setDniBack}
          existingPath={dniBack}
        />

        <DocumentUploader
          label="3. Carné de Colegiatura Oficial *"
          description="Carné emitido por tu Colegio de Abogados (CAL, CAC, CALM, etc.)."
          docKey="bar_card"
          userId={userId}
          onUploaded={setBarCard}
          existingPath={barCard}
        />

        <DocumentUploader
          label="4. Constancia de Habilitación (Opcional)"
          description="Certificado de habilitación vigente para agilizar el proceso."
          docKey="habilitation_cert"
          userId={userId}
          onUploaded={setHabilitation}
          existingPath={habilitation}
        />
      </div>

      {/* Submit Button */}
      {status !== "verified" && (
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-8 py-3.5 text-xs font-bold text-white transition-all shadow-md shadow-slate-900/10 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Enviando expediente...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-blue-400" />
                <span>Enviar Documentos para Verificación</span>
              </>
            )}
          </button>
        </div>
      )}
    </form>
  );
}
