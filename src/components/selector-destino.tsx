import { PiggyBank, Wallet } from "lucide-react";
import { NOMBRES } from "@/lib/persona";
import { TIPOS_CUENTA, claseColor, type CuentaRow } from "@/lib/cuentas";
import { soles } from "@/lib/finanzas";
import type { FondoRow } from "@/lib/datos";
import { Label } from "@/components/ui/label";

/**
 * A dónde entra el dinero: a una cuenta o directo al ahorro.
 *
 * Un solo campo `destino` con el valor "cuenta:<id>" o "fondo:<id>", en vez de
 * dos radios que podrían quedar los dos marcados. La base tiene el mismo
 * criterio: un check impide que un ingreso apunte a las dos cosas.
 *
 * Radios nativos con `peer-checked`: sin estado y con la tarjeta entera tocable.
 */
export function SelectorDestino({
  cuentas,
  fondos,
}: {
  cuentas: CuentaRow[];
  fondos: FondoRow[];
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <Label asChild>
        <legend>¿A dónde entra?</legend>
      </Label>

      <div className="grid grid-cols-2 gap-2.5">
        {cuentas.map((cuenta) => (
          <Tarjeta
            key={cuenta.id}
            value={`cuenta:${cuenta.id}`}
            titulo={cuenta.nombre}
            pie={`${TIPOS_CUENTA[cuenta.tipo]} · ${NOMBRES[cuenta.persona]}`}
            punto={claseColor(cuenta.color)}
            icono={<Wallet aria-hidden className="size-4 text-muted-foreground" />}
          />
        ))}

        {fondos.map((fondo) => (
          <Tarjeta
            key={fondo.id}
            value={`fondo:${fondo.id}`}
            titulo={fondo.nombre}
            pie={`Ahorro · ${soles(fondo.saldo)}`}
            punto="bg-primary"
            icono={<PiggyBank aria-hidden className="size-4 text-primary" />}
          />
        ))}

        {/* Valor vacío: el ingreso se registra sin destino. */}
        <Tarjeta
          value=""
          titulo="Sin especificar"
          pie="Solo cuenta el monto"
          punto="bg-muted-foreground"
          predeterminada={cuentas.length === 0 && fondos.length === 0}
        />
      </div>

      {fondos.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Si eliges un ahorro, el fondo sube solo con este ingreso.
        </p>
      )}
    </fieldset>
  );
}

function Tarjeta({
  value,
  titulo,
  pie,
  punto,
  icono,
  predeterminada,
}: {
  value: string;
  titulo: string;
  pie: string;
  punto: string;
  icono?: React.ReactNode;
  predeterminada?: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name="destino"
        value={value}
        defaultChecked={predeterminada}
        className="peer sr-only"
      />
      <span className="glass flex h-full flex-col gap-2 rounded-xl p-3.5 transition-colors peer-checked:border-primary peer-checked:bg-primary/10 peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
        <span className="flex items-center justify-between">
          <span aria-hidden className={`size-2 rounded-full ${punto}`} />
          {icono}
        </span>
        <span className="truncate text-sm font-semibold">{titulo}</span>
        <span className="truncate text-[11px] text-muted-foreground">{pie}</span>
      </span>
    </label>
  );
}
