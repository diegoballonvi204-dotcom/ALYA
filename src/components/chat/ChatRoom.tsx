"use client";

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  sendMessageAction,
  markMessagesAsReadAction,
} from "@/actions/chat.actions";
import { CaseDocumentsDrawer } from "./CaseDocumentsDrawer";
import { ScheduleConsultationModal } from "./ScheduleConsultationModal";
import { ReviewModal } from "@/components/reviews/ReviewModal";

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
  consultation?: {
    id: string;
    status: string;
    hasReviewed: boolean;
  } | null;
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
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [hasReviewedState, setHasReviewedState] = useState(
    consultation?.hasReviewed || false
  );

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

          {/* Agendar Cita (Disponible para el cliente) */}
          {isClient && counterpart.lawyerProfileId && (
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Agendar Cita</span>
            </button>
          )}

          {/* Calificar Consulta */}
          {isClient && consultation && !hasReviewedState && counterpart.lawyerProfileId && (
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

      {/* 2. Banner de Seguridad Ley N.° 29733 */}
      <div className="py-2 px-4 bg-blue-50/40 border-b border-blue-100 flex items-center justify-center gap-2 text-[11px] text-slate-600 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#2563EB]" />
        <span>
          Canal protegido de extremo a extremo. Los mensajes y expedientes están
          sujetos al secreto profesional y la Ley N.° 29733.
        </span>
      </div>

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
            const time = new Date(msg.created_at).toLocaleTimeString("es-PE", {
              hour: "2-digit",
              minute: "2-digit",
            });

            const isAppointmentCard = msg.message.startsWith("📅 **");

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-md lg:max-w-lg rounded-2xl p-4 text-xs transition-all ${
                    isAppointmentCard
                      ? "bg-blue-50/80 border border-blue-200 text-[#0F172A] shadow-xs"
                      : isMe
                      ? "bg-[#0F172A] text-white rounded-tr-xs shadow-xs"
                      : "bg-white text-[#0F172A] border border-slate-200 rounded-tl-xs shadow-xs"
                  }`}
                >
                  {/* Contenido del Mensaje */}
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.message}
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

      {/* 4. Barra Inferior de Entrada */}
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
            className="p-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
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

      {isClient && consultation && counterpart.lawyerProfileId && (
        <ReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          consultationId={consultation.id}
          lawyerId={counterpart.lawyerProfileId}
          caseId={caseData.id}
          lawyerName={counterpartFullName}
          onReviewSubmitted={() => {
            setHasReviewedState(true);
            setIsReviewOpen(false);
          }}
        />
      )}
    </div>
  );
}
