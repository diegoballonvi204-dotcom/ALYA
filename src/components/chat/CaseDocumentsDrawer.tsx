"use client";

import { useState, useEffect, useTransition } from "react";
import {
  X,
  FileText,
  UploadCloud,
  Eye,
  Lock,
  Share2,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  getCaseDocumentsAction,
  uploadCaseDocumentAction,
  getCaseDocumentSignedUrlAction,
  toggleDocumentVisibilityAction,
} from "@/actions/documents.actions";

interface CaseDocumentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  caseTitle: string;
  isClient: boolean;
}

export function CaseDocumentsDrawer({
  isOpen,
  onClose,
  caseId,
  caseTitle,
  isClient,
}: CaseDocumentsDrawerProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadVisibility, setUploadVisibility] = useState<
    "private_client" | "shared_match"
  >("shared_match");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadDocuments = async () => {
    setLoading(true);
    const res = await getCaseDocumentsAction(caseId);
    if (res.documents) {
      setDocuments(res.documents);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen, caseId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg("El documento no debe exceder los 25MB.");
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setUploadProgress(10);

    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const storagePath = `cases/${caseId}/${Date.now()}_${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      setUploadProgress(40);

      const { error: uploadError } = await supabase.storage
        .from("case-documents")
        .upload(storagePath, file, {
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setUploadProgress(70);

      const res = await uploadCaseDocumentAction({
        caseId,
        fileName: file.name,
        storagePath,
        fileSizeBytes: file.size,
        mimeType: file.type || "application/octet-stream",
        visibility: uploadVisibility,
      });

      if (res.error) {
        throw new Error(res.error);
      }

      setUploadProgress(100);
      await loadDocuments();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al subir documento.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = "";
    }
  };

  const handleDownload = async (docId: string, fileName: string) => {
    const res = await getCaseDocumentSignedUrlAction(docId);
    if (res.signedUrl) {
      const a = document.createElement("a");
      a.href = res.signedUrl;
      a.download = fileName;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert(res.error || "No se pudo generar enlace de descarga.");
    }
  };

  const handleToggleVisibility = async (
    docId: string,
    currentVisibility: "private_client" | "shared_match"
  ) => {
    const newVis =
      currentVisibility === "private_client"
        ? "shared_match"
        : "private_client";

    startTransition(async () => {
      const res = await toggleDocumentVisibilityAction(docId, newVis);
      if (res.success) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, visibility: newVis } : d))
        );
      } else {
        alert(res.error || "Error al cambiar visibilidad");
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="w-screen max-w-md bg-white border-l border-slate-200 text-[#0F172A] flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0F172A] font-serif">
                      Bóveda Documental
                    </h3>
                    <p className="text-xs text-slate-500 truncate max-w-[220px]">
                      {caseTitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Ley 29733 Badge */}
              <div className="mx-6 mt-4 p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center gap-2.5 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span>
                  Archivos encriptados bajo la Ley N.° 29733 y secreto
                  profesional legal.
                </span>
              </div>

              {/* Upload Drop Area */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
                    Subir nuevo documento
                  </span>
                  {isClient && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500">Compartir:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setUploadVisibility(
                            uploadVisibility === "shared_match"
                              ? "private_client"
                              : "shared_match"
                          )
                        }
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          uploadVisibility === "shared_match"
                            ? "bg-blue-50 text-[#2563EB] border border-blue-200 font-bold"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {uploadVisibility === "shared_match"
                          ? "Compartido"
                          : "Privado"}
                      </button>
                    </div>
                  )}
                </div>

                <label
                  className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                    uploading
                      ? "border-blue-400 bg-blue-50/30 cursor-not-allowed"
                      : "border-slate-300 hover:border-[#2563EB] bg-slate-50/70 hover:bg-blue-50/20"
                  }`}
                >
                  <input
                    type="file"
                    className="hidden"
                    disabled={uploading}
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin" />
                      <span className="text-xs text-[#2563EB] font-medium">
                        Cargando y encriptando... {uploadProgress}%
                      </span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-7 h-7 text-slate-400 mb-1" />
                      <span className="text-xs font-medium text-slate-700">
                        Haz clic o arrastra un archivo
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        PDF, Word o Imagen (Máx. 25MB)
                      </span>
                    </>
                  )}
                </label>

                {errorMsg && (
                  <div className="mt-2.5 p-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-slate-700" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              {/* Document List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
                    Expediente Digital ({documents.length})
                  </span>
                </div>

                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
                    <span className="text-xs">Consultando bóveda...</span>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="py-12 text-center rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-600">
                      No hay documentos adjuntos aún.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Sube contratos, notificaciones o demandas judiciales para
                      revisión conjunta.
                    </p>
                  </div>
                ) : (
                  documents.map((doc) => {
                    const isPrivate = doc.visibility === "private_client";
                    return (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-all flex flex-col gap-2.5 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                              <FileText className="w-4 h-4 text-[#2563EB]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#0F172A] truncate">
                                {doc.fileName}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                Subido por {doc.uploaderName || "Usuario"} •{" "}
                                {(doc.fileSizeBytes / (1024 * 1024)).toFixed(2)}{" "}
                                MB
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              handleDownload(doc.id, doc.fileName)
                            }
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#2563EB] hover:bg-white transition-colors"
                            title="Descargar documento seguro"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Visibility & Permissions Footer */}
                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5">
                            {isPrivate ? (
                              <span className="inline-flex items-center gap-1 text-slate-500">
                                <Lock className="w-3 h-3 text-slate-400" />
                                Solo visible por ti
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[#2563EB] font-medium">
                                <Share2 className="w-3 h-3" />
                                Compartido con abogado
                              </span>
                            )}
                          </div>

                          {isClient && (
                            <button
                              disabled={isPending}
                              onClick={() =>
                                handleToggleVisibility(doc.id, doc.visibility)
                              }
                              className="text-slate-500 hover:text-[#2563EB] transition-colors text-[10px] underline underline-offset-2"
                            >
                              Cambiar a {isPrivate ? "Compartido" : "Privado"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
