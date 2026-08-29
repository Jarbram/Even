import { requirePersona } from "@/lib/sesion";
import { conceptosUsados, resumenDelMes, type IngresoRow } from "@/lib/datos";
import { NOMBRES } from "@/lib/persona";
import { claseColor } from "@/lib/cuentas";
import {
  diasDelMes,
  hoyISO,
  mesActual,
  redondear,
  soles,
  type Mes,
} from "@/lib/finanzas";
import type { CuentaRow } from "@/lib/cuentas";
import type { FondoRow } from "@/lib/datos";
import { BotonCerrar, NavegadorMes } from "@/components/navegacion";
import { BotonBorrar } from "@/components/boton-borrar";
import { CabeceraDia } from "@/components/cabecera-dia";
import { EditarIngreso } from "@/components/editar-ingreso";
import { Plegable } from "@/components/plegable";
import { borrarIngreso } from "../acciones";
import { FormularioIngreso } from "./formulario-ingreso";

/**
 * Registrar y revisar en la misma pantalla. Al sacar los ingresos de
 * presupuesto se podían cargar pero no ver: un sueldo mal tecleado no había
 * forma de encontrarlo, y menos de corregirlo.
 *
 * Por día y no una lista corrida: un mes con sueldo, dos ventas y un regalo
 * son cuatro fechas distintas, y "¿cuándo entró?" es la pregunta con la que
 * se busca uno concreto.
 */

const DIA_LARGO = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const ES_MES = /^\d{4}-\d{2}-01$/;

export default async function IngresosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const persona = await requirePersona();
  const params = await searchParams;

  // Viene de la URL, así que se valida antes de consultar con él.
  const mes: Mes = ES_MES.test(params.mes ?? "") ? params.mes! : mesActual();

  const [{ ingresos, ingresosTotal, cuentas, fondos }, conceptos] =
    await Promise.all([resumenDelMes(mes), conceptosUsados()]);

  const hoy = hoyISO();
  const diasConIngreso = new Set(ingresos.map((i) => i.fecha)).size;

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Ingresos</h1>
        <BotonCerrar href="/" />
      </div>

      <div className="panel mb-6 rounded-xl p-5">
        <NavegadorMes mes={mes} href={(m) => `/ingresos?mes=${m}`} />

        <p className="text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
          Entró este mes
        </p>
        <p className="mt-1.5 text-[30px] font-extrabold tracking-[-0.5px] text-ok">
          {soles(ingresosTotal)}
        </p>
        {ingresos.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {ingresos.length} {ingresos.length === 1 ? "ingreso" : "ingresos"} en{" "}
            {diasConIngreso} {diasConIngreso === 1 ? "día" : "días"}
          </p>
        )}
      </div>

      {ingresos.length === 0 ? (
        <p className="panel mb-3 rounded-lg p-4 text-sm text-muted-foreground">
          Este mes no ha entrado nada todavía.
        </p>
      ) : (
        <div className="mb-3">
          <ListaPorDia
            ingresos={ingresos}
            hoy={hoy}
            cuentas={cuentas}
            fondos={fondos}
            conceptos={conceptos}
          />
        </div>
      )}

      {/* Plegado, salvo cuando el mes está vacío: la pantalla es para revisar
          lo que entró, y el formulario abierto ponía mil píxeles de campos
          justo debajo de lo que se venía a leer. Con el mes en blanco no hay
          nada que revisar, así que ahí abre solo. */}
      <Plegable titulo="Registrar un ingreso" abierto={ingresos.length === 0}>
        <FormularioIngreso
          persona={persona}
          // Mirando un mes pasado, el calendario arranca en ese mes y no en
          // hoy: si no, cargar algo viejo se guardaba en el mes en curso sin
          // querer.
          fecha={mes === mesActual() ? hoy : `${mes.slice(0, 8)}${diasDelMes(mes)}`}
          cuentas={cuentas}
          fondos={fondos}
          conceptos={conceptos}
        />
      </Plegable>
    </>
  );
}

/** Los ingresos agrupados por día, con su total. Ya vienen ordenados. */
function ListaPorDia({
  ingresos,
  hoy,
  cuentas,
  fondos,
  conceptos,
}: {
  ingresos: IngresoRow[];
  hoy: string;
  cuentas: CuentaRow[];
  fondos: FondoRow[];
  conceptos: string[];
}) {
  const porDia = new Map<string, IngresoRow[]>();
  for (const ingreso of ingresos) {
    porDia.set(ingreso.fecha, [...(porDia.get(ingreso.fecha) ?? []), ingreso]);
  }

  return [...porDia.entries()].map(([fecha, delDia]) => (
    <section key={fecha} className="mb-5">
      <CabeceraDia
        total={soles(redondear(delDia.reduce((suma, i) => suma + i.monto, 0)))}
      >
        {fecha === hoy ? "Hoy" : DIA_LARGO.format(new Date(`${fecha}T00:00:00Z`))}
      </CabeceraDia>

      <ul className="flex flex-col gap-2">
        {delDia.map((ingreso) => (
          <li
            key={ingreso.id}
            className="panel flex items-center gap-3 rounded-lg px-4 py-3"
          >
            <span
              aria-hidden
              className={`size-2 shrink-0 rounded-full ${
                ingreso.fondos ? "bg-primary" : claseColor(ingreso.cuentas?.color)
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {ingreso.descripcion}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {NOMBRES[ingreso.persona]}
                {ingreso.fondos && ` · al ahorro ${ingreso.fondos.nombre}`}
                {ingreso.cuentas && ` · a ${ingreso.cuentas.nombre}`}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold">
              {soles(ingreso.monto)}
            </span>
            <EditarIngreso
              ingreso={ingreso}
              cuentas={cuentas}
              fondos={fondos}
              conceptos={conceptos}
            />
            <BotonBorrar
              accion={borrarIngreso.bind(null, ingreso.id)}
              que="el ingreso"
              etiqueta={`${ingreso.descripcion}, ${soles(ingreso.monto)}`}
            />
          </li>
        ))}
      </ul>
    </section>
  ));
}
