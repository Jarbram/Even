import { Skeleton } from "@/components/ui/skeleton";

/**
 * Se ve al instante en cuanto se toca un tab, antes de que lleguen los datos
 * del servidor. Sin esto la navegación se sentía trabada: la pantalla vieja
 * se quedaba quieta hasta que la nueva estaba lista entera.
 */
export default function Loading() {
  return (
    <div aria-hidden>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-2.5 mb-6 h-4 w-28" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="mt-6 flex flex-col gap-2.5">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}
