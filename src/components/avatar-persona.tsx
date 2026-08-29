import { NOMBRES, type Persona } from "@/lib/persona";

/**
 * El círculo de iniciales de una persona, con su color propio y consistente
 * en toda la app — el mismo gesto de identidad que Yape o Plin, donde
 * siempre sabes con un vistazo con quién estás tratando.
 */
export function AvatarPersona({
  persona,
  tamano = "md",
  className = "",
}: {
  persona: Persona;
  tamano?: "sm" | "md";
  /** Para el anillo de separación cuando va sobre una tarjeta de color. */
  className?: string;
}) {
  return (
    <span
      data-persona={persona}
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white data-[persona=abraham]:bg-secondary data-[persona=isabel]:bg-chart-6 ${
        tamano === "sm" ? "size-6 text-[11px]" : "size-11 text-[17px]"
      } ${className}`}
    >
      {NOMBRES[persona][0]}
    </span>
  );
}
