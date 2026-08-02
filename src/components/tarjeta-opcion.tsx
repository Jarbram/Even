import { Check, type LucideIcon } from "lucide-react";

/**
 * Una opción en tarjeta, del tamaño del pulgar y con el estado elegido dicho de
 * dos maneras: el borde en lima y una marca de verificación.
 *
 * Solo el fondo teñido no bastaba — sobre una superficie glass translúcida un
 * 10 % de lima casi no se distingue, y el estado seleccionado es justo lo que
 * no puede quedar en duda antes de guardar dinero.
 *
 * ponytail: radio nativo con `peer-checked`. Sin estado de React, la tarjeta
 * entera es el área tocable y funciona antes de que hidrate el JavaScript.
 */
export function TarjetaOpcion({
  name,
  value,
  titulo,
  pie,
  punto,
  icono: Icono,
  acento,
  predeterminada,
  required,
}: {
  name: string;
  value: string;
  titulo: string;
  pie: string;
  /** Clase de color del puntito identificador. */
  punto: string;
  icono?: LucideIcon;
  /** Tiñe el icono de lima: lo usa el ahorro, que es la opción con carácter. */
  acento?: boolean;
  predeterminada?: boolean;
  /** Para grupos sin opción por defecto, donde elegir no es opcional. */
  required?: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={predeterminada}
        required={required}
        className="peer sr-only"
      />
      {/*
        La marca se muestra con `peer-checked:[&>[data-check]]:block` desde este
        span y no con `peer-checked:block` en la propia marca: `peer-checked`
        solo alcanza a hermanos del input, y la marca es un descendiente.
      */}
      <span className="glass relative flex h-full flex-col gap-2 rounded-xl p-3.5 transition active:scale-[0.98] peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:ring-1 peer-checked:ring-primary peer-checked:[&>[data-check]]:block peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
        <span className="flex items-center justify-between">
          <span aria-hidden className={`size-2 rounded-full ${punto}`} />
          {Icono && (
            <Icono
              aria-hidden
              className={`size-4 ${acento ? "text-primary" : "text-muted-foreground"}`}
            />
          )}
        </span>

        <span className="truncate text-sm font-semibold">{titulo}</span>
        <span className="truncate pr-5 text-[11px] text-muted-foreground">
          {pie}
        </span>

        <Check
          aria-hidden
          data-check
          className="absolute right-3 bottom-3 hidden size-3.5 text-primary"
        />
      </span>
    </label>
  );
}
