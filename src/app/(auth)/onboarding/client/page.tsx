import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientOnboardingForm } from "@/components/forms/ClientOnboardingForm";

export default async function ClientOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding/client");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, city")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 sm:p-8">
      <ClientOnboardingForm
        initialData={{
          firstName: profile?.first_name || "",
          lastName: profile?.last_name || "",
          city: profile?.city || "Lima",
        }}
      />
    </div>
  );
}
