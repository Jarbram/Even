import { Link } from "next-view-transitions";
import { requirePersona } from "@/lib/sesion";
import {
  categoriasUsadas,
  historicoMensual,
  resumenDelMes,
  type GastoRow,
} from "@/lib/datos";
import {
  diasTranscurridos,
  hoyISO,
  mesActual,
  nombreMes,
  porDiaDelMes,
  porSemanaDelMes,
  redondear,
  soles,
  type Estado,
  type LineaPresupuesto,
  type Mes,
  type ResumenPresupuesto,
} from "@/lib/finanzas";
import { NavegadorMes } from "@/components/navegacion";
import { TarjetaCategoria } from "@/components/tarjeta-categoria";
import { EditarPresupuesto, NuevoPresupuesto } from "./formularios";

/**
 * Presupuesto y Estadísticas eran dos pestañas de la barra inferior que
 * contestaban la misma pregunta —¿cómo va la plata este mes?— desde dos
 * ángulos: cuánto queda del tope, y cuánto se gastó en el tiempo. Vivir en
 * pantallas separadas obligaba a saltar de una a otra para verlas juntas.
 * Ahora son dos vistas de la misma pantalla: "Resumen" (el estado de los
 * topes) y "Actividad" (la tendencia), un toque aparte, no una pestaña más.
 */

const MODOS = ["resumen", "actividad"] as const;
type Modo = (typeof MODOS)[number];
const NOMBRE_MODO: Record<Modo, string> = { resumen: "Resumen", actividad: "Actividad" };

const VISTAS = ["diario", "semanal", "mensual"] as const;
type Vista = (typeof VISTAS)[number];

const ES_MES = /^\d{4}-\d{2}-01$/;

