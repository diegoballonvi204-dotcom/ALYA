"use server";

import { createClient } from "@/lib/supabase/server";
import { LoginSchema, RegisterSchema } from "@/lib/validations/auth.schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const parsed = LoginSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      error: "Datos de acceso incompletos o inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role === "lawyer") {
      const { data: lawyer } = await supabase
        .from("lawyer_profiles")
        .select("id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!lawyer) {
        redirect("/onboarding/lawyer");
      }
      redirect("/lawyer/dashboard");
    }

    if (profile?.role === "admin") {
      redirect("/admin/verifications");
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function registerAction(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const parsed = RegisterSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      error: "Por favor corrige los errores en el formulario",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        role: parsed.data.role,
        city: "Lima",
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Redirigir según el rol elegido
  if (parsed.data.role === "lawyer") {
    redirect("/onboarding/lawyer");
  } else {
    redirect("/onboarding/client");
  }
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function completeGoogleSignupAction(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  
  const firstName = String(rawData.firstName || "").trim();
  const lastName = String(rawData.lastName || "").trim();
  const rawRole = String(rawData.role || "client").trim().toLowerCase();
  const role: "client" | "lawyer" = rawRole === "lawyer" ? "lawyer" : "client";
  const password = String(rawData.password || "");
  const confirmPassword = String(rawData.confirmPassword || "");

  if (firstName.length < 2) {
    return { error: "Ingresa tus nombres completos" };
  }
  if (lastName.length < 2) {
    return { error: "Ingresa tus apellidos completos" };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres" };
  }
  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesión de Google no encontrada o expirada. Por favor vuelve a registrarte." };
  }

  // 1. Establecer la contraseña personal para el usuario
  const { error: pwdErr } = await supabase.auth.updateUser({ password });
  if (pwdErr) {
    return { error: `Error estableciendo contraseña: ${pwdErr.message}` };
  }

  // 2. Preservar roles privilegiados existentes si ya tenía perfil y crear/actualizar en profiles
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const finalRole =
    existingProfile?.role === "admin" || existingProfile?.role === "verifier"
      ? existingProfile.role
      : role;

  const { error: profileErr } = await supabase.from("profiles").upsert({
    id: user.id,
    role: finalRole,
    first_name: firstName,
    last_name: lastName,
    city: "Lima",
  });

  if (profileErr) {
    return { error: `Error creando perfil: ${profileErr.message}` };
  }

  revalidatePath("/", "layout");

  if (role === "lawyer") {
    redirect("/onboarding/lawyer");
  } else {
    redirect("/dashboard");
  }
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Ingresa un correo electrónico válido." };
  }

  try {
    const supabase = await createClient();
    const { headers } = await import("next/headers");
    const hdrs = await headers();
    const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "";
    const proto = hdrs.get("x-forwarded-proto") || "https";
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (host ? `${host.includes("localhost") ? "http" : proto}://${host}` : "");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: siteUrl ? `${siteUrl}/login` : undefined,
    });

    if (error) {
      return { error: error.message };
    }

    return {
      success: true,
      message:
        "Si el correo existe en nuestra plataforma, recibirás un enlace en pocos minutos para restablecer tu contraseña.",
    };
  } catch (err: any) {
    return { error: err?.message || "Error al solicitar recuperación de contraseña." };
  }
}

