import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const mode = searchParams.get("mode") ?? "login";
  const roleParam = searchParams.get("role") ?? "client";
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // 1. Verificar si el usuario ya tiene un perfil registrado en ALYA
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();

        // CASO A: Viene de Iniciar Sesión (mode === "login") y NO tiene cuenta registrada previa:
        if (mode === "login" && !profile) {
          // Desconectar sesión huérfana de OAuth
          await supabase.auth.signOut();
          const userEmail = encodeURIComponent(user.email || "");
          return NextResponse.redirect(
            `${origin}/login?error=account_not_found&email=${userEmail}`
          );
        }

        // CASO B: Viene de Crear Cuenta (mode === "signup") y YA tiene perfil registrado:
        if (mode === "signup" && profile) {
          const userEmail = encodeURIComponent(user.email || "");
          return NextResponse.redirect(
            `${origin}/login?message=existing_account&email=${userEmail}`
          );
        }

        // CASO C: Viene de Crear Cuenta (mode === "signup") y es nuevo usuario:
        // No creamos el perfil a ciegas. Lo redirigimos a la pantalla de configuración asistida con contraseña y rol
        if (mode === "signup" && !profile) {
          return NextResponse.redirect(
            `${origin}/register/setup-password?role=${encodeURIComponent(roleParam)}`
          );
        }

        // CASO D: Usuario existente autenticado con éxito
        const effectiveRole = (profile?.role || "client").toLowerCase();

        if (effectiveRole === "lawyer") {
          const { data: lawyer } = await supabase
            .from("lawyer_profiles")
            .select("id, verification_status, is_activated")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!lawyer) {
            return NextResponse.redirect(`${origin}/onboarding/lawyer`);
          }

          return NextResponse.redirect(`${origin}/lawyer/dashboard`);
        }

        if (effectiveRole === "admin" || effectiveRole === "verifier") {
          return NextResponse.redirect(`${origin}/admin/verifications`);
        }

        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
