import { ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { Link } from "next-view-transitions";
import { NOMBRES, laOtra } from "@/lib/persona";
import { requirePersona } from "@/lib/sesion";
import {
  categoriasUsadas,
  conceptosUsados,
  cuentaPorCategoria,
  descripcionesUsadas,
  resumenDelMes,
  type GastoRow,
} from "@/lib/datos";
import { hoyISO, nombreMes, redondear, soles } from "@/lib/finanzas";
import { leerSaldo } from "@/lib/cuentas";
import { AvatarPersona } from "@/components/avatar-persona";
import { TarjetaCategoria } from "@/components/tarjeta-categoria";
import { FormularioGastoRapido } from "./formulario-gasto-rapido";
import { FormularioIngresoRapido } from "./formulario-ingreso-rapido";

export default async function HomePage() {
  const persona = await requirePersona();
  const [
    { mes, gastos, restante, ahorros, presupuesto, fondos, lineas, cuentas },
    categorias,
    conceptos,
    descripciones,
    cuentaSugerida,
  ] = await Promise.all([
    resumenDelMes(),
    categoriasUsadas(),
    conceptosUsados(),
    descripcionesUsadas(),
    cuentaPorCategoria(),
  ]);

  const sinTopes = presupuesto.estado === "sin-topes";
  const excedidos = restante < 0;
  // Solo las que tienen tope: son las únicas con un límite que graficar. Ya
  // vienen ordenadas por urgencia (lineasPresupuesto), así que el filtro no
  // rompe el orden: lo excedido sigue apareciendo primero en la tira.
  const conTope = lineas.filter((l) => l.presupuestado > 0);

  // Plata de verdad, no ahorros ni cupo de tarjeta: lo que hay hoy en
  // efectivo, débito o billetera. Los fondos son plata ya apartada para otra
  // cosa, y el "disponible" de una tarjeta es crédito, no dinero propio —
  // mezclarlos haría parecer que hay más de lo que en realidad se puede gastar.
  const cuentasLiquidas = cuentas.filter((c) => c.tipo !== "credito");
  const disponible = redondear(
    cuentasLiquidas.reduce((suma, c) => suma + c.saldo, 0),
  );

  // El crédito disponible no entra en "Dinero disponible" —es deuda, no
  // plata propia—, pero tampoco se queda sin mostrar en ningún lado: antes
  // solo se veía entrando a Ajustes y tocando cada tarjeta una por una.
  const cuentasCredito = cuentas.filter((c) => c.tipo === "credito");
  const creditoDisponible = redondear(
    cuentasCredito.reduce((suma, c) => suma + leerSaldo(c).principal, 0),
  );

  // Para el detalle de cada card de categoría: sus últimos gastos, sin
  // consultar de nuevo — ya vienen cargados en `gastos`.
  const gastosPorCategoria = new Map<string, GastoRow[]>();
  for (const gasto of gastos) {
    gastosPorCategoria.set(gasto.categoria, [
      ...(gastosPorCategoria.get(gasto.categoria) ?? []),
      gasto,
    ]);
  }

  return (
    <>
      {/*
        Antes: fila de avatar + "Hogar Abraham & Isabel", y debajo un h1 de
        dos líneas ("¿Listos para este mes?") con el mes en una tercera. Tres
        bloques de texto para decir cuatro datos (quién eres, con quién, qué
        mes es) antes de llegar a lo que de verdad se usa a diario.

        Ahora es una sola fila: el saludo hace de h1 (es el único título real
        de la pantalla), el mes y la pareja bajan de peso como subtítulo, y
        el ícono de Ajustes sube a 44 px —el mínimo táctil— para pesar lo
        mismo que el avatar y cerrar la fila con una simetría intencional en
        vez de un botón chico perdido a la derecha.

        El avatar ya no es un gradiente genérico: cada persona tiene su
        propio color, el mismo que usa en Ajustes para distinguir de quién
        es cada cuenta — el mismo gesto de identidad que Yape o Plin, donde
        siempre sabes con un vistazo con quién estás tratando.
      */}
      <header className="mb-8 flex items-center gap-3">
        <AvatarPersona persona={persona} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[19px] font-extrabold tracking-[-0.3px]">
            Hola, {NOMBRES[persona]}
          </h1>
          <p className="mt-0.5 truncate text-[13px] font-medium text-muted-foreground">
            {nombreMes(mes)} · con {NOMBRES[laOtra(persona)]}
          </p>
        </div>
        <Link
          href="/ajustes"
          aria-label="Ajustes"
          className="panel-accion flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <SlidersHorizontal aria-hidden className="size-[18px]" />
        </Link>
      </header>

      {/*
        Anotar un gasto o un ingreso es lo que se hace a diario; las cifras
        de abajo son para consultar, no para actuar. Por eso los botones van
        primero, antes de tener que pasar por tarjetas para llegar a ellos —
        y lado a lado, porque son la misma clase de acción.

        Los dos abren una hoja desde abajo con el formulario completo, no un
        enlace a otra pantalla: el Home no se mueve, solo sube un panel
        encima y se cierra solo al guardar.
      */}
      <div className="mb-8 grid grid-cols-2 gap-3">
        <FormularioGastoRapido
          persona={persona}
          categorias={categorias}
          cuentas={cuentas}
          descripciones={descripciones}
          cuentaPorCategoria={cuentaSugerida}
          hoy={hoyISO()}
        />

        <FormularioIngresoRapido
          persona={persona}
          fecha={hoyISO()}
          cuentas={cuentas}
          fondos={fondos}
          conceptos={conceptos}
        />
      </div>

      {/*
        Tarjeta de saldo sólida, no un panel neutro con un número encima: es
        la pantalla de "tu saldo" de una billetera, y ese número se confía
        de un vistazo o no se confía. Presupuesto y ahorros bajan de peso
        como cifras secundarias debajo de una línea — se consultan, no son
        la primera lectura.
      */}
      <section className="mb-8 rounded-2xl bg-fill-saldo p-5 text-fill-saldo-foreground">
        <Link
          href="/ajustes"
          className="flex items-center justify-between gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.06em] text-white/75 uppercase">
              Dinero disponible
            </p>
            {cuentasLiquidas.length === 0 ? (
              <p className="mt-1.5 text-[15px] font-bold">
                Agrega una cuenta en Ajustes
              </p>
            ) : (
              <p
                data-negativo={disponible < 0}
                className="mt-1 text-[32px] leading-none font-extrabold tracking-[-0.5px] data-[negativo=true]:text-over"
              >
                {soles(disponible)}
              </p>
            )}
            {/* Aparte y más chico a propósito: es crédito, no plata propia —
                sumarlo al número de arriba haría parecer que hay más de lo
                que en realidad se puede gastar. */}
            {cuentasCredito.length > 0 && (
              <p className="mt-1 text-[12px] font-semibold text-white/70">
                + {soles(creditoDisponible)} disponible en tarjetas
              </p>
            )}
          </div>
          <ArrowUpRight aria-hidden className="size-4 shrink-0 text-white/75" />
        </Link>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/20 pt-4">
          <Link
            href="/presupuesto"
            className="rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <p className="text-[11px] font-semibold text-white/75">Presupuesto</p>
            {sinTopes ? (
              // Un "S/ 0.00" aquí sería mentira: no es que no quede nada, es
              // que todavía no hay topes contra los que medir.
              <p className="mt-1 text-sm font-bold">Pon los topes</p>
            ) : (
              <p
                data-excedido={excedidos}
                className="mt-1 text-lg font-extrabold tracking-[-0.3px] data-[excedido=true]:text-over"
              >
                {soles(restante)}
              </p>
            )}
          </Link>

          <Link
            href="/ajustes"
            className="rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <p className="text-[11px] font-semibold text-white/75">Ahorros</p>
            {fondos.length === 0 ? (
              <p className="mt-1 text-sm font-bold">Crea un fondo</p>
            ) : (
              <p className="mt-1 text-lg font-extrabold tracking-[-0.3px]">
                {soles(ahorros)}
              </p>
            )}
          </Link>
        </div>
      </section>

      {conTope.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2.5 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
            Contra los topes
          </h2>

          {/* Dos columnas de cards, no una tira que hay que deslizar ni una
              lista de filas larguísima: con seis u ocho categorías esto cabe
              en la mitad de scroll y se lee de a pares, no una por una.
              Tocar una la abre con sus últimos gastos; has-[…[open]]: le da
              las dos columnas mientras está abierta, el mismo truco que las
              billeteras de Ajustes, para que la lista no quede aplastada. */}
          <ul className="grid grid-cols-2 gap-2.5">
            {conTope.map((linea) => (
              <li
                key={linea.categoria}
                className="has-[details[open]]:col-span-2"
              >
                <TarjetaCategoria
                  linea={linea}
                  gastosRecientes={(
                    gastosPorCategoria.get(linea.categoria) ?? []
                  ).slice(0, 3)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {gastos.length === 0 && <PrimerosPasos sinTopes={sinTopes} />}
    </>
  );
}

/**
 * El mes sin un solo gasto es la primera pantalla que van a ver, y también la
 * de cada día 1. En vez de un aviso gris, dice qué falta y lleva a hacerlo.
 */
function PrimerosPasos({ sinTopes }: { sinTopes: boolean }) {
  const pasos = [
    sinTopes && {
      href: "/presupuesto",
      titulo: "Acuerden los topes",
      pie: "Un máximo por categoría. Valen también los meses siguientes.",
    },
    {
      href: "/movimientos/nuevo",
      titulo: "Anota el primer gasto",
      pie: "Con el monto y en qué fue basta; el resto ya viene puesto.",
    },
  ].filter(Boolean) as { href: string; titulo: string; pie: string }[];

  return (
    <ul className="flex flex-col gap-2">
      {pasos.map((paso) => (
        <li key={paso.href}>
          <Link
            href={paso.href}
            className="panel-accion flex items-center gap-3 rounded-lg p-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{paso.titulo}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{paso.pie}</p>
            </div>
            <ArrowUpRight
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

