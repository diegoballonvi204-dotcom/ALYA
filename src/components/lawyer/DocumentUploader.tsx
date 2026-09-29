"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UploadCloud, CheckCircle2, AlertCircle, FileText, X } from "lucide-react";

interface DocumentUploaderProps {
  label: string;
  description: string;
  docKey: string;
  userId: string;
  onUploaded: (path: string) => void;
  existingPath?: string | null;
}

export default function DocumentUploader({
  label,
  description,
  docKey,
  userId,
  onUploaded,
  existingPath,
}: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(existingPath || null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(
    existingPath ? existingPath.split("/").pop() || "Archivo adjunto" : null
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);

    // Validar tamaño: máximo 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("El archivo no debe exceder los 10MB.");
      return;
    }

    // Validar tipo
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setErrorMsg("Solo se permiten archivos PDF, JPG o PNG.");
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const storagePath = `${userId}/${docKey}_${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from("verification-documents")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        throw error;
      }

      setUploadedPath(data.path);
      setFileName(file.name);
      onUploaded(data.path);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al subir el archivo.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setUploadedPath(null);
    setFileName(null);
    onUploaded("");
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 shadow-xs">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h4 className="text-xs font-bold text-[#0F172A]">{label}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
        </div>
        {uploadedPath && (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            <CheckCircle2 className="w-3 h-3" />
            Cargado
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 text-[11px] text-slate-700 mb-2 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-slate-700" />
          <span>{errorMsg}</span>
        </div>
      )}

      {uploadedPath ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-900">
          <div className="flex items-center gap-2 truncate">
            <FileText className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="truncate">{fileName}</span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded p-1 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 py-4 hover:border-[#2563EB] hover:bg-blue-50/30 transition-all">
          {uploading ? (
            <div className="flex items-center gap-2 text-xs text-[#2563EB]">
              <div className="w-4 h-4 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
              <span>Subiendo archivo seguro...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <UploadCloud className="w-6 h-6 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">
                Haz clic o arrastra tu archivo aquí
              </span>
              <span className="text-[10px] text-slate-400">
                PDF, JPG o PNG hasta 10MB
              </span>
            </div>
          )}
          <input
            type="file"
            accept=".pdf,image/jpeg,image/png"
            disabled={uploading}
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
