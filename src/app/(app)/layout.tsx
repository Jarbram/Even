import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single();

  if (!profile?.household_id) redirect("/bienvenida");

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[430px]">
      {/* pb generoso: la navegación flota encima del contenido */}
      <div className="px-[22px] pt-[26px] pb-32">{children}</div>
      <BottomNav />
    </div>
  );
}
