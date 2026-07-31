-- Los gastos recurrentes no hacen falta por ahora, y las deudas se van a
-- llevar en otro sitio. Fuera las dos: código y tablas vivos que nadie
-- alcanza son deuda técnica disfrazada de funcionalidad.
--
-- ATENCIÓN: esto borra los datos de ambas tablas. Si había recurrentes o
-- deudas cargados, se pierden. El historial de git guarda la implementación
-- entera por si algún día vuelven.

-- La columna de gastos que apuntaba a la plantilla recurrente, y su índice.
-- Los gastos que ya se hubieran generado se quedan: pierden su origen, no su
-- monto ni su fecha, así que la deuda cruzada y el presupuesto no se mueven.
drop index if exists public.gastos_recurrente_mes_idx;
alter table public.gastos drop column if exists recurrente_id;

drop table if exists public.recurrentes;
drop table if exists public.deudas;
