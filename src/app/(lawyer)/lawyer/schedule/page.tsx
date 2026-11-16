import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LawyerScheduleManager } from "@/components/lawyer/LawyerScheduleManager";
import { formatBarLabel } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Agenda y Consultas Jurídicas | ALYA Perú",
  description: "Gestiona tu disponibilidad semanal y las consultas jurídicas agendadas.",
};

export default async function LawyerSchedulePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/lawyer/schedule");
  }

  // 1. Obtener perfil de abogado
  const { data: lp, error: lpErr } = await supabase
    .from("lawyer_profiles")
    .select("id, bar_association, bar_number")
    .eq("user_id", user.id)
    .single();

  if (lpErr || !lp) {
    redirect("/onboarding/lawyer");
  }

  // 2. Obtener horarios semanales configurados (con fallback en metadata)
  let { data: schedules } = await supabase
    .from("lawyer_schedules")
    .select("*")
    .eq("lawyer_id", lp.id)
    .order("day_of_week", { ascending: true });

  if (!schedules || schedules.length === 0) {
    const { data: verif } = await supabase
      .from("verifications")
      .select("documents_metadata")
      .eq("lawyer_id", lp.id)
      .maybeSingle();
    const metaSchedules = (verif?.documents_metadata as any)?.weekly_schedules;
    if (Array.isArray(metaSchedules) && metaSchedules.length > 0) {
      schedules = metaSchedules;
    }
  }

  // 3. Obtener consultas registradas para este abogado
  const { data: rawConsultations } = await supabase
    .from("consultations")
    .select(`
      id,
      case_id,
      client_id,
      scheduled_at,
      created_at,
      duration_minutes,
      modality,
      agreed_price,
      status,
      payment_status,
      payment_method,
      room_passcode,
      meeting_link,
      meeting_address,
      notes,
      cases (
        title
      ),
      profiles:client_id (
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq("lawyer_id", lp.id)
    .order("created_at", { ascending: false });

  // H10: Deduplicar solicitudes pendientes idénticas y marcar como vencidas (>48h sin abono)
  const nowMs = Date.now();
  const seenPendingKeys = new Set<string>();
  const formattedConsultations = (rawConsultations || [])
    .filter((c: any) => {
      if (
        c.status === "requested" &&
        (!c.payment_status || c.payment_status === "pending_payment")
      ) {
        const dedupKey = `${c.case_id}:${c.client_id}:${Number(c.agreed_price) || 0}`;
        if (seenPendingKeys.has(dedupKey)) {
          return false;
        }
        seenPendingKeys.add(dedupKey);
      }
      return true;
    })
    .map((c: any) => {
      const isPendingPayment =
        !c.payment_status || c.payment_status === "pending_payment";
      const createdOrScheduledMs = new Date(
        c.created_at || c.scheduled_at
      ).getTime();
      const isExpiredPending =
        c.status === "requested" &&
        isPendingPayment &&
        nowMs - createdOrScheduledMs > 48 * 60 * 60 * 1000;

      return {
        id: c.id,
        case_id: c.case_id,
        case_title: c.cases?.title || "Caso Legal",
        client_name: `${c.profiles?.first_name || "Cliente"} ${c.profiles?.last_name || ""}`.trim(),
        scheduled_at: c.scheduled_at,
        duration_minutes: c.duration_minutes,
        modality: c.modality,
        agreed_price: Number(c.agreed_price) || 0,
        status: isExpiredPending ? "expired" : c.status,
        payment_status: c.payment_status || "pending_payment",
        payment_method: c.payment_method || null,
        room_passcode: c.room_passcode || null,
        meeting_link: c.meeting_link,
        meeting_address: c.meeting_address,
        notes: c.notes,
      };
    });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-12 py-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] font-mono">
            Gestión de Agenda Profesional
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] mt-1 font-serif">
            Agenda y Consultas Jurídicas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Matrícula {formatBarLabel(lp.bar_association, lp.bar_number)} • Define tus horarios de atención y coordina citas con tus clientes.
          </p>
        </div>
      </div>

      {/* Schedule Manager Component */}
      <LawyerScheduleManager
        initialSchedules={schedules || []}
        consultations={formattedConsultations}
      />
    </div>
  );
}
