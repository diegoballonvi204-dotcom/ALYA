-- Script de Limpieza Integral de Datos en Supabase (ALYA Perú)
-- Elimina todos los usuarios, perfiles, casos, matches, mensajes y archivos subidos.
-- CONSERVA el catálogo de especialidades (32 especialidades) y planes de suscripción.

-- 1. Vaciar todas las tablas transaccionales y de usuarios en cascada
TRUNCATE TABLE 
  public.messages,
  public.conversations,
  public.case_documents,
  public.matches,
  public.cases,
  public.fee_agreements,
  public.consultations,
  public.payout_requests,
  public.reviews,
  public.favorites,
  public.notifications,
  public.lawyer_schedules,
  public.verifications,
  public.audit_logs,
  public.reports,
  public.arco_requests,
  public.subscription_invoices,
  public.lawyer_subscriptions,
  public.lawyer_specialties,
  public.lawyer_profiles,
  public.profiles
CASCADE;

-- 2. Limpiar todos los archivos subidos al Storage
DELETE FROM storage.objects;

-- 3. Eliminar todos los usuarios registrados en Supabase Auth
DELETE FROM auth.users;
