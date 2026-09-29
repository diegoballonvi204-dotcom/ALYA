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
