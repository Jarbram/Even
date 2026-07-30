"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navegación inferior flotante. Los íconos son primitivas geométricas hechas con
 * divs, tal como los define el diseño — no hay set de íconos que importar.
 */
const TABS = [
  { href: "/", label: "Inicio" },
  { href: "/movimientos", label: "Movimientos" },
  { href: "/estadisticas", label: "Estadísticas" },
  { href: "/ajustes", label: "Ajustes" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-[max(1.375rem,env(safe-area-inset-bottom))] z-40 flex justify-center"
    >
      <ul className="glass-nav flex gap-1.5 rounded-[30px] p-2 shadow-[0_16px_36px_rgba(0,0,0,0.45)]">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                className="flex h-11 w-[52px] items-center justify-center rounded-[22px] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[active=true]:bg-primary data-[active=true]:shadow-[0_4px_16px_rgb(199_249_78/0.45)]"
                data-active={active}
              >
                <TabIcon href={tab.href} active={active} />
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
  if (href === "/estadisticas") {
    return (
      <div className="flex h-4 items-end gap-[3px]">
        {["h-[55%]", "h-full", "h-[35%]"].map((h) => (
          <div key={h} className={`w-1 rounded-[2px] ${h} ${fill}`} />
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
