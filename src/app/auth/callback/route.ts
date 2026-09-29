import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Verificar rol del usuario para redirigir adecuadamente
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "lawyer") {
          // Verificar si ya completó su perfil
          const { data: lawyer } = await supabase
            .from("lawyer_profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!lawyer) {
            return NextResponse.redirect(`${origin}/onboarding/lawyer`);
          }
          return NextResponse.redirect(`${origin}/lawyer/dashboard`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
