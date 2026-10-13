import { redirect } from "next/navigation";
export { DEFAULT_SPECIALTIES, CURATED_PERUVIAN_LAWYERS } from "@/lib/constants/lawyers";

export default function CasesNewRedirectPage() {
  redirect("/dashboard");
}
