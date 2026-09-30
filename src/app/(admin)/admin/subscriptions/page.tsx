import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAdminInvoicesAction,
  getAdminSubscriptionStatsAction,
} from "@/actions/billing.actions";
import AdminVoucherReviewer from "@/components/billing/AdminVoucherReviewer";
import AdminDunningTrigger from "@/components/billing/AdminDunningTrigger";
import LawyerTierBadge from "@/components/lawyer/LawyerTierBadge";
import {
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Search,
  Filter,
  Users,
  Target,
  Percent,
} from "lucide-react";
import Link from "next/link";

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status || "review_pending";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/subscriptions");
  }

  // Verificar rol de admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const [invoicesRes, statsRes] = await Promise.all([
    getAdminInvoicesAction(statusFilter),
    getAdminSubscriptionStatsAction(),
  ]);

  const invoices = invoicesRes.invoices || [];
  const stats = statsRes.stats || {
    totalActive: 0,
    totalTrialing: 0,
    totalPastDue: 0,
    pendingReviewCount: 0,
    estimatedMrr: 0,
    totalCollectedPen: 0,
    arpuPen: 0,
    trialToPaidConversionRate: 0,
    churnRate: 0,
    tierCounts: { starter: 0, pro: 0, elite: 0 },
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-12 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <CreditCard className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] font-serif">
              Suscripciones y Facturación
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Auditoría de ingresos, control de membresías de abogados y validación de comprobantes manuales SUNAT.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <AdminDunningTrigger />
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            Volver al Backoffice
          </Link>
        </div>
      </div>

      {/* KPI Cards: Fila 1 - Financiero & Operativo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              MRR Estimado
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-serif">
              S/ {stats.estimatedMrr}
            </div>
            <p className="text-[10px] text-slate-400">Ingreso mensual recurrente</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Suscripciones Activas
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-serif">
              {stats.totalActive}
            </div>
            <p className="text-[10px] text-slate-400">Abogados Pro y Élite de pago</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              En Prueba (Trial PRO)
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] font-serif">
              {stats.totalTrialing}
            </div>
            <p className="text-[10px] text-slate-400">Colegiados en onboarding</p>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Vouchers por Validar
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-700 font-serif">
              {stats.pendingReviewCount}
            </div>
            <p className="text-[10px] text-slate-400">Yape / Plin / BCP pendientes</p>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* KPI Cards: Fila 2 - Métricas SaaS & Retención */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              ARPU (Ingreso Promedio)
            </span>
            <div className="text-xl font-bold text-[#0F172A] font-serif">
              S/ {stats.arpuPen || 0} <span className="text-xs text-slate-400 font-normal">/abogado</span>
            </div>
            <p className="text-[10px] text-slate-400">Por suscriptor activo</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-emerald-600">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Conversión Trial-to-Paid
            </span>
            <div className="text-xl font-bold text-[#0F172A] font-serif">
              {stats.trialToPaidConversionRate || 0}%
            </div>
            <p className="text-[10px] text-slate-400">Pruebas convertidas a plan</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-blue-600">
            <Target className="w-4 h-4" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Tasa de Churn Estimada
            </span>
            <div className="text-xl font-bold text-[#0F172A] font-serif">
              {stats.churnRate || 0}%
            </div>
            <p className="text-[10px] text-slate-400">Cuentas no renovadas</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-amber-600">
            <Percent className="w-4 h-4" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Mix de Membresías
            </span>
            <div className="text-xs font-mono font-bold text-[#0F172A] space-y-0.5">
              <div>Básico: <span className="text-slate-500">{stats.tierCounts.starter}</span></div>
              <div>Pro: <span className="text-blue-600">{stats.tierCounts.pro}</span></div>
              <div>Élite: <span className="text-amber-600">{stats.tierCounts.elite}</span></div>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-purple-600">
            <Users className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filtros de Estado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/subscriptions?status=review_pending"
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              statusFilter === "review_pending"
                ? "bg-[#0F172A] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Pendientes de Revisión ({stats.pendingReviewCount})
          </Link>
          <Link
            href="/admin/subscriptions?status=paid"
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              statusFilter === "paid"
                ? "bg-[#0F172A] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Pagados y Aprobados
          </Link>
          <Link
            href="/admin/subscriptions?status=failed"
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              statusFilter === "failed"
                ? "bg-[#0F172A] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Rechazados
          </Link>
          <Link
            href="/admin/subscriptions?status=all"
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              statusFilter === "all"
                ? "bg-[#0F172A] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Todos
          </Link>
        </div>
      </div>

      {/* Tabla de Facturas y Comprobantes */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-mono uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Abogado / Colegiatura</th>
                <th className="px-6 py-4">Plan Solicitado</th>
                <th className="px-6 py-4">Monto (PEN)</th>
                <th className="px-6 py-4">Método & N° Operación</th>
                <th className="px-6 py-4">Datos SUNAT</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones de Verificación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length > 0 ? (
                invoices.map((inv) => {
                  const lawyerName = inv.lawyer_profiles?.profiles
                    ? `${inv.lawyer_profiles.profiles.first_name} ${inv.lawyer_profiles.profiles.last_name}`
                    : "Abogado Colegiado";

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#0F172A] text-sm font-serif">
                          {lawyerName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {inv.lawyer_profiles?.bar_association} • Matrícula: {inv.lawyer_profiles?.bar_number}
                        </div>
                        {inv.lawyer_profiles?.profiles?.phone && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            Tel: {inv.lawyer_profiles.profiles.phone}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold text-[#0F172A]">
                          {inv.target_plan?.name || "Plan Profesional"}
                        </div>
                        <div className="text-[10px] text-slate-500 capitalize">
                          Periodo: {inv.target_plan?.billing_period || "Mensual"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm font-extrabold text-[#0F172A] font-serif">
                          S/ {Number(inv.amount_pen).toFixed(2)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="capitalize font-bold text-slate-700 block">
                          {inv.payment_method}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {inv.invoice_number || "Sin N° registrado"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="uppercase text-[10px] font-bold rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 inline-block mb-1">
                          {inv.invoice_type || "Boleta"}
                        </span>
                        {inv.tax_id_number && (
                          <div className="text-[11px] font-mono text-slate-700">
                            {inv.tax_id_number}
                          </div>
                        )}
                        {inv.tax_legal_name && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                            {inv.tax_legal_name}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {inv.status === "paid" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Pagado
                          </span>
                        )}
                        {inv.status === "review_pending" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5">
                            <Clock className="w-3 h-3" />
                            Por Validar
                          </span>
                        )}
                        {inv.status === "failed" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-0.5">
                            <AlertCircle className="w-3 h-3" />
                            Rechazado
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <AdminVoucherReviewer invoice={inv} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No hay comprobantes en esta categoría</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Los pagos registrados por los abogados aparecerán aquí para tu aprobación.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
