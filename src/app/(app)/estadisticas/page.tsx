import Link from "next/link";
import { requirePersona } from "@/lib/sesion";
import { historicoMensual, resumenDelMes } from "@/lib/datos";
import {
  diasTranscurridos,
  hoyISO,
  mesActual,
  nombreMes,
  porDiaDelMes,
  porSemanaDelMes,
  redondear,
  soles,
  type Mes,
} from "@/lib/finanzas";
import { BotonCerrar, NavegadorMes } from "@/components/navegacion";

const VISTAS = ["diario", "semanal", "mensual"] as const;
type Vista = (typeof VISTAS)[number];

const ES_MES = /^\d{4}-\d{2}-01$/;

export default async function EstadisticasPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; mes?: string }>;
}) {
  await requirePersona();
  const params = await searchParams;

  const vista: Vista = VISTAS.includes(params.vista as Vista)
    ? (params.vista as Vista)
    : "diario";
  // El mes viene de la URL, así que se valida antes de consultar con él.
  const mes: Mes = ES_MES.test(params.mes ?? "") ? params.mes! : mesActual();

  const [
    { gastos, lineas, totalGastado, ahorros, restante, presupuesto },
    historico,
  ] = await Promise.all([resumenDelMes(mes), historicoMensual(12)]);

  const conTope = presupuesto.estado !== "sin-topes";

  const barras =
    vista === "diario"
      ? porDiaDelMes(mes, gastos)
      : vista === "semanal"
        ? porSemanaDelMes(mes, gastos)
        : historico.map((h) => ({
            etiqueta: nombreMes(h.mes).slice(0, 3),
            total: h.total,
          }));

  const dias = diasTranscurridos(mes, hoyISO());

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Estadísticas</h1>
        <BotonCerrar href="/" />
      </div>

      <nav
        aria-label="Agrupación"
        // El grupo es un canal hundido y la pastilla activa se apoya dentro: es
        // lo que distingue «elegir entre estas tres» de «tocar esta tarjeta».
        className="glass-hueco mb-4 flex rounded-full p-1 text-[13px]"
      >
        {VISTAS.map((v) => (
          <Link
            key={v}
            href={`/estadisticas?vista=${v}&mes=${mes}`}
            aria-current={v === vista ? "page" : undefined}
            data-activo={v === vista}
            className="flex-1 rounded-full py-2.5 text-center font-medium text-muted-foreground capitalize transition-colors hover:text-foreground data-[activo=true]:bg-primary data-[activo=true]:font-semibold data-[activo=true]:text-primary-foreground data-[activo=true]:shadow-[0_2px_6px_rgb(0_0_0/0.4)]"
          >
            {v}
          </Link>
        ))}
      </nav>

      {/* En vista mensual el eje ya son los meses: mover el mes no aportaría. */}
      {vista !== "mensual" && (
        <NavegadorMes
          mes={mes}
          href={(m) => `/estadisticas?vista=${vista}&mes=${m}`}
        />
      )}

      <section className="mb-6 rounded-xl bg-secondary p-5 text-secondary-foreground">
        <p className="text-[11px] font-bold tracking-[0.06em] uppercase opacity-70">
          Actividad {vista === "mensual" ? "por mes" : "del mes"}
        </p>
        <Barras datos={barras} />
        <dl className="mt-4 flex justify-between text-xs">
          <Dato titulo="Gastado" valor={soles(totalGastado)} />
          {/* "Ahorrado" era engañoso: es el saldo acumulado de los fondos, no
              lo que se metió este mes. */}
          <Dato titulo="En ahorros" valor={soles(ahorros)} />
          <Dato
            titulo={conTope ? "Del tope queda" : "Sin topes"}
            valor={conTope ? soles(restante) : "—"}
            destacado={conTope}
          />
        </dl>
      </section>

      <p className="mb-2.5 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
        Por categoría
      </p>

      {lineas.length === 0 ? (
        <p className="glass rounded-lg p-4 text-sm text-muted-foreground">
          Sin datos este mes.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2.5">
          {lineas.map((linea) => (
            <li key={linea.categoria} className="glass rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 flex-1 truncate text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
                  {linea.categoria}
                </span>
                {linea.presupuestado > 0 && (
                  <span
                    data-estado={linea.estado}
                    className="shrink-0 rounded-full bg-ok/15 px-2 py-0.5 text-[11px] font-bold text-ok data-[estado=ajustado]:bg-warn/15 data-[estado=ajustado]:text-warn data-[estado=excedido]:bg-over/15 data-[estado=excedido]:text-over"
                  >
                    {Math.round(linea.proporcion * 100)} %
                  </span>
                )}
              </div>

              <p className="mt-1.5 text-xl font-extrabold tracking-[-0.5px]">
                {soles(linea.gastado)}
              </p>

              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Promedio {soles(redondear(linea.gastado / dias))}/día
                <br />
                {linea.presupuestado > 0
                  ? `Tope ${soles(linea.presupuestado)}`
                  : "Sin tope"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Dato({
  titulo,
  valor,
  destacado,
}: {
  titulo: string;
  valor: string;
  destacado?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-bold tracking-[0.06em] uppercase opacity-70">
        {titulo}
      </dt>
      <dd className={`mt-0.5 text-sm font-bold ${destacado ? "text-primary" : ""}`}>
        {valor}
      </dd>
    </div>
  );
}

/**
 * Las barras del periodo.
 *
 * El `title` no basta: en un móvil no hay puntero, así que un valor que solo
 * aparece al pasar por encima no existe. La barra más alta lleva su cifra
 * escrita, y debajo van las referencias del eje — con eso se lee la forma sin
 * tocar nada.
 */
function Barras({ datos }: { datos: { etiqueta: string; total: number }[] }) {
  // Sin gastos, todas las barras medirían lo mismo: mejor un techo de 1.
  const techo = Math.max(...datos.map((d) => d.total), 1);
  const hayGastos = datos.some((d) => d.total > 0);
  const pico = datos.findIndex((d) => d.total === techo);

  if (!hayGastos) {
    return (
      <p className="mt-4 flex h-24 items-center justify-center text-sm opacity-70">
        Sin gastos en este periodo
      </p>
    );
  }

  return (
    <figure className="mt-4">
      <figcaption className="mb-1.5 text-[11px] opacity-70">
        Máximo {soles(techo)} · {datos[pico].etiqueta}
      </figcaption>

      {/*
        `max-w` tope + `justify-center`: con 31 días la caja ya está llena y el
        tope no hace nada, pero con 1-2 meses de historial una barra sola no se
        estira hasta llenar la tarjeta entera y parecer un bloque sin forma —
        se queda del ancho de una barra de verdad, centrada.
      */}
      <div className="flex h-24 items-end justify-center gap-[3px]">
        {datos.map((dato, i) => (
          <div
            key={dato.etiqueta}
            title={`${dato.etiqueta}: ${soles(dato.total)}`}
            data-pico={i === pico}
            // Un mínimo del 4 % para que un periodo sin gasto siga siendo una
            // barra y el eje no aparezca con huecos.
            style={{ height: `${Math.max((dato.total / techo) * 100, 4)}%` }}
            className="max-w-9 flex-1 rounded-[3px] bg-white/45 data-[pico=true]:bg-white"
          />
        ))}
      </div>

      {/* Primera, media y última: sitúan el eje sin apelotonar 31 etiquetas.
          Con un solo dato, mostrarlo dos veces (inicio y fin) no dice nada. */}
      <div className="mt-1.5 flex justify-between text-[10px] opacity-60">
        <span>{datos[0].etiqueta}</span>
        {datos.length > 2 && (
          <span>{datos[Math.floor(datos.length / 2)].etiqueta}</span>
        )}
        {datos.length > 1 && <span>{datos[datos.length - 1].etiqueta}</span>}
      </div>
    </figure>
  );
}