export default async function PresupuestoPage({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string; vista?: string; mes?: string }>;
}) {
  await requirePersona();
  const params = await searchParams;

  const modo: Modo = MODOS.includes(params.modo as Modo)
    ? (params.modo as Modo)
    : "resumen";
  const vista: Vista = VISTAS.includes(params.vista as Vista)
    ? (params.vista as Vista)
    : "diario";
  // El mes viene de la URL, así que se valida antes de consultar con él.
  const mes: Mes = ES_MES.test(params.mes ?? "") ? params.mes! : mesActual();

  const [resumen, categorias, historico] = await Promise.all([
    resumenDelMes(mes),
    categoriasUsadas(),
    // Solo hace falta el histórico de 12 meses en la vista mensual de
    // Actividad: pedirlo siempre sería una consulta de más en el caso común.
    modo === "actividad" ? historicoMensual(12) : Promise.resolve([]),
  ]);

  const sinTopes = resumen.presupuesto.estado === "sin-topes";

  return (
    <>
      <h1 className="text-2xl font-extrabold">Presupuesto</h1>
      <p className="mt-1.5 mb-5 text-sm text-muted-foreground">
        {nombreMes(mes)}
        {modo === "resumen" && resumen.topesHeredados && " · topes de siempre"}
      </p>

      <nav
        aria-label="Vista"
        className="panel-hueco mb-5 flex rounded-full p-1 text-[13px]"
      >
        {MODOS.map((m) => (
          <Link
            key={m}
            href={m === "resumen" ? "/presupuesto" : "/presupuesto?modo=actividad"}
            aria-current={m === modo ? "page" : undefined}
            data-activo={m === modo}
            className="flex-1 rounded-full py-2.5 text-center font-medium text-muted-foreground transition-colors hover:text-foreground data-[activo=true]:bg-primary data-[activo=true]:font-semibold data-[activo=true]:text-primary-foreground data-[activo=true]:shadow-[0_2px_6px_rgb(0_0_0/0.4)]"
          >
            {NOMBRE_MODO[m]}
          </Link>
        ))}
      </nav>

      {modo === "resumen" ? (
        <VistaResumen
          mes={mes}
          sinTopes={sinTopes}
          presupuesto={resumen.presupuesto}
          lineas={resumen.lineas}
          categorias={categorias}
          gastos={resumen.gastos}
        />
      ) : (
        <VistaActividad mes={mes} vista={vista} resumen={resumen} historico={historico} />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Resumen: el estado de los topes de este mes
// ---------------------------------------------------------------------------

function VistaResumen({
  mes,
  sinTopes,
  presupuesto,
  lineas,
  categorias,
  gastos,
}: {
  mes: Mes;
  sinTopes: boolean;
  presupuesto: ResumenPresupuesto;
  lineas: LineaPresupuesto[];
  categorias: string[];
  gastos: GastoRow[];
}) {
  // Para el detalle de cada card: sus últimos gastos, sin consultar de
  // nuevo — ya vienen cargados en `gastos`.
  const gastosPorCategoria = new Map<string, GastoRow[]>();
  for (const gasto of gastos) {
    gastosPorCategoria.set(gasto.categoria, [
      ...(gastosPorCategoria.get(gasto.categoria) ?? []),
      gasto,
    ]);
  }

  return (
    <>
      {sinTopes ? <SinTopes /> : <Titular presupuesto={presupuesto} />}

      <div className="mt-3">
        <NuevoPresupuesto mes={mes} categorias={categorias} />
      </div>

      {/* "Hay que ajustar" se queda grande y en una sola columna: son pocas
          —normalmente una o dos— y son las que de verdad piden atención, así
          que se ganan el peso visual. "El resto" es la lista larga, y una
          lista larga de cards anchas se sentía como un formulario sin fin
          más que como un tablero: pasa a la misma grilla de dos columnas
          que el Home, con las mismas cards compactas — se lee de a pares,
          no una tras otra. */}
      {presupuesto.excedidas.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2.5 text-[11px] font-bold tracking-[0.06em] text-over uppercase">
            Hay que ajustar
          </h2>
          <ul className="flex flex-col gap-2.5">
            {presupuesto.excedidas.map((linea) => (
              <li key={linea.categoria}>
                <TarjetaCategoria
                  linea={linea}
                  tamano="grande"
                  gastosRecientes={(
                    gastosPorCategoria.get(linea.categoria) ?? []
                  ).slice(0, 4)}
                >
                  <EditarPresupuesto
                    mes={mes}
                    categoria={linea.categoria}
                    monto={linea.presupuestado}
                  />
                </TarjetaCategoria>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Entre "ya te pasaste" y "vas bien" hay una tercera categoría que el
          semáforo por sí solo no puede decir: hoy vas bien, pero al ritmo
          que llevas no vas a seguir así. Es la respuesta a "¿qué tengo que
          ajustar?" antes de que sea tarde para ajustarlo. */}
      {presupuesto.vanRapido.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2.5 text-[11px] font-bold tracking-[0.06em] text-warn uppercase">
            Van rápido
          </h2>
          <ul className="grid grid-cols-2 gap-2.5">
            {presupuesto.vanRapido.map((linea) => (
              <li key={linea.categoria} className="has-[details[open]]:col-span-2">
                <TarjetaCategoria
                  linea={linea}
                  tamano="compacta"
                  gastosRecientes={(
                    gastosPorCategoria.get(linea.categoria) ?? []
                  ).slice(0, 4)}
                >
                  <EditarPresupuesto
                    mes={mes}
                    categoria={linea.categoria}
                    monto={linea.presupuestado}
                  />
                </TarjetaCategoria>
              </li>
            ))}
          </ul>
        </section>
      )}

      {lineas.length > presupuesto.excedidas.length + presupuesto.vanRapido.length && (
        <section className="mt-6">
          <h2 className="mb-2.5 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
            {presupuesto.excedidas.length > 0 || presupuesto.vanRapido.length > 0
              ? "El resto"
              : "Por categoría"}
          </h2>
          <ul className="grid grid-cols-2 gap-2.5">
            {lineas
              .filter(
                (l) =>
                  !presupuesto.excedidas.includes(l) &&
                  !presupuesto.vanRapido.includes(l),
              )
              .map((linea) => (
                <li
                  key={linea.categoria}
                  className="has-[details[open]]:col-span-2"
                >
                  <TarjetaCategoria
                    linea={linea}
                    tamano="compacta"
                    gastosRecientes={(
                      gastosPorCategoria.get(linea.categoria) ?? []
                    ).slice(0, 4)}
                  >
                    <EditarPresupuesto
                      mes={mes}
                      categoria={linea.categoria}
                      monto={linea.presupuestado}
                    />
                  </TarjetaCategoria>
                </li>
              ))}
          </ul>
        </section>
      )}
    </>
  );
}

function SinTopes() {
  return (
    <div className="panel rounded-xl p-5">
      <p className="text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
        Sin topes todavía
      </p>
      <p className="mt-2 text-[17px] leading-snug font-bold">
        Pónganse un máximo por categoría
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        Lo que acuerden aquí vale también los meses siguientes. A partir de ahí
        la app avisa en qué se están pasando.
      </p>
    </div>
  );
}

/** ¿Cumplimos? Lo primero y en grande. */
function Titular({ presupuesto }: { presupuesto: ResumenPresupuesto }) {
  const { tope, gastado, restante, estado, resumen, alertaTemprana } = presupuesto;
  const proporcion = tope > 0 ? Math.min(gastado / tope, 1) : 0;
  // Para el color del titular: "ok" con alerta temprana se pinta como
  // "ajustado" —no es una mentira sobre el estado real, que sigue siendo
  // "ok" en todos lados; es solo que el número grande no puede decir
  // "vas bien" en verde cuando el texto de abajo dice lo contrario.
  const colorTitular = alertaTemprana && estado === "ok" ? "ajustado" : estado;

  return (
    <section className="panel rounded-xl p-5">
      <p className="text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
        {restante >= 0 ? "Te queda" : "Te pasaste"}
      </p>
      <p
        data-estado={colorTitular}
        className="mt-1.5 text-[30px] font-extrabold tracking-[-0.5px] data-[estado=ajustado]:text-warn data-[estado=excedido]:text-over"
      >
        {soles(Math.abs(restante))}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">{resumen}</p>

      <div
        className="panel-hueco mt-5 h-2.5 overflow-hidden rounded-full"
        role="img"
        aria-label={`Llevas ${soles(gastado)} gastados de ${soles(tope)} presupuestados`}
      >
        <div
          data-estado={estado}
          className="barra h-full rounded-full bg-ok data-[estado=ajustado]:bg-warn data-[estado=excedido]:bg-over"
          style={{ width: `${proporcion * 100}%` }}
        />
      </div>

      <dl className="mt-4 flex gap-8 text-xs">
        <div>
          <dt className="text-muted-foreground">Gastado</dt>
          <dd className="mt-1 font-semibold">{soles(gastado)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tope acordado</dt>
          <dd className="mt-1 font-semibold">{soles(tope)}</dd>
        </div>
      </dl>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Actividad: la tendencia, diaria, semanal o mensual
// ---------------------------------------------------------------------------

function VistaActividad({
  mes,
  vista,
  resumen,
  historico,
}: {
  mes: Mes;
  vista: Vista;
  resumen: Awaited<ReturnType<typeof resumenDelMes>>;
  historico: { mes: string; total: number }[];
}) {
  const { gastos, lineas, totalGastado, ahorros, restante, presupuesto } = resumen;
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
      {/* Un pill-nav idéntico al de "Resumen/Actividad" de arriba, uno debajo
          del otro, se leía como un solo control de dos filas — o peor, como
          que uno de los dos no hacía nada. Este va más chico, sin relleno
          sólido al elegir, y con su propia etiqueta: queda claro que es un
          filtro dentro de "Actividad", no otra pestaña al mismo nivel. */}
      <p className="mb-2 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        Agrupar por
      </p>
      <nav
        aria-label="Agrupación"
        className="mb-4 flex gap-1.5 text-[12px]"
      >
        {VISTAS.map((v) => (
          <Link
            key={v}
            href={`/presupuesto?modo=actividad&vista=${v}&mes=${mes}`}
            aria-current={v === vista ? "page" : undefined}
            data-activo={v === vista}
            className="rounded-full border border-border px-3 py-1.5 text-center font-medium text-muted-foreground capitalize transition-colors hover:text-foreground data-[activo=true]:border-primary data-[activo=true]:bg-primary/10 data-[activo=true]:font-semibold data-[activo=true]:text-primary"
          >
            {v}
          </Link>
        ))}
      </nav>

      {/* En vista mensual el eje ya son los meses: mover el mes no aportaría. */}
      {vista !== "mensual" && (
        <NavegadorMes
          mes={mes}
          href={(m) => `/presupuesto?modo=actividad&vista=${vista}&mes=${m}`}
        />
      )}

      <section className="mb-6 rounded-xl bg-secondary-panel p-5 text-secondary-foreground">
        <p className="text-[11px] font-bold tracking-[0.06em] text-white/80 uppercase">
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
            estado={
              presupuesto.estado === "sin-topes"
                ? undefined
                : presupuesto.alertaTemprana && presupuesto.estado === "ok"
                  ? "ajustado"
                  : presupuesto.estado
            }
          />
        </dl>
      </section>

      <p className="mb-2.5 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
        Por categoría
      </p>

      {lineas.length === 0 ? (
        <p className="panel rounded-lg p-4 text-sm text-muted-foreground">
          Sin datos este mes.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2.5">
          {lineas.map((linea) => {
            // Igual que en TarjetaCategoria: "ok" con alerta temprana se
            // pinta como "ajustado" — antes esta tarjeta mostraba el
            // promedio diario y el tope como dos datos sueltos, dejando la
            // cuenta ("¿a ese ritmo, me paso?") para hacerla de memoria.
            const colorEstado =
              linea.alertaTemprana && linea.estado === "ok" ? "ajustado" : linea.estado;
            return (
              <li key={linea.categoria} className="panel rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
                    {linea.categoria}
                  </span>
                  {linea.presupuestado > 0 && (
                    <span
                      data-estado={colorEstado}
                      className="shrink-0 rounded-full bg-ok/15 px-2 py-0.5 text-[11px] font-bold text-ok data-[estado=ajustado]:bg-warn/15 data-[estado=ajustado]:text-warn data-[estado=excedido]:bg-over/15 data-[estado=excedido]:text-over"
                    >
                      {Math.round(linea.proporcion * 100)}%
                    </span>
                  )}
                </div>

                <p className="mt-1.5 text-xl font-extrabold tracking-[-0.5px]">
                  {soles(linea.gastado)}
                </p>

                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  Promedio {soles(redondear(linea.gastado / dias))}/día
                </p>
                {linea.presupuestado > 0 ? (
                  <p
                    data-estado={colorEstado}
                    className="mt-0.5 text-[11px] leading-relaxed font-semibold text-muted-foreground data-[estado=ajustado]:text-warn data-[estado=excedido]:text-over"
                  >
                    A este ritmo: {soles(linea.proyectado)} · tope{" "}
                    {soles(linea.presupuestado)}
                  </p>
                ) : (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Sin tope</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Dato({
  titulo,
  valor,
  estado,
}: {
  titulo: string;
  valor: string;
  /** Sin esto, el color no dice nada: "queda S/ 40" y "te pasaste S/ 40"
      no pueden llevar el mismo tinte. */
  estado?: Estado;
}) {
  return (
    <div>
      <dt className="text-[10px] font-bold tracking-[0.06em] text-white/80 uppercase">
        {titulo}
      </dt>
      <dd
        data-estado={estado}
        className="mt-0.5 text-sm font-bold data-[estado=ok]:text-ok data-[estado=ajustado]:text-warn data-[estado=excedido]:text-over"
      >
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
      <p className="mt-4 flex h-24 items-center justify-center text-sm text-white/80">
        Sin gastos en este periodo
      </p>
    );
  }

  return (
    <figure className="mt-4">
      <figcaption className="mb-1.5 text-[11px] text-white/80">
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
            className="max-w-9 flex-1 rounded-[3px] bg-white/55 data-[pico=true]:bg-white"
          />
        ))}
      </div>

      {/* Primera, media y última: sitúan el eje sin apelotonar 31 etiquetas.
          Con un solo dato, mostrarlo dos veces (inicio y fin) no dice nada. */}
      <div className="mt-1.5 flex justify-between text-[10px] text-white/80">
        <span>{datos[0].etiqueta}</span>
        {datos.length > 2 && (
          <span>{datos[Math.floor(datos.length / 2)].etiqueta}</span>
        )}
        {datos.length > 1 && <span>{datos[datos.length - 1].etiqueta}</span>}
      </div>
    </figure>
  );
}
