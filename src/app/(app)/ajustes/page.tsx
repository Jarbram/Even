import Link from "next/link";
import {
  Banknote,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Landmark,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { redirect } from "next/navigation";
import { NOMBRES, PERSONAS, laOtra } from "@/lib/persona";
import { cerrarSesion, requirePersona } from "@/lib/sesion";
import { gastosPorCobrar, listarCuentas, resumenDelMes } from "@/lib/datos";
import {
  TIPOS_CUENTA,
  claseInsignia,
  leerSaldo,
  type CuentaRow,
  type TipoCuenta,
} from "@/lib/cuentas";
import { hoyISO, progresoFondo, redondear, soles } from "@/lib/finanzas";
import { Button } from "@/components/ui/button";
import { BotonBorrar } from "@/components/boton-borrar";
import { borrarFondo } from "../acciones";
import {
  MoverEnFondo,
  NuevaCuenta,
  NuevoFondo,
  SaldarReembolso,
} from "./formularios";

export default async function AjustesPage() {
  const persona = await requirePersona();
  const [cuentas, { fondos, gastos }, porCobrar] = await Promise.all([
    listarCuentas(),
    resumenDelMes(),
    gastosPorCobrar(),
  ]);

  // Cuánto ha salido por cada cuenta este mes. Una billetera sin una cifra al
  // lado no dice nada; con ella, la lista contesta "¿por dónde se nos va?".
  const gastadoPorCuenta = new Map<string, number>();
  for (const gasto of gastos) {
    if (!gasto.cuenta_id) continue;
    gastadoPorCuenta.set(
      gasto.cuenta_id,
      (gastadoPorCuenta.get(gasto.cuenta_id) ?? 0) + gasto.monto,
    );
  }

  async function salir() {
    "use server";
    await cerrarSesion();
    redirect("/entrar");
  }

  return (
    <>
      <h1 className="mb-7 text-2xl font-extrabold">Ajustes</h1>

      <Seccion titulo="Billeteras">
        {cuentas.length === 0 ? (
          // Un único vacío para la sección. Antes salía la misma frase repetida
          // una vez por persona, que es ruido diciendo dos veces "aquí no hay
          // nada".
          <p className="glass rounded-lg px-4 py-3.5 text-sm text-muted-foreground">
            Sin cuentas todavía. Añade el efectivo, las tarjetas y el Yape de
            cada uno para saber por dónde se va la plata.
          </p>
        ) : (
          PERSONAS.map((quien) => {
            const suyas = cuentas.filter((c) => c.persona === quien);
            if (suyas.length === 0) return null;

            return (
              <div key={quien} className="mb-4 last:mb-0">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    data-persona={quien}
                    className="flex size-6 items-center justify-center rounded-full text-[11px] font-bold data-[persona=abraham]:bg-secondary data-[persona=isabel]:bg-chart-6"
                  >
                    {NOMBRES[quien][0]}
                  </span>
                  <span className="text-sm font-semibold">{NOMBRES[quien]}</span>
                  {quien === persona && (
                    <span className="text-[11px] text-muted-foreground">
                      (tú)
                    </span>
                  )}
                </div>

                <ul className="grid grid-cols-2 gap-2.5">
                  {suyas.map((cuenta) => (
                    <li key={cuenta.id}>
                      <TarjetaCuenta
                        cuenta={cuenta}
                        gastado={gastadoPorCuenta.get(cuenta.id) ?? 0}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}

        <div className="mt-2.5">
          <NuevaCuenta persona={persona} />
        </div>
      </Seccion>

      {porCobrar.length > 0 && (
        <Seccion titulo="Por cobrar">
          <ul className="flex flex-col gap-2">
            {porCobrar.map((gasto) => {
              const deudor = laOtra(gasto.pagado_por);
              return (
                <li key={gasto.id}>
                  <details className="glass rounded-xl [&[open]_.marca]:rotate-180">
                    <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {gasto.descripcion}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {NOMBRES[deudor]} le debe a {NOMBRES[gasto.pagado_por]}{" "}
                          · {gasto.categoria}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold">
                        {soles(gasto.monto)}
                      </span>
                      <ChevronDown
                        aria-hidden
                        className="marca size-4 shrink-0 text-muted-foreground transition-transform duration-200"
                      />
                    </summary>
                    <div className="border-t border-border p-4">
                      <SaldarReembolso
                        gastoId={gasto.id}
                        monto={gasto.monto}
                        cuentasDesde={cuentas.filter((c) => c.persona === deudor)}
                        cuentasHacia={cuentas.filter(
                          (c) => c.persona === gasto.pagado_por,
                        )}
                        hoy={hoyISO()}
                      />
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </Seccion>
      )}

      <Seccion titulo="Metas compartidas">
        {fondos.length === 0 ? (
          <p className="glass rounded-lg px-4 py-3.5 text-sm text-muted-foreground">
            Sin fondos de ahorro. Crea el primero: un viaje, el colchón de
            emergencia.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {fondos.map((fondo) => {
              const progreso = progresoFondo(fondo);
              return (
                <li key={fondo.id} className="glass rounded-lg p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {fondo.nombre}
                    </span>
                    <span className="shrink-0 text-lg font-bold text-primary">
                      {soles(fondo.saldo)}
                    </span>
                    <BotonBorrar
                      accion={borrarFondo.bind(null, fondo.id)}
                      que="el fondo"
                      etiqueta={fondo.nombre}
                    />
                  </div>

                  {fondo.meta && (
                    <>
                      <div
                        className="glass-hueco mt-2.5 h-1.5 overflow-hidden rounded-full"
                        role="progressbar"
                        aria-label={`${fondo.nombre}: ${soles(fondo.saldo)} de ${soles(fondo.meta)}`}
                        aria-valuenow={Math.round(progreso.proporcion * 100)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="barra h-full rounded-full bg-primary"
                          style={{ width: `${progreso.proporcion * 100}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {progreso.completado
                          ? progreso.resumen
                          : `${Math.round(progreso.proporcion * 100)} % de ${soles(fondo.meta)} · ${progreso.resumen}`}
                      </p>
                    </>
                  )}

                  <MoverEnFondo id={fondo.id} nombre={fondo.nombre} />
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-2.5">
          <NuevoFondo />
        </div>
      </Seccion>

      {/*
        La salida va separada del resto por una línea y no como un enlace más:
        es la única acción de esta pantalla que se puede lamentar, y estaba al
        mismo peso visual que "Gastos recurrentes".
      */}
      <div className="mt-10 border-t border-border pt-6">
        <p className="mb-3 text-center text-xs text-muted-foreground">
          Estás como <span className="font-semibold">{NOMBRES[persona]}</span> en
          este dispositivo
        </p>
        <form action={salir}>
          <Button
            type="submit"
            variant="ghost"
            className="h-auto w-full justify-center rounded-lg p-4 text-sm font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Cerrar sesión
          </Button>
        </form>
      </div>
    </>
  );
}

const ICONO_TIPO: Record<TipoCuenta, LucideIcon> = {
  efectivo: Banknote,
  debito: Landmark,
  credito: CreditCard,
  billetera: Wallet,
};

/**
 * Una cuenta en tarjeta: insignia por tipo (así se distingue una tarjeta de
 * un débito sin leer la letra chica), el saldo en grande y, en una de
 * crédito, cuánto cupo se ha consumido — antes ese dato solo salía como
 * texto ("S/ X usados"), y una barra se lee sin hacer la resta uno mismo.
 */
function TarjetaCuenta({
  cuenta,
  gastado,
}: {
  cuenta: CuentaRow;
  gastado: number;
}) {
  const saldo = leerSaldo(cuenta);
  const Icono = ICONO_TIPO[cuenta.tipo];

  return (
    <Link
      href={`/cuentas/${cuenta.id}`}
      className="glass-accion group flex flex-col gap-3 rounded-xl p-3.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex items-center justify-between">
        <span
          aria-hidden
          className={`flex size-9 items-center justify-center rounded-full ${claseInsignia(cuenta.color)}`}
        >
          <Icono aria-hidden className="size-4" />
        </span>
        <ChevronRight
          aria-hidden
          className="size-4 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100"
        />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{cuenta.nombre}</p>
        <p className="text-[11px] text-muted-foreground">
          {TIPOS_CUENTA[cuenta.tipo]}
        </p>
      </div>

      <div>
        <p
          data-negativo={!saldo.esCredito && saldo.principal < 0}
          className="truncate text-lg font-extrabold tracking-[-0.3px] data-[negativo=true]:text-destructive"
        >
          {soles(saldo.principal)}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {saldo.esCredito
            ? "disponible"
            : gastado > 0
              ? `−${soles(redondear(gastado))} este mes`
              : "saldo"}
        </p>
      </div>

      {saldo.esCredito && (
        <div
          className="glass-hueco h-1.5 overflow-hidden rounded-full"
          role="img"
          aria-label={`${soles(saldo.consumido)} usados de ${soles(cuenta.linea ?? 0)}`}
        >
          <div
            className="barra h-full rounded-full bg-secondary"
            style={{ width: `${saldo.proporcion * 100}%` }}
          />
        </div>
      )}
    </Link>
  );
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-9">
      <h2 className="mb-3 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

