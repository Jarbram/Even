import { requirePersona } from "@/lib/sesion";
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePersona();

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[430px]">
      {/* pb generoso: la navegación flota encima del contenido y taparía el
          último botón de un formulario largo. */}
      <div className="px-[22px] pt-[26px] pb-40">{children}</div>
      <BottomNav />
    </div>
  );
}
