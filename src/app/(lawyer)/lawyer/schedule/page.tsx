import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LawyerScheduleManager } from "@/components/lawyer/LawyerScheduleManager";
import { Calendar } from "lucide-react";

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

  // 2. Obtener horarios semanales configurados
  const { data: schedules } = await supabase
    .from("lawyer_schedules")
    .select("*")
    .eq("lawyer_id", lp.id)
    .order("day_of_week", { ascending: true });

  // 3. Obtener consultas registradas para este abogado
  const { data: rawConsultations } = await supabase
    .from("consultations")
    .select(`
      id,
      case_id,
      client_id,
      scheduled_at,
      duration_minutes,
      modality,
      agreed_price,
      status,
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
    .order("scheduled_at", { ascending: false });

  const formattedConsultations = (rawConsultations || []).map((c: any) => ({
    id: c.id,
    case_id: c.case_id,
    case_title: c.cases?.title || "Caso Legal",
    client_name: `${c.profiles?.first_name || "Cliente"} ${c.profiles?.last_name || ""}`.trim(),
    scheduled_at: c.scheduled_at,
    duration_minutes: c.duration_minutes,
    modality: c.modality,
    agreed_price: Number(c.agreed_price) || 0,
    status: c.status,
    meeting_link: c.meeting_link,
    meeting_address: c.meeting_address,
    notes: c.notes,
  }));

  return (
    <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-12 py-8 space-y-8">
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
            Matrícula {lp.bar_association} CAL {lp.bar_number} • Define tus horarios de atención y coordina citas con tus clientes.
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
