export default function GlobalLoading() {
  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center p-8">
      <div className="relative flex items-center justify-center mb-5">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 animate-pulse flex items-center justify-center shadow-xs">
          <div className="w-6 h-6 rounded-lg bg-[#2563EB]/20 animate-spin" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span className="font-serif font-bold text-sm tracking-wide text-[#0F172A]">
          ALYA<span className="text-[#2563EB] italic font-normal text-xs ml-1">LegalTech</span>
        </span>
        <span className="text-[11px] text-slate-400 font-mono tracking-widest uppercase">
          Cargando entorno seguro...
        </span>
      </div>
    </div>
  );
}
