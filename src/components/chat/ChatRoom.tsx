"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Paperclip,
  Calendar,
  FileText,
  ShieldCheck,
  Check,
  CheckCheck,
  Award,
  Download,
  Loader2,
  File,
  Star,
  Video,
  CreditCard,
  Scale,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  sendMessageAction,
  markMessagesAsReadAction,
} from "@/actions/chat.actions";
import { lawyerInteractMatchAction } from "@/actions/cases.actions";
import { getCaseFeeAgreementsAction } from "@/actions/agreements.actions";
import { CaseDocumentsDrawer } from "./CaseDocumentsDrawer";
import { ScheduleConsultationModal } from "./ScheduleConsultationModal";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import {
  ConsultationContextBanner,
  ConsultationContextData,
} from "./ConsultationContextBanner";
import { ConsultationPaymentModal } from "./ConsultationPaymentModal";
import { JitsiVideoModal } from "./JitsiVideoModal";
import { CreateFeeAgreementModal } from "./CreateFeeAgreementModal";
import { FeeAgreementCard } from "./FeeAgreementCard";
import { formatLimaTime } from "@/lib/utils";

function renderFormattedMessage(text: string) {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <span key={lineIdx} className="block">
        {parts.map((part, idx) => {
          if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
            return (
              <strong key={idx} className="font-bold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
            return (
              <code key={idx} className="px-1 py-0.5 rounded bg-black/10 font-mono text-[11px]">
                {part.slice(1, -1)}
              </code>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </span>
    );
  });
}

function isSystemEventMessage(messageText: string): boolean {
  const t = messageText.trim();
  return (
    t.startsWith("🎉") ||
    t.startsWith("📅") ||
    t.startsWith("💳") ||
    t.startsWith("✅ **Convenio") ||
    t.startsWith("⚖️ **") ||
    t.includes("Actualización de Cita Legal") ||
    t.includes("Solicitud de Cita Legal") ||
    t.includes("¡Conexión bilateral establecida!") ||
    t.includes("Pago de Honorarios en Custodia") ||
    t.includes("Pago con Tarjeta Procesado en Custodia")
  );
}

interface MessageItem {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  attachment_url: string | null;
  attachment_type: string | null;
  read_at: string | null;
  created_at: string;
}

interface ChatRoomProps {
  conversation: {
    id: string;
    matchId: string;
    caseId: string;
    isActive: boolean;
    createdAt: string;
    matchStatus?: string;
    userInterest?: boolean;
    lawyerInterest?: boolean;
  };
  caseData: {
    id: string;
    title: string;
    description: string;
    urgency: string;
    city: string;
    status: string;
    specialtyName: string;
  };
  isClient: boolean;
  currentUser: {
    id: string;
    role: "client" | "lawyer";
  };
  counterpart: {
    role: "client" | "lawyer";
    lawyerProfileId: string | null;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    barAssociation: string | null;
    barNumber: string | null;
    consultationPrice: number | null;
    ratingAverage: number | null;
    verificationStatus: string | null;
  };
  consultation?: ConsultationContextData | null;
  initialMessages: MessageItem[];
}

export function ChatRoom({
  conversation,
  caseData,
  isClient,
  currentUser,
  counterpart,
  consultation,
  initialMessages,
}: ChatRoomProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [matchStatus, setMatchStatus] = useState<string>(
    conversation.matchStatus || "matched"
  );
  const [lawyerInterested, setLawyerInterested] = useState<boolean>(
    conversation.lawyerInterest ?? true
  );
  const [isAcceptingCase, setIsAcceptingCase] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [consultationState, setConsultationState] = useState<ConsultationContextData | null>(
    consultation || null
  );
  const [hasReviewedState, setHasReviewedState] = useState(
    consultation?.hasReviewed || false
  );

  const isBilateralConfirmed =
    matchStatus === "matched" ||
    ((conversation.userInterest ?? true) && lawyerInterested);

  // Determinar si el justiciable debe abonar honorarios antes de iniciar la interacción
  const agreedPrice = Number(consultationState?.agreedPrice ?? counterpart.consultationPrice ?? 0);
  const isPaidOrFree =
    agreedPrice === 0 ||
    consultationState?.paymentStatus === "held_escrow" ||
    consultationState?.paymentStatus === "released";
  const requiresClientPayment = isClient && isBilateralConfirmed && !isPaidOrFree;
  const [hasDismissedPaymentModal, setHasDismissedPaymentModal] = useState(false);

  // Apertura automática del modal de pago si el match ya está confirmado y requiere pago
  useEffect(() => {
    if (requiresClientPayment && consultationState?.id && !hasDismissedPaymentModal) {
      setIsPaymentOpen(true);
    }
  }, [requiresClientPayment, consultationState?.id, hasDismissedPaymentModal]);

  const handleAcceptCaseFromChat = async () => {
    if (isAcceptingCase) return;
    setIsAcceptingCase(true);
    setAcceptError(null);
    try {
      const res = await lawyerInteractMatchAction({
        matchId: conversation.matchId,
        caseId: caseData.id,
        interested: true,
      });
      if (res?.error === "QUOTA_EXCEEDED") {
        setAcceptError(
          "Has alcanzado el límite de contactos de tu plan actual. Mejora tu suscripción en Mi Plan para aceptar más casos."
        );
      } else if (res?.error) {
        setAcceptError(res.error);
      } else if (res?.success) {
        setLawyerInterested(true);
        setMatchStatus("matched");
        router.refresh();
      }
    } catch {
      setAcceptError("No se pudo confirmar la atención del caso. Intenta nuevamente.");
    } finally {
      setIsAcceptingCase(false);
    }
  };

  const loadAgreements = async () => {
    const res = await getCaseFeeAgreementsAction(caseData.id);
    if (res.agreements) {
      setAgreements(res.agreements);
    }
  };

  useEffect(() => {
    loadAgreements();
  }, [caseData.id]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al final al montar o recibir nuevos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Marcar mensajes no leídos como leídos al entrar
  useEffect(() => {
    markMessagesAsReadAction(conversation.id);
  }, [conversation.id]);

  // Suscripción a Supabase Realtime para nuevos mensajes
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`chat_${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as MessageItem;
          setMessages((prev) => {
            // Evitar duplicados si ya fue agregado optimisticamente
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Si el mensaje es de la contraparte, marcarlo como leído inmediatamente
          if (newMsg.sender_id !== currentUser.id) {
            markMessagesAsReadAction(conversation.id);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const updated = payload.new as MessageItem;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id, currentUser.id]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const messageText = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);

    try {
      const res = await sendMessageAction({
        conversationId: conversation.id,
        message: messageText,
      });

      if (res.error) {
        alert(res.error);
        setInputMessage(messageText);
      }
    } catch (err: any) {
      alert("Error al enviar mensaje");
      setInputMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("El archivo no debe exceder los 15MB");
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const storagePath = `cases/${caseData.id}/${Date.now()}_${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("case-documents")
        .upload(storagePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtener URL firmada para el enlace en chat
      const { data: signed } = await supabase.storage
        .from("case-documents")
        .createSignedUrl(storagePath, 86400 * 7); // 7 días de acceso

      await sendMessageAction({
        conversationId: conversation.id,
        message: `📎 Documento compartido: ${file.name}`,
        attachmentUrl: signed?.signedUrl || null,
        attachmentType: "document",
      });
    } catch (err: any) {
      alert(err.message || "Error al subir adjunto");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const counterpartFullName = `${counterpart.firstName} ${counterpart.lastName}`.trim();

  // Enlace seguro de videoconsulta (Jitsi Meet Cifrado) garantizado
  const effectiveMeetingLink =
    consultationState?.meetingLink ||
    (consultationState?.id
      ? `https://meet.jit.si/alya-legal-${consultationState.id.replace(/-/g, "").slice(0, 16)}`
      : `https://meet.jit.si/alya-legal-${conversation.caseId.replace(/-/g, "").slice(0, 16)}`);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/60 overflow-hidden">
      {/* 1. Header Superior del Chat */}
      <header className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between z-10 shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-sm overflow-hidden font-serif">
              {counterpart.avatarUrl ? (
                <img
                  src={counterpart.avatarUrl}
                  alt={counterpartFullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                counterpartFullName.charAt(0)
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0F172A] truncate font-serif">
                {counterpartFullName}
              </h3>
              {counterpart.barNumber && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-[#2563EB] border border-blue-100 font-semibold font-mono shrink-0">
                  <Award className="w-3 h-3" />
                  {counterpart.barAssociation || "CAL"} {counterpart.barNumber}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
              <span className="text-[#2563EB] font-medium font-mono">
                {caseData.specialtyName}
              </span>
              <span>•</span>
              <span className="truncate">{caseData.title}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Bóveda de Documentos */}
          <button
            onClick={() => setIsDocsOpen(true)}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
          >
            <FileText className="w-4 h-4 text-[#2563EB]" />
            <span className="hidden sm:inline">Bóveda Documental</span>
          </button>

          {/* Videoconsulta Rápida (Si los fondos están en custodia y es virtual) */}
          {consultationState &&
            consultationState.paymentStatus === "held_escrow" &&
            (consultationState.modality as string) !== "in_person" &&
            (consultationState.modality as string) !== "presencial" && (
              <button
                onClick={() => setIsVideoOpen(true)}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
              >
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Videoconsulta</span>
              </button>
            )}

          {/* Agendar Cita (Disponible para el cliente si no hay cita pendiente o confirmada) */}
          {isClient && counterpart.lawyerProfileId && (!consultationState || consultationState.status === "cancelled") && (
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Agendar Cita</span>
            </button>
          )}

          {/* Emitir Convenio de Honorarios (Disponible para el Abogado) */}
          {!isClient && (
            <button
              onClick={() => setIsAgreementModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              title="Emitir Hoja de Encargo / Convenio (Art. 1764 C.C.)"
            >
              <Scale className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Convenio</span>
            </button>
          )}

          {/* Calificar Consulta */}
          {isClient && consultationState && consultationState.status === "completed" && !hasReviewedState && counterpart.lawyerProfileId && (
            <button
              onClick={() => setIsReviewOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Star className="w-3.5 h-3.5 fill-[#2563EB] text-[#2563EB]" />
              <span>Calificar</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Convenios de Honorarios Activos (Art. 1764 C.C.) */}
      {agreements.length > 0 && (
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 space-y-2">
          {agreements.map((agreement) => (
            <FeeAgreementCard
              key={agreement.id}
              agreement={agreement}
              isClient={isClient}
              onRefresh={loadAgreements}
            />
          ))}
        </div>
      )}

      {/* 3. Banner de Contexto de Consulta Legal (Custodia Escrow + Videoconsulta) */}
      {consultationState && (
        <ConsultationContextBanner
          consultation={consultationState}
          isClient={isClient}
          onOpenPayment={() => {
            setHasDismissedPaymentModal(false);
            setIsPaymentOpen(true);
          }}
          onOpenVideo={() => setIsVideoOpen(true)}
          onOpenReview={() => setIsReviewOpen(true)}
        />
      )}

      {/* 4. Banner de Seguridad Ley N.° 29733 */}
      <div className="py-2 px-4 bg-blue-50/40 border-b border-blue-100 flex items-center justify-center gap-2 text-[11px] text-slate-600 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#2563EB]" />
        <span>
          Canal privado protegido por secreto profesional y la Ley N.° 29733 de Protección de Datos Personales.
        </span>
      </div>

      {/* 4.1 Banner de Solicitud Pendiente de Aceptación */}
      {!isClient && !lawyerInterested && (
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 via-indigo-50/80 to-white border-b border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                El cliente seleccionó tu perfil y espera tu confirmación
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                Revisa los detalles de la consulta y acepta el caso para habilitar formalmente la atención y notificar al cliente.
              </p>
              {acceptError && (
                <p className="text-xs font-semibold text-rose-700 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{acceptError}</span>
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            disabled={isAcceptingCase}
            onClick={handleAcceptCaseFromChat}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-60 shrink-0"
          >
            {isAcceptingCase ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span>Confirmando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Aceptar Caso y Confirmar Atención</span>
              </>
            )}
          </button>
        </div>
      )}

      {isClient && !lawyerInterested && (
        <div className="px-6 py-3 bg-amber-50/80 border-b border-amber-200 flex items-center gap-3 text-xs text-amber-900">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Solicitud enviada:</strong> hemos notificado al abogado sobre tu interés. Recibirás una notificación en cuanto confirme su disponibilidad para atender el caso.
          </span>
        </div>
      )}

      {/* 3. Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] mb-3 shadow-xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A] font-serif">
              Canal de Comunicación Habilitado
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
              Han formalizado un match bilateral. Pueden realizar consultas
              legales preliminares, coordinar la estrategia y programar su
              primera reunión.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id;
            const time = formatLimaTime(msg.created_at);
            const isSystemMsg = isSystemEventMessage(msg.message);

            if (isSystemMsg) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="max-w-lg w-full rounded-2xl border border-blue-200/80 bg-blue-50/75 px-4 py-3 text-xs text-[#0F172A] shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between gap-2 pb-1 border-b border-blue-200/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] font-mono">
                        Notificación del Sistema ALYA
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{time}</span>
                    </div>
                    <div className="leading-relaxed text-slate-800 space-y-0.5">
                      {renderFormattedMessage(msg.message)}
                    </div>
                    {msg.attachment_url && (
                      <div className="pt-2 border-t border-blue-200/50">
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white text-slate-800 border border-blue-200 hover:bg-blue-50 transition-colors"
                        >
                          <File className="w-3.5 h-3.5" />
                          <span>Abrir Comprobante / Documento</span>
                          <Download className="w-3.5 h-3.5 ml-1 opacity-70" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-md lg:max-w-lg rounded-2xl p-4 text-xs transition-all ${
                    isMe
                      ? "bg-[#0F172A] text-white rounded-tr-xs shadow-xs"
                      : "bg-white text-[#0F172A] border border-slate-200 rounded-tl-xs shadow-xs"
                  }`}
                >
                  {/* Contenido del Mensaje */}
                  <div className="leading-relaxed space-y-0.5">
                    {renderFormattedMessage(msg.message)}
                  </div>

                  {/* Document Attachment Button if present */}
                  {msg.attachment_url && (
                    <div className="mt-3 pt-2.5 border-t border-current/10">
                      <a
                        href={msg.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors border ${
                          isMe
                            ? "bg-slate-800 text-blue-300 border-slate-700 hover:bg-slate-700"
                            : "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        <File className="w-3.5 h-3.5" />
                        <span>Abrir Documento Adjunto</span>
                        <Download className="w-3.5 h-3.5 ml-1 opacity-70" />
                      </a>
                    </div>
                  )}

                  {/* Metadata: Hora y Estado de Lectura */}
                  <div
                    className={`flex items-center gap-1.5 justify-end mt-1.5 text-[10px] font-mono ${
                      isMe ? "text-slate-400" : "text-slate-400"
                    }`}
                  >
                    <span>{time}</span>
                    {isMe && (
                      <span>
                        {msg.read_at ? (
                          <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Barra Inferior de Entrada o Bloqueo por Abono Requerido (H14: Bloquea envío en ambos roles sin custodia) */}
      {!lawyerInterested ? (
        <footer className="border-t border-slate-200 bg-slate-50 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                {isClient
                  ? "Esperando que el abogado acepte tu consulta para habilitar el intercambio de mensajes y el abono en custodia."
                  : "Acepta el caso arriba para confirmar el match bilateral y habilitar la mensajería con el cliente."}
              </span>
            </div>
            {!isClient && (
              <button
                type="button"
                disabled={isAcceptingCase}
                onClick={handleAcceptCaseFromChat}
                className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs transition-all cursor-pointer shrink-0 disabled:opacity-60"
              >
                {isAcceptingCase ? "Confirmando..." : "Aceptar Caso"}
              </button>
            )}
          </div>
        </footer>
      ) : requiresClientPayment ? (
        <footer className="border-t border-amber-200 bg-linear-to-r from-amber-50 to-orange-50/50 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300 shadow-2xs">
                <Lock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 font-serif">
                  Abono de honorarios requerido para iniciar la conversación
                </h4>
                <p className="text-[11px] text-slate-600">
                  El abogado ha fijado una consulta de <strong>S/ {agreedPrice.toFixed(2)}</strong>. Tu pago queda protegido en custodia Escrow ALYA hasta que concluya la atención.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPaymentOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <CreditCard className="w-4 h-4 text-blue-400" />
              <span>Abonar S/ {agreedPrice.toFixed(2)}</span>
            </button>
          </div>
        </footer>
      ) : !isClient && !isPaidOrFree ? (
        <footer className="border-t border-amber-200 bg-amber-50 p-4 shadow-xs">
          <div className="flex items-center justify-center gap-3 max-w-4xl mx-auto text-amber-900">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-xs">
              <p className="font-bold">
                Mensajería bloqueada en espera de custodia Escrow (S/ {agreedPrice.toFixed(2)})
              </p>
              <p className="text-[11px] text-amber-800">
                Por seguridad financiera y cumplimiento, podrás enviar mensajes y adjuntos en cuanto el cliente deposite el abono en custodia ALYA.
              </p>
            </div>
          </div>
        </footer>
      ) : (
        <>
          <footer className="p-4 border-t border-slate-200 bg-white">
            <form
              onSubmit={handleSendMessage}
              className="flex items-end gap-3 max-w-4xl mx-auto"
            >
              {/* File Upload Trigger */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />

              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-[#2563EB] border border-slate-200 transition-colors shrink-0 disabled:opacity-50"
                title="Adjuntar documento al chat"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
                ) : (
                  <Paperclip className="w-5 h-5" />
                )}
              </button>

              {/* Text Area */}
              <div className="flex-1 relative rounded-xl bg-slate-50 border border-slate-200 focus-within:border-[#2563EB] focus-within:bg-white transition-colors">
                <textarea
                  rows={1}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje seguro... (Shift+Enter para salto de línea)"
                  className="w-full px-4 py-3 bg-transparent text-xs text-[#0F172A] placeholder-slate-400 resize-none focus:outline-hidden max-h-32"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="p-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                title="Enviar mensaje"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                ) : (
                  <Send className="w-5 h-5 text-blue-400" />
                )}
              </button>
            </form>
          </footer>
        </>
      )}

      {/* Drawers y Modales */}
      <CaseDocumentsDrawer
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
        caseId={caseData.id}
        caseTitle={caseData.title}
        isClient={isClient}
      />

      {isClient && counterpart.lawyerProfileId && (
        <ScheduleConsultationModal
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          caseId={caseData.id}
          lawyerId={counterpart.lawyerProfileId}
          lawyerName={counterpartFullName}
          consultationPrice={counterpart.consultationPrice || 150}
        />
      )}

      {isClient && consultationState && counterpart.lawyerProfileId && (
        <ReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          consultationId={consultationState.id}
          lawyerId={counterpart.lawyerProfileId}
          caseId={caseData.id}
          lawyerName={counterpartFullName}
          onReviewSubmitted={() => {
            setHasReviewedState(true);
            setIsReviewOpen(false);
          }}
        />
      )}

      {/* Modal de Pago de Consulta en Custodia (Escrow) */}
      {isClient && consultationState && isPaymentOpen && (
        <ConsultationPaymentModal
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false);
            setHasDismissedPaymentModal(true);
          }}
          consultationId={consultationState.id}
          agreedPrice={consultationState.agreedPrice || counterpart.consultationPrice || 150}
          lawyerName={counterpartFullName}
          onPaymentSuccess={(status?: string) => {
            setConsultationState((prev) =>
              prev
                ? {
                    ...prev,
                    paymentStatus: status || "held_escrow",
                    meetingLink:
                      prev.meetingLink ||
                      `https://meet.jit.si/alya-legal-${prev.id.replace(/-/g, "").slice(0, 16)}`,
                  }
                : null
            );
          }}
        />
      )}

      {/* Modal de Videoconsulta Integrada Jitsi Meet */}
      {consultationState && (
        <JitsiVideoModal
          isOpen={isVideoOpen}
          onClose={() => setIsVideoOpen(false)}
          meetingLink={effectiveMeetingLink}
          roomPasscode={consultationState.roomPasscode || null}
          consultationTitle={`Consulta: ${caseData.title}`}
          counterpartName={counterpartFullName}
          participantName={
            isClient
              ? "Cliente ALYA"
              : `Abg. ${counterpart.firstName || ""}`
          }
        />
      )}

      {/* Modal de Emisión de Hoja de Encargo / Convenio de Honorarios (Abogado) */}
      {!isClient && (
        <CreateFeeAgreementModal
          isOpen={isAgreementModalOpen}
          onClose={() => setIsAgreementModalOpen(false)}
          caseId={caseData.id}
          caseTitle={caseData.title}
          conversationId={conversation.id}
          onAgreementCreated={loadAgreements}
        />
      )}
    </div>
  );
}
