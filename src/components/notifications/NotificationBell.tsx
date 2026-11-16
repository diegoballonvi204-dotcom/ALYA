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
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getUserNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  type NotificationItem,
} from "@/actions/notifications.actions";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { formatLimaDateTime } from "@/lib/utils";

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
  const [matchAlert, setMatchAlert] = useState<NotificationItem | null>(null);
  const [detailNotification, setDetailNotification] = useState<NotificationItem | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const dismissedAlertIdsRef = useRef<Set<string>>(new Set());
  const router = useRouter();
  const pathname = usePathname();

  // Carga inicial, recarga al cambiar de ruta y polling de respaldo cada 15s
  useEffect(() => {
    let isMounted = true;

    async function load() {
      const res = await getUserNotificationsAction();
      if (!isMounted) return;

      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);

      // Si hay un match_confirmed / match / new_client_inquiry reciente sin leer, mostrar alerta en pantalla
      const unreadAlert = res.notifications.find(
        (n) =>
          (n.type === "match_confirmed" ||
            n.type === "match" ||
            n.type === "new_client_inquiry") &&
          !n.readAt &&
          !dismissedAlertIdsRef.current.has(n.id)
      );
      if (unreadAlert) {
        setMatchAlert((prev) => prev || unreadAlert);
      }
    }

    load();
    const intervalId = setInterval(load, 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [pathname]);

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
          const newNotif: NotificationItem = {
            id: payload.new.id,
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            data: payload.new.data,
            readAt: payload.new.read_at,
            createdAt: payload.new.created_at,
          };

          setNotifications((prev) => {
            if (prev.some((n) => n.id === newNotif.id)) return prev;
            if (!newNotif.readAt) {
              setUnreadCount((count) => count + 1);
            }
            return [newNotif, ...prev];
          });

          // Si el abogado aceptó el caso o un cliente mostró interés, disparar alerta inmediata en pantalla
          if (
            (payload.new.type === "match_confirmed" ||
              payload.new.type === "match" ||
              payload.new.type === "new_client_inquiry") &&
            !dismissedAlertIdsRef.current.has(newNotif.id)
          ) {
            setMatchAlert(newNotif);
          }
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
          setNotifications((prev) => {
            const next = prev.map((n) =>
              n.id === payload.new.id
                ? { ...n, readAt: payload.new.read_at }
                : n
            );
            setUnreadCount(next.filter((n) => !n.readAt).length);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDetailNotification(null);
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
    try {
      await markNotificationAsReadAction(id);
    } catch {
      // Ignorar fallo secundario
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    if (redirectUrl && redirectUrl !== pathname) {
      setIsOpen(false);
      router.push(redirectUrl);
    }
  };

  const handleOpenNotificationDetail = async (n: NotificationItem) => {
    setIsOpen(false);
    setDetailNotification(n);
    if (!n.readAt) {
      try {
        await markNotificationAsReadAction(n.id);
      } catch {
        // Ignorar
      }
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === n.id ? { ...item, readAt: new Date().toISOString() } : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
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
      case "match_confirmed":
        return <Sparkles className="w-4 h-4 text-blue-600" />;
      case "new_client_inquiry":
        return <Briefcase className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTargetUrl = (notif: NotificationItem | { type?: string; data?: any }) => {
    if (notif.data?.actionUrl) return notif.data.actionUrl;
    if (notif.data?.action_url) return notif.data.action_url;
    if (notif.data?.conversationId) return `/chat/${notif.data.conversationId}`;
    if (notif.data?.conversation_id) return `/chat/${notif.data.conversation_id}`;
    if (notif.data?.caseId) return `/cases/${notif.data.caseId}/match`;
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
                const timeAgo = formatLimaDateTime(n.createdAt);

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (targetUrl && targetUrl !== pathname) {
                        handleMarkAsRead(n.id, targetUrl);
                      } else {
                        handleOpenNotificationDetail(n);
                      }
                    }}
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

                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{timeAgo}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenNotificationDetail(n);
                          }}
                          className="text-[#2563EB] hover:underline flex items-center gap-0.5 font-semibold cursor-pointer"
                        >
                          Ver detalle <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Alerta Destacada en Pantalla para Match Confirmado o Nueva Solicitud */}
      {matchAlert && (
        <div className="fixed top-20 right-4 sm:right-6 z-[9999] max-w-md w-[calc(100vw-32px)] sm:w-[420px] bg-white rounded-2xl border-2 border-blue-600 shadow-2xl p-4 sm:p-5 animate-in fade-in slide-in-from-top-6 duration-300">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md text-white ${
                matchAlert.type === "new_client_inquiry"
                  ? "bg-emerald-600"
                  : "bg-blue-600"
              }`}
            >
              {matchAlert.type === "new_client_inquiry" ? (
                <Briefcase className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5 animate-pulse" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                    matchAlert.type === "new_client_inquiry"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  <CheckCircle2
                    className={`w-3 h-3 ${
                      matchAlert.type === "new_client_inquiry"
                        ? "text-emerald-600"
                        : "text-blue-600"
                    }`}
                  />
                  {matchAlert.type === "new_client_inquiry"
                    ? "📩 ¡Nueva Solicitud de Cliente!"
                    : "¡Match Confirmado!"}
                </span>
                <button
                  onClick={() => {
                    dismissedAlertIdsRef.current.add(matchAlert.id);
                    setMatchAlert(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Cerrar aviso"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h4 className="mt-1.5 text-sm font-bold text-slate-900 leading-snug">
                {matchAlert.title}
              </h4>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                {matchAlert.message}
              </p>

              <div className="mt-3.5 flex items-center gap-2">
                <button
                  onClick={() => {
                    const target =
                      getTargetUrl(matchAlert) ||
                      (matchAlert.type === "new_client_inquiry"
                        ? "/lawyer/dashboard"
                        : "/chat");
                    dismissedAlertIdsRef.current.add(matchAlert.id);
                    handleMarkAsRead(matchAlert.id, target);
                    setMatchAlert(null);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
                >
                  <span>
                    {matchAlert.type === "new_client_inquiry"
                      ? getTargetUrl(matchAlert)?.startsWith("/chat/")
                        ? "Ver Mensaje y Aceptar Caso"
                        : "Revisar Solicitud en Panel"
                      : "Ir al Chat y Realizar Abono"}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    dismissedAlertIdsRef.current.add(matchAlert.id);
                    setMatchAlert(null);
                  }}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Luego
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Detalle de Notificación (B6) */}
      {detailNotification && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notif-detail-title"
          onClick={() => setDetailNotification(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-[#0F172A]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                  {getIcon(detailNotification.type)}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                    {formatLimaDateTime(detailNotification.createdAt)}
                  </span>
                  <h4 id="notif-detail-title" className="text-sm font-bold text-[#0F172A]">
                    {detailNotification.title}
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailNotification(null)}
                aria-label="Cerrar detalle de notificación"
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {detailNotification.message}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDetailNotification(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cerrar
              </button>
              {(() => {
                const url = getTargetUrl(detailNotification);
                if (!url) return null;
                return (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailNotification(null);
                      router.push(url);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    <span>Ir al módulo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
