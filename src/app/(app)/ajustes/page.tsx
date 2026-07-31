import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";
import { NOMBRES, PERSONAS } from "@/lib/persona";
import { cerrarSesion, requirePersona } from "@/lib/sesion";
import { listarCuentas, resumenDelMes } from "@/lib/datos";
import { TIPOS_CUENTA, claseColor } from "@/lib/cuentas";
import { progresoFondo, soles } from "@/lib/finanzas";
import { Button } from "@/components/ui/button";
import { NuevaCuenta, NuevoFondo } from "./formularios";

export default async function AjustesPage() {
  const persona = await requirePersona();
  const [cuentas, { fondos }] = await Promise.all([
    listarCuentas(),
    resumenDelMes(),
  ]);

  async function salir() {
    "use server";
    await cerrarSesion();
    redirect("/entrar");
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-extrabold">Ajustes</h1>

      <p className="mb-3 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
        Billeteras
      </p>

      {PERSONAS.map((quien) => {
        const suyas = cuentas.filter((c) => c.persona === quien);
        return (
          <section key={quien} className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <span
                data-persona={quien}
                className="flex size-6 items-center justify-center rounded-full text-[11px] font-bold data-[persona=abraham]:bg-secondary data-[persona=isabel]:bg-chart-6"
              >
                {NOMBRES[quien][0]}
              </span>
              <span className="text-sm font-semibold">{NOMBRES[quien]}</span>
              {quien === persona && (
                <span className="text-[11px] text-muted-foreground">(tú)</span>
              )}
            </div>

            {suyas.length === 0 ? (
              <p className="glass rounded-lg px-4 py-3 text-xs text-muted-foreground">
                Sin cuentas todavía.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {suyas.map((cuenta) => (
                  <li
                    key={cuenta.id}
                    className="glass flex items-center gap-3 rounded-lg px-4 py-3"
                  >
                    <span
                      aria-hidden
                      className={`size-2 shrink-0 rounded-full ${claseColor(cuenta.color)}`}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {cuenta.nombre}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {TIPOS_CUENTA[cuenta.tipo]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <NuevaCuenta persona={persona} />

      <p className="mt-8 mb-3 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
        Metas compartidas
      </p>

      {fondos.length === 0 ? (
        <p className="glass mb-2.5 rounded-lg px-4 py-3 text-xs text-muted-foreground">
          Sin fondos de ahorro. Crea el primero: un viaje, el colchón de
          emergencia.
        </p>
      ) : (
        <ul className="mb-2.5 flex flex-col gap-2">
          {fondos.map((fondo) => {
            const progreso = progresoFondo(fondo);
            return (
              <li key={fondo.id} className="glass rounded-lg p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-semibold">
                    Ahorro → {fondo.nombre}
                  </span>
                  <span className="shrink-0 text-sm font-bold text-primary">
                    {soles(fondo.saldo)}
                  </span>
                </div>

                {fondo.meta && (
                  <>
                    <div
                      className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-label={`${fondo.nombre}: ${soles(fondo.saldo)} de ${soles(fondo.meta)}`}
                      aria-valuenow={Math.round(progreso.proporcion * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${progreso.proporcion * 100}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {Math.round(progreso.proporcion * 100)} % de la meta ·{" "}
                      {soles(fondo.meta)}
                    </p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <NuevoFondo />

      <nav className="mt-8 flex flex-col gap-2.5">
        <Enlace href="/presupuesto">Categorías y presupuestos</Enlace>
        <Enlace href="/recurrentes">Gastos recurrentes</Enlace>
        <Enlace href="/deudas">Deudas y simulador</Enlace>
      </nav>

      <form action={salir} className="mt-2.5">
        <Button
          type="submit"
          variant="ghost"
          className="glass h-auto w-full justify-start rounded-lg p-4 text-sm font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          Cerrar sesión
        </Button>
      </form>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Sesión de {NOMBRES[persona]} en este dispositivo
      </p>
    </>
  );
}

function Enlace({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="glass flex items-center justify-between rounded-lg p-4 text-sm font-semibold transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {children}
      <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
    </Link>
  );
}
