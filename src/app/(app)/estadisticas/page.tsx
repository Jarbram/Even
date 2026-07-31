import Link from "next/link";
import { requirePersona } from "@/lib/sesion";
import { historicoMensual, resumenDelMes } from "@/lib/datos";
import {
  desplazarMes,
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
    : "mensual";
  // El mes viene de la URL, así que se valida antes de consultar con él.
  const mes: Mes = ES_MES.test(params.mes ?? "") ? params.mes! : mesActual();

  const [{ gastos, presupuesto, totalGastado, ahorros, restante }, historico] =
    await Promise.all([resumenDelMes(mes), historicoMensual(12)]);

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
        <Link
          href="/"
          aria-label="Cerrar"
          className="glass flex size-9 items-center justify-center rounded-full text-sm text-muted-foreground"
        >
          ✕
        </Link>
      </div>

      <nav
        aria-label="Agrupación"
        className="glass mb-4 flex rounded-full p-1 text-[13px]"
      >
        {VISTAS.map((v) => (
          <Link
            key={v}
            href={`/estadisticas?vista=${v}&mes=${mes}`}
            aria-current={v === vista ? "page" : undefined}
            data-activo={v === vista}
            className="flex-1 rounded-full py-2 text-center font-medium text-muted-foreground capitalize data-[activo=true]:bg-primary data-[activo=true]:font-semibold data-[activo=true]:text-primary-foreground"
          >
            {v}
          </Link>
        ))}
      </nav>

      {/* En vista mensual el eje ya son los meses: mover el mes no aportaría. */}
      {vista !== "mensual" && (
        <nav
          aria-label="Mes"
          className="mb-4 flex items-center justify-center gap-8 text-sm"
        >
          <Link
            href={`/estadisticas?vista=${vista}&mes=${desplazarMes(mes, -1)}`}
            aria-label="Mes anterior"
            className="px-2 text-muted-foreground"
          >
            ‹
          </Link>
          <span className="font-semibold capitalize">{nombreMes(mes)}</span>
          <Link
            href={`/estadisticas?vista=${vista}&mes=${desplazarMes(mes, 1)}`}
            aria-label="Mes siguiente"
            className="px-2 text-muted-foreground"
          >
            ›
          </Link>
        </nav>
      )}

      <section className="mb-6 rounded-xl bg-secondary p-5 text-secondary-foreground">
        <p className="text-[11px] font-bold tracking-[0.06em] uppercase opacity-70">
          Actividad {vista === "mensual" ? "por mes" : "del mes"}
        </p>
        <Barras datos={barras} />
        <dl className="mt-4 flex justify-between text-xs">
          <Dato titulo="Gastado" valor={soles(totalGastado)} />
          <Dato titulo="Ahorrado" valor={soles(ahorros)} />
          <Dato titulo="Restante" valor={soles(restante)} destacado />
        </dl>
      </section>

      <p className="mb-2.5 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
        Por categoría
      </p>

      {presupuesto.length === 0 ? (
        <p className="glass rounded-lg p-4 text-sm text-muted-foreground">
          Sin datos este mes.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2.5">
          {presupuesto.map((linea) => (
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
                  ? `Meta ${soles(linea.presupuestado)}`
                  : "Sin meta"}
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

function Barras({ datos }: { datos: { etiqueta: string; total: number }[] }) {
  // Sin gastos, todas las barras medirían lo mismo: mejor un techo de 1.
  const techo = Math.max(...datos.map((d) => d.total), 1);

  return (
    <div className="mt-4 flex h-24 items-end gap-[3px]">
      {datos.map((dato) => (
        <div
          key={dato.etiqueta}
          title={`${dato.etiqueta}: ${soles(dato.total)}`}
          // Un mínimo del 4 % para que un día sin gasto siga siendo una barra
          // y el eje no aparezca con huecos.
          style={{ height: `${Math.max((dato.total / techo) * 100, 4)}%` }}
          className="flex-1 rounded-[3px] bg-white/85"
        />
      ))}
    </div>
  );
}
