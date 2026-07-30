import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForms } from "./onboarding-forms";

export default async function BienvenidaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, display_name")
    .eq("id", user.id)
    .single();

  if (profile?.household_id) redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center px-6 py-12">
      <h1 className="text-[30px] leading-[1.15] font-extrabold tracking-[-0.5px]">
        Hola, {profile?.display_name ?? "qué tal"}
      </h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">
        Crea el hogar o únete al que ya creó tu pareja.
      </p>
      <OnboardingForms />
    </main>
  );
}
