import { Check } from "lucide-react";

/**
 * El check que aparece con rebote justo después de guardar, antes de que la
 * hoja se cierre — el gesto real de Yape o Plin al confirmar un pago, no
 * solo un toast genérico. Usa la animación `confirma` de `globals.css`.
 */
export function Confirmacion({
  color,
  mensaje,
}: {
  color: "gasto" | "ingreso";
  mensaje: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-20">
      <span
        className={`confirma flex size-16 items-center justify-center rounded-full ${
          color === "gasto"
            ? "bg-fill-gasto text-fill-gasto-foreground"
            : "bg-fill-ingreso text-fill-ingreso-foreground"
        }`}
      >
        <Check aria-hidden className="size-8" strokeWidth={3} />
      </span>
      <p className="text-[15px] font-bold">{mensaje}</p>
    </div>
  );
}
