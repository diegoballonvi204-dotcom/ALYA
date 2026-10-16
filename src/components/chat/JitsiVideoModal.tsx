"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Video,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Key,
  Copy,
  Check,
  PhoneOff,
  ExternalLink,
} from "lucide-react";

interface JitsiVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingLink: string;
  roomPasscode?: string | null;
  userName?: string;
  participantName?: string;
  counterpartName?: string;
  caseTitle?: string;
  consultationTitle?: string;
}

export function JitsiVideoModal({
  isOpen,
  onClose,
  meetingLink,
  roomPasscode,
  userName,
  participantName,
  counterpartName,
  caseTitle,
  consultationTitle,
}: JitsiVideoModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedPasscode, setCopiedPasscode] = useState(false);

  if (!isOpen) return null;

  const effectiveDisplayName = participantName || userName || "Participante ALYA";
  const effectiveTitle = consultationTitle || caseTitle || "Consulta Legal ALYA";

  // Parámetros seguros para la URL de Jitsi Meet
  const cleanLink = meetingLink.split("#")[0];
  const encodedName = encodeURIComponent(effectiveDisplayName);
  const iframeSrc = `${cleanLink}#userInfo.displayName="${encodedName}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&interfaceConfig.SHOW_JITSI_WATERMARK=false`;

  const copyPasscode = () => {
    if (!roomPasscode) return;
    navigator.clipboard.writeText(roomPasscode);
    setCopiedPasscode(true);
    setTimeout(() => setCopiedPasscode(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop con desenfoque suave */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className={`relative z-10 w-full flex flex-col rounded-3xl bg-[#0B0F17] border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 ${
            isFullscreen ? "h-[98vh] max-w-[98vw]" : "h-[86vh] max-w-5xl"
          }`}
        >
          {/* Top Bar Header */}
          <header className="px-5 py-3.5 bg-[#0F172A] border-b border-slate-800/90 flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Video className="w-4 h-4" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white truncate font-serif">
                    Teleasistencia Legal Protegida
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Cifrado Extremo a Extremo
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {counterpartName ? `Con ${counterpartName} • ` : ""}{effectiveTitle}
                </p>
              </div>
            </div>

            {/* Room Passcode & Window Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {roomPasscode && (
                <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 text-xs text-slate-300">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono font-bold text-white tracking-wider">
                    {roomPasscode}
                  </span>
                  <button
                    onClick={copyPasscode}
                    className="ml-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Copiar clave de sala"
                  >
                    {copiedPasscode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}

              <a
                href={meetingLink}
                target="_blank"
                rel="noreferrer"
                className="hidden md:inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Abrir en pestaña externa si tienes problemas"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="text-[11px]">Abrir pestaña</span>
              </a>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title={isFullscreen ? "Restaurar tamaño" : "Pantalla completa"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Salir de la videollamada"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>Finalizar</span>
              </button>
            </div>
          </header>

          {/* Iframe de Jitsi Meet */}
          <div className="flex-1 w-full bg-[#05070B] relative">
            <iframe
              src={iframeSrc}
              allow="camera; microphone; display-capture; autoplay; clipboard-write; screen-wake-lock"
              className="w-full h-full border-0"
              title="Sala de Videoconsulta ALYA"
            />
          </div>

          {/* Footer Informativo de Seguridad Legal */}
          <footer className="px-4 py-2 bg-[#0B0F17] border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>
                Audiencia confidencial amparada bajo el secreto profesional de la abogacía peruana y la Ley N.° 29733.
              </span>
            </div>
            <span className="hidden sm:inline font-mono text-[10px] text-slate-500">
              ALYA Telehealth v1.0
            </span>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
