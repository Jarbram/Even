import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/sign-out";
import { Button } from "@/components/ui/button";

export default async function AjustesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS limita `households` al hogar del usuario, así que un select plano basta.
  const { data: household } = await supabase
    .from("households")
    .select("name, invite_code")
    .single();

  const { data: miembros } = await supabase
    .from("profiles")
    .select("id, display_name")
    .order("created_at");

  return (
    <>
      <h1 className="mb-[22px] text-2xl font-extrabold">Ajustes</h1>

      <p className="mb-2.5 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
        Hogar
      </p>
      <div className="glass mb-6 rounded-xl p-5">
        <p className="text-sm font-semibold">{household?.name}</p>
        <p className="mt-4 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
          Código de invitación
        </p>
        <p className="mt-1 text-3xl font-extrabold tracking-[0.3em] text-primary">
          {household?.invite_code}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          {miembros?.length === 1
            ? "Pásaselo a tu pareja para que entre al mismo hogar."
            : `Integrantes: ${miembros?.map((m) => m.display_name).join(" y ")}`}
        </p>
      </div>

      <p className="mb-2.5 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
        Cuenta
      </p>
      <div className="glass mb-2.5 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <form action={signOut}>
        <Button
          type="submit"
          variant="ghost"
          className="glass h-auto w-full justify-start rounded-lg p-4 text-sm font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          Cerrar sesión
        </Button>
      </form>
    </>
  );
}
