import Link from "next/link";
import { NOMBRES, laOtra } from "@/lib/persona";
import { requirePersona } from "@/lib/sesion";
import { resumenDelMes } from "@/lib/datos";
import { nombreMes, redondear, soles } from "@/lib/finanzas";
import { FilaGasto } from "@/components/fila-gasto";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ quien?: string }>;
}) {
  const persona = await requirePersona();
  const { quien } = await searchParams;
  const soloYo = quien === "yo";

  const { mes, gastos, restante, ahorros, deuda, baseCero } =
    await resumenDelMes();

  // "Solo yo" = lo que puse yo de mi bolsillo, que es lo que uno va a mirar
  // cuando quiere saber cuánto lleva gastado él.
  const mios = gastos.filter((g) => g.pagado_por === persona);
  const visibles = soloYo ? mios : gastos;
  const gastadoVisible = redondear(
    visibles.reduce((suma, g) => suma + g.monto, 0),
  );

  return (
    <>
      <header className="mb-6 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary text-[17px] font-bold text-foreground">
          {NOMBRES[persona][0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            Hola, {NOMBRES[persona]}
          </p>
          <p className="truncate text-[13px] font-semibold">
            Hogar {NOMBRES[persona]} &amp; {NOMBRES[laOtra(persona)]}
          </p>
        </div>
        <Link
          href="/ajustes"
          aria-label="Ajustes"
          className="glass flex size-10 shrink-0 items-center justify-center rounded-full"
        >
          <span className="size-2.5 rounded-full bg-primary" />
        </Link>
      </header>

      <h1 className="mb-5 text-[30px] leading-[1.15] font-extrabold tracking-[-0.5px]">
        ¿Listos para
        <br />
        este mes?
      </h1>

      <nav aria-label="Filtro" className="mb-4 flex gap-2 text-[13px]">
        <span className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground capitalize">
          {nombreMes(mes).replace(/ \d{4}$/, "")}
        </span>
        <Filtro href="/" activo={!soloYo}>
          Ambos
        </Filtro>
        <Filtro href="/?quien=yo" activo={soloYo}>
          Solo yo
        </Filtro>
      </nav>

      <div className="mb-7 grid grid-cols-2 gap-3">
        {/* La tarjeta grande del diseño: indigo lleno, no glass. */}
        <Tarjeta
          href="/presupuesto"
          titulo={soloYo ? "Gastaste tú" : "Presupuesto restante"}
          className="bg-secondary text-secondary-foreground"
        >
          <p className="text-[26px] leading-none font-extrabold tracking-[-0.5px]">
            {soles(soloYo ? gastadoVisible : restante)}
          </p>
          {!soloYo && baseCero.asignado === 0 && (
            <p className="mt-2 text-[11px] opacity-80">Aún sin asignar</p>
          )}
        </Tarjeta>

        <Tarjeta href="/ajustes" titulo="Ahorros" className="glass">
          <p className="text-[26px] leading-none font-extrabold tracking-[-0.5px] text-primary">
            {soles(ahorros)}
          </p>
        </Tarjeta>

        <Tarjeta href="/movimientos" titulo="Deuda entre nosotros" className="glass">
          <p className="text-[15px] leading-tight font-bold">
            {deuda.deudor
              ? `${NOMBRES[deuda.deudor]} debe ${soles(deuda.monto)}`
              : "Están en paz"}
          </p>
        </Tarjeta>

        <Link
          href="/movimientos/nuevo"
          className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-7 transition-colors hover:border-primary"
        >
          <span className="text-2xl leading-none font-bold text-primary">+</span>
          <span className="text-[13px] font-semibold">Agregar gasto</span>
        </Link>
      </div>

      <div className="mb-2.5 flex items-baseline justify-between">
        <h2 className="text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
          Actividad reciente
        </h2>
        {visibles.length > 4 && (
          <Link href="/movimientos" className="text-xs text-primary">
            Ver todo
          </Link>
        )}
      </div>

      {visibles.length === 0 ? (
        <p className="glass rounded-lg p-4 text-sm text-muted-foreground">
          {soloYo
            ? "No has registrado gastos tuyos este mes."
            : "Todavía no hay gastos este mes. Toca «Agregar gasto»."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visibles.slice(0, 6).map((gasto) => (
            <li key={gasto.id}>
              <FilaGasto gasto={gasto} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Filtro({
  href,
  activo,
  children,
}: {
  href: string;
  activo: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      data-activo={activo}
      className="rounded-full px-4 py-2 font-medium text-muted-foreground data-[activo=true]:bg-primary data-[activo=true]:font-semibold data-[activo=true]:text-primary-foreground"
    >
      {children}
    </Link>
  );
}

function Tarjeta({
  href,
  titulo,
  className,
  children,
}: {
  href: string;
  titulo: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`relative flex flex-col justify-between gap-4 rounded-xl p-4 ${className}`}
    >
      <p className="pr-4 text-[11px] leading-tight font-bold tracking-[0.06em] uppercase opacity-70">
        {titulo}
      </p>
      <span aria-hidden className="absolute top-4 right-4 text-xs opacity-50">
        ↗
      </span>
      {children}
    </Link>
  );
}

