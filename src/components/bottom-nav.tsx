"use client";

import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";

/**
 * Navegación inferior flotante. Los íconos son primitivas geométricas hechas con
 * divs, tal como los define el diseño — no hay set de íconos que importar.
 */
const TABS = [
  { href: "/", label: "Inicio" },
  { href: "/movimientos", label: "Movimientos" },
  { href: "/presupuesto", label: "Presupuesto" },
  { href: "/ajustes", label: "Ajustes" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      // Nombre propio para la transición de vista: sin esto, la navegación
      // la mete en la misma foto que el resto de la pantalla, y si dos
      // páginas miden distinto (una lista larga contra una corta) el grupo
      // raíz se estira entre esas dos alturas — y la barra fija se estira
      // con él, aunque ella no cambió nada.
      style={{ viewTransitionName: "bottom-nav" }}
      className="fixed inset-x-0 bottom-[max(1.375rem,env(safe-area-inset-bottom))] z-40 flex justify-center"
    >
      <ul className="panel-nav flex gap-1 rounded-[26px] p-2">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                // Antes solo llevaba `aria-label`: un rombo, una grilla y un
                // círculo con puntos no dicen nada a nadie que no se los
                // haya memorizado. La etiqueta ahora está en pantalla, no
                // solo para el lector de pantalla.
                className="flex h-12 flex-col items-center justify-center gap-1 rounded-[20px] px-2.5 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[active=true]:bg-primary data-[active=true]:shadow-[0_4px_16px_rgb(255_138_76/0.45)]"
                data-active={active}
              >
                <TabIcon href={tab.href} active={active} />
                <span
                  className="text-[10px] leading-none font-semibold whitespace-nowrap text-muted-foreground data-[active=true]:text-primary-foreground"
                  data-active={active}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function TabIcon({ href, active }: { href: string; active: boolean }) {
  const fill = active ? "bg-primary-foreground" : "bg-muted-foreground";
  const stroke = active ? "border-primary-foreground" : "border-muted-foreground";

  if (href === "/") {
    return <div className={`size-[13px] rotate-45 rounded-[3px] ${fill}`} />;
  }
  if (href === "/movimientos") {
    return (
      <div className="grid size-4 grid-cols-2 grid-rows-2 gap-[3px]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`rounded-[3px] ${fill}`} />
        ))}
      </div>
    );
  }
  if (href === "/presupuesto") {
    // Barras de distinto largo: lo repartido a cada categoría.
    return (
      <div className="flex w-4 flex-col gap-[3px]">
        {["w-full", "w-2/3", "w-1/3"].map((ancho) => (
          <div key={ancho} className={`h-1 rounded-[2px] ${ancho} ${fill}`} />
        ))}
      </div>
    );
  }
  return (
    <div className="relative size-[17px]">
      <div className={`absolute inset-0 rounded-full border-2 ${stroke}`} />
      <div className={`absolute top-1/2 left-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full ${fill}`} />
      <div className={`absolute -top-0.5 left-1/2 size-[3px] -translate-x-1/2 rounded-full ${fill}`} />
      <div className={`absolute -bottom-0.5 left-1/2 size-[3px] -translate-x-1/2 rounded-full ${fill}`} />
      <div className={`absolute top-1/2 -left-0.5 size-[3px] -translate-y-1/2 rounded-full ${fill}`} />
      <div className={`absolute top-1/2 -right-0.5 size-[3px] -translate-y-1/2 rounded-full ${fill}`} />
    </div>
  );
}
