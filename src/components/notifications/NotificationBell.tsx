"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  Calendar,
  Star,
  ShieldCheck,
  Briefcase,
  X,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getUserNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  type NotificationItem,
} from "@/actions/notifications.actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NotificationBellProps {
  initialNotifications?: NotificationItem[];
  initialUnreadCount?: number;
}

export function NotificationBell({
  initialNotifications = [],
  initialUnreadCount = 0,
}: NotificationBellProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    initialNotifications
  );
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Carga inicial
  useEffect(() => {
    async function load() {
      const res = await getUserNotificationsAction();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    }
    load();
  }, []);

  // Supabase Realtime Subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("user-notifications-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotif = {
            id: payload.new.id,
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            data: payload.new.data,
            readAt: payload.new.read_at,
            createdAt: payload.new.created_at,
          };
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === payload.new.id
                ? { ...n, readAt: payload.new.read_at }
                : n
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, redirectUrl?: string) => {
    await markNotificationAsReadAction(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    if (redirectUrl) {
      setIsOpen(false);
      router.push(redirectUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsReadAction();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case "consultation":
        return <Calendar className="w-4 h-4 text-slate-700" />;
      case "review":
        return <Star className="w-4 h-4 text-blue-500" />;
      case "verification":
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case "match":
        return <Briefcase className="w-4 h-4 text-[#0F172A]" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTargetUrl = (notif: NotificationItem) => {
    if (notif.data?.conversation_id) return `/chat/${notif.data.conversation_id}`;
    if (notif.data?.case_id) return `/cases/${notif.data.case_id}/match`;
    if (notif.type === "consultation") return `/lawyer/schedule`;
    if (notif.type === "verification") return `/lawyer/verification`;
    return null;
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Botón de la Campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:text-[#2563EB] transition-all shadow-xs"
        title="Notificaciones"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#2563EB] text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover flotante */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 text-[#0F172A] shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0F172A]">
                Notificaciones
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] text-slate-500 hover:text-[#2563EB] flex items-center gap-1 transition-colors font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Marcar leídas</span>
              </button>
            )}
          </div>

          {/* Lista de Notificaciones */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-300" />
                <p>No tienes notificaciones pendientes.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const targetUrl = getTargetUrl(n);
                const isUnread = !n.readAt;
                const timeAgo = new Date(n.createdAt).toLocaleDateString(
                  "es-PE",
                  { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }
                );

                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n.id, targetUrl || undefined)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                      isUnread
                        ? "bg-blue-50/60 hover:bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p
                          className={`text-xs font-semibold truncate ${
                            isUnread ? "text-[#0F172A]" : "text-slate-700"
                          }`}
                        >
                          {n.title}
                        </p>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>

                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{timeAgo}</span>
                        {targetUrl && (
                          <span className="text-[#2563EB] hover:underline flex items-center gap-0.5 font-medium">
                            Ver detalle <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
