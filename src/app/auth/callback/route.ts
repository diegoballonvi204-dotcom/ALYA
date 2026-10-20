import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const roleParam = searchParams.get("role");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // 1. Obtener o crear perfil del usuario
        let { data: profile } = await supabase
          .from("profiles")
          .select("role, first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();

        const meta = user.user_metadata || {};
        const fullName = (meta.full_name || meta.name || "").trim();
        const nameParts = fullName.split(" ");
        const firstName = meta.given_name || meta.first_name || nameParts[0] || "Usuario";
        const lastName = meta.family_name || meta.last_name || nameParts.slice(1).join(" ") || "";

        const targetRole = roleParam === "lawyer" ? "lawyer" : (profile?.role || "client");

        if (!profile) {
          const { data: newProfile } = await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              role: targetRole as any,
              first_name: firstName,
              last_name: lastName,
              city: "Lima",
            })
            .select("role, first_name, last_name")
            .single();
          profile = newProfile;
        } else if (roleParam === "lawyer" && profile.role !== "lawyer") {
          await supabase
            .from("profiles")
            .update({ role: "lawyer" })
            .eq("id", user.id);
          profile.role = "lawyer";
        }

        const effectiveRole = (profile?.role || targetRole || "client").toLowerCase();

        // 2. Redirección inteligente según rol y estado
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
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
