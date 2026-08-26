/**
 * La cabecera de un día dentro de una lista larga, pegada arriba mientras se
 * desplaza su grupo.
 *
 * Un mes de gastos son varios miles de píxeles: a mitad de scroll no había
 * forma de saber en qué día se estaba sin subir a buscar la cabecera. Va
 * opaca (`bg-popover`) y no en cristal: translúcida, el texto de la fila que
 * pasaba por debajo se leía a través del título.
 */
export function CabeceraDia({
  children,
  total,
}: {
  children: React.ReactNode;
  /** El total del día, ya formateado. */
  total: string;
}) {
  return (
    <div className="sticky top-[max(0.25rem,env(safe-area-inset-top))] z-10 -mx-1 mb-2 flex items-baseline justify-between gap-3 rounded-lg bg-popover px-3 py-2 shadow-[var(--sombra-apoyada)]">
      <h2 className="truncate text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
        {children}
      </h2>
      <span className="shrink-0 text-[11px] font-semibold">{total}</span>
    </div>
  );
}
