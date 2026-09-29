import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Rutas que requieren autenticación
  const isProtected =
    path.startsWith("/dashboard") ||
    path.startsWith("/lawyer") ||
    path.startsWith("/cases") ||
    path.startsWith("/admin") ||
    path.startsWith("/onboarding") ||
    path.startsWith("/chat");

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  // Si el usuario ya está autenticado e intenta acceder a la landing page o login/registro, redirigir a su portal
  if (user && (path === "/" || path === "/login" || path === "/register")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = (profile?.role || "client").toLowerCase();
    if (role === "admin" || role === "verifier") {
      return NextResponse.redirect(new URL("/admin", request.url));
    } else if (role === "lawyer") {
      return NextResponse.redirect(new URL("/lawyer/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Si está autenticado, verificar control de rol únicamente en secciones con privilegios de rol
  if (user && isProtected) {
    const isRoleSensitive = path.startsWith("/admin") || path.startsWith("/lawyer");
    if (isRoleSensitive) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (path.startsWith("/admin") && profile?.role !== "admin" && profile?.role !== "verifier") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      if (path.startsWith("/lawyer") && profile?.role !== "lawyer" && !path.startsWith("/onboarding")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
