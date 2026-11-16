import Link from "next/link";
import { Scale, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-sm space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-blue-400 shadow-sm">
          <Scale className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block rounded-full bg-slate-100 border border-slate-200 px-3 py-0.5 text-xs font-mono font-bold text-slate-600">
            Error 404 • Recurso no encontrado
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-serif">
            Página o expediente no disponible
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            El enlace al que intentaste acceder no existe, fue retirado o corresponde a un recurso sin acceso autorizado.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ir al inicio</span>
          </Link>
          <Link
            href="/abogados"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-700 transition-colors"
          >
            <Search className="w-4 h-4 text-blue-600" />
            <span>Explorar Directorio</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

