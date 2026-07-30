import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Etiqueta + input con el tratamiento glass del diseño. */
export function Field({
  name,
  label,
  ...props
}: React.ComponentProps<typeof Input> & { name: string; label: string }) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={name}
        className="text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase"
      >
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        className="glass h-12 rounded-md px-4 text-base font-medium text-foreground placeholder:text-muted-foreground/60"
        {...props}
      />
    </div>
  );
}
