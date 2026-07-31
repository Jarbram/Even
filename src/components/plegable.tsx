/**
 * Un formulario que solo ocupa sitio cuando lo vas a usar.
 *
 * ponytail: `<details>` nativo. Abre y cierra sin estado, sin JavaScript y sin
 * romperse si la hidratación tarda; el acordeón de una librería haría lo mismo
 * con 3 kB más.
 */
export function Plegable({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <details className="glass rounded-xl [&[open]_.marca]:rotate-45">
      <summary className="flex cursor-pointer list-none items-center gap-2 p-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <span className="marca text-lg leading-none font-bold text-primary transition-transform">
          +
        </span>
        {titulo}
      </summary>
      <div className="border-t border-border p-4">{children}</div>
    </details>
  );
}
