import { Plus } from "lucide-react";

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
  abierto,
}: {
  titulo: string;
  children: React.ReactNode;
  /** Abierto de entrada, para cuando no hay nada más que hacer en la pantalla. */
  abierto?: boolean;
}) {
  return (
    <details open={abierto} className="panel rounded-xl [&[open]_.marca]:rotate-45">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 p-5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <Plus
          aria-hidden
          className="marca size-4 text-primary transition-transform duration-200"
        />
        {titulo}
      </summary>
      <div className="border-t border-border p-5">{children}</div>
    </details>
  );
}
