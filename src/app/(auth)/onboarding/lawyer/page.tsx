import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LawyerOnboardingForm } from "@/components/forms/LawyerOnboardingForm";

export default async function LawyerOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding/lawyer");
  }

  // Cargar catálogo de especialidades desde la BD de Supabase
  const { data: specialties } = await supabase
    .from("specialties")
    .select("id, name, slug, parent_id")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-8">
      <LawyerOnboardingForm
        specialties={specialties || []}
        userEmail={user.email || ""}
      />
    </div>
  );
}
