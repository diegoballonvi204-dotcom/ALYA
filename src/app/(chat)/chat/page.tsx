import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserConversationsAction } from "@/actions/chat.actions";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { MessageSquare, ShieldCheck, Scale, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function ChatIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { conversations } = await getUserConversationsAction();

  return (
    <div className="h-[calc(100vh-4.5rem)] flex flex-col md:flex-row overflow-hidden bg-slate-50">
      {/* Sidebar de conversaciones */}
      <ChatSidebar conversations={conversations || []} />

      {/* Placeholder de Conversación no seleccionada */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-white border-l border-slate-200">
        <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] mb-6 shadow-xs">
          <Scale className="w-10 h-10" />
        </div>

        <h3 className="text-2xl font-bold text-[#0F172A] mb-2 font-serif">
          Canal Seguro de Mensajería Jurídica
        </h3>
        <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
          Selecciona una conversación del panel lateral para coordinar tu caso,
          compartir anexos en la bóveda o programar tu consulta legal.
        </p>

        {(!conversations || conversations.length === 0) && (
          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/70 max-w-sm shadow-xs">
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Aún no tienes conversaciones activas. Las conversaciones se crean
              automáticamente cuando existe un match de mutuo interés entre un
              cliente y un abogado colegiado.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs transition-colors shadow-xs"
            >
              <span>Ir a mi panel</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
            </Link>
          </div>
        )}

        <div className="mt-8 flex items-center gap-2 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Comunicaciones protegidas bajo la Ley N.° 29733</span>
        </div>
      </div>
    </div>
  );
}
