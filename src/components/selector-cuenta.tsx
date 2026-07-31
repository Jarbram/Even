import Link from "next/link";
import { NOMBRES } from "@/lib/persona";
import { TIPOS_CUENTA, claseColor, type CuentaRow } from "@/lib/cuentas";
import { Label } from "@/components/ui/label";

/**
 * Con qué se pagó, en tarjetas. Radios nativos con `peer-checked`: sin estado,
 * sin JavaScript, y el área tocable es la tarjeta entera.
 *
 * "Efectivo" está siempre, aunque no haya creado ninguna cuenta: pagar en
 * efectivo es lo más común y no debería obligar a pasar antes por Ajustes.
 */
export function SelectorCuenta({ cuentas }: { cuentas: CuentaRow[] }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <Label asChild>
          <legend>¿Con qué pagaste?</legend>
        </Label>
        <Link href="/ajustes" className="text-xs font-medium text-primary">
          Añadir cuenta
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {cuentas.map((cuenta) => (
          <Tarjeta
            key={cuenta.id}
            value={cuenta.id}
            titulo={cuenta.nombre}
            pie={`${TIPOS_CUENTA[cuenta.tipo]} · ${NOMBRES[cuenta.persona]}`}
            color={claseColor(cuenta.color)}
          />
        ))}

        {/* Valor vacío: el gasto se guarda sin cuenta enlazada. */}
        <Tarjeta
          value=""
          titulo="Efectivo"
          pie="Sin cuenta"
          color="bg-muted-foreground"
          predeterminada={cuentas.length === 0}
        />
      </div>
    </fieldset>
  );
}

function Tarjeta({
  value,
  titulo,
  pie,
  color,
  predeterminada,
}: {
  value: string;
  titulo: string;
  pie: string;
  color: string;
  predeterminada?: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name="cuenta_id"
        value={value}
        defaultChecked={predeterminada}
        className="peer sr-only"
      />
      <span className="glass flex h-full flex-col gap-2 rounded-xl p-3.5 transition-colors peer-checked:border-primary peer-checked:bg-primary/10 peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
        <span aria-hidden className={`size-2 rounded-full ${color}`} />
        <span className="truncate text-sm font-semibold">{titulo}</span>
        <span className="truncate text-[11px] text-muted-foreground">{pie}</span>
      </span>
    </label>
  );
}
