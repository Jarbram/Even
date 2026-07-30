import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Independientes entre sí: en paralelo, no en cascada.
  const [{ data: profile }, { data: household }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user!.id).single(),
    supabase.from("households").select("name").single(),
  ]);

  const inicial = profile?.display_name?.[0]?.toUpperCase() ?? "?";

  return (
    <>
      <header className="mb-[26px] flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary text-[17px] font-bold text-foreground">
          {inicial}
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Hola, {profile?.display_name}
          </p>
          <p className="text-[13px] font-semibold">
            {household?.name}
          </p>
        </div>
      </header>

      <h1 className="text-[30px] leading-[1.15] font-extrabold tracking-[-0.5px]">
        ¿Listos para
        <br />
        este mes?
      </h1>

      {/* Fase 4 reemplaza esto por las tarjetas reales del dashboard. */}
      <p className="mt-6 text-sm text-muted-foreground">
        Aquí van el presupuesto restante, los ahorros y la deuda entre ustedes.
      </p>
    </>
  );
}
