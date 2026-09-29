"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Search, Award, ShieldCheck, Clock } from "lucide-react";

export interface ConversationItem {
  id: string;
  caseId: string;
  caseTitle: string;
  specialtyName: string;
  counterpartName: string;
  counterpartAvatar: string | null;
  counterpartRole: "client" | "lawyer";
  barAssociation: string | null;
  barNumber: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isActive: boolean;
}

interface ChatSidebarProps {
  conversations: ConversationItem[];
  currentConversationId?: string;
}

export function ChatSidebar({
  conversations,
  currentConversationId,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("");
  const pathname = usePathname();

  const filtered = conversations.filter(
    (c) =>
      c.counterpartName.toLowerCase().includes(search.toLowerCase()) ||
      c.caseTitle.toLowerCase().includes(search.toLowerCase()) ||
      c.specialtyName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="w-full md:w-80 lg:w-96 border-r border-slate-200 bg-white flex flex-col h-full shrink-0 shadow-xs">
      {/* Search & Header */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-[#0F172A] tracking-tight font-serif">
              Mensajes Seguros
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {conversations.length} activas
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por abogado, cliente o materia..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
            <p>No se encontraron conversaciones.</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = currentConversationId === conv.id;
            const timeFormatted = new Date(conv.lastMessageAt).toLocaleTimeString(
              "es-PE",
              { hour: "2-digit", minute: "2-digit" }
            );

            return (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className={`p-4 flex items-start gap-3 transition-colors block ${
                  isActive
                    ? "bg-blue-50/70 border-l-3 border-l-[#2563EB]"
                    : "hover:bg-slate-50/80"
                }`}
              >
                {/* Avatar with Status */}
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-sm overflow-hidden font-serif">
                    {conv.counterpartAvatar ? (
                      <img
                        src={conv.counterpartAvatar}
                        alt={conv.counterpartName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      conv.counterpartName.charAt(0)
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-xs font-bold text-[#0F172A] truncate">
                        {conv.counterpartName}
                      </p>
                      {conv.barNumber && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-100 shrink-0 font-mono font-medium">
                          <Award className="w-2.5 h-2.5" />
                          CAL {conv.barNumber}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {timeFormatted}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#2563EB] font-medium truncate mb-1">
                    {conv.caseTitle}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-500 truncate">
                      {conv.lastMessage}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#2563EB] text-white font-bold text-[10px] shrink-0 font-mono">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </aside>
  );
}
