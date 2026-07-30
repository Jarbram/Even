-- Migración 0001 — Hogares y perfiles.
-- Base de auth: dos personas comparten un household; todo lo demás cuelga de él.

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 60),
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.households is 'Un hogar = una pareja. Todo el resto de datos se aísla por household_id.';

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  household_id uuid references public.households (id) on delete set null,
  display_name text not null check (length(trim(display_name)) between 1 and 40),
  created_at timestamptz not null default now()
);

-- La FK se consulta en cada policy; sin índice cada verificación es un seq scan.
create index profiles_household_id_idx on public.profiles (household_id);

-- ---------------------------------------------------------------------------
-- Helper para RLS
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER a propósito: salta RLS sobre `profiles` para poder resolver
-- el household del usuario sin recursión infinita en la policy de `profiles`.
-- Vive en `private`, que no está expuesto por PostgREST, y solo `authenticated`
-- puede ejecutarlo.
create or replace function private.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select household_id from public.profiles where id = (select auth.uid());
$$;

revoke execute on function private.current_household_id() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.current_household_id() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.households enable row level security;
alter table public.profiles enable row level security;

-- `(select ...)` envuelve la llamada para que Postgres la evalúe una vez por
-- query en vez de una vez por fila.
create policy households_select on public.households
  for select to authenticated
  using (id = (select private.current_household_id()));

create policy households_update on public.households
  for update to authenticated
  using (id = (select private.current_household_id()))
  with check (id = (select private.current_household_id()));

-- Sin INSERT/DELETE directo: los hogares se crean con create_household().

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or household_id = (select private.current_household_id())
  );

create policy profiles_insert_self on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Alta automática de perfil al registrarse
-- ---------------------------------------------------------------------------

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Crear / unirse a un hogar
-- ---------------------------------------------------------------------------

-- Código de 6 caracteres sin I, O, 0 ni 1 para que se pueda dictar en voz alta.
create or replace function private.generate_invite_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1),
    ''
  )
  from generate_series(1, 6);
$$;

create or replace function public.create_household(household_name text)
returns public.households
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  new_household public.households;
begin
  if uid is null then
    raise exception 'No autenticado';
  end if;

  if exists (select 1 from public.profiles p where p.id = uid and p.household_id is not null) then
    raise exception 'Ya perteneces a un hogar';
  end if;

  -- El unique index sobre invite_code es la fuente de verdad; si colisiona,
  -- reintenta. 32^6 combinaciones, así que en la práctica no entra dos veces.
  loop
    begin
      insert into public.households (name, invite_code)
      values (trim(household_name), private.generate_invite_code())
      returning * into new_household;
      exit;
    exception when unique_violation then
      -- reintenta con otro código
    end;
  end loop;

  update public.profiles set household_id = new_household.id where id = uid;

  return new_household;
end;
$$;

create or replace function public.join_household(code text)
returns public.households
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  target public.households;
  member_count int;
begin
  if uid is null then
    raise exception 'No autenticado';
  end if;

  if exists (select 1 from public.profiles p where p.id = uid and p.household_id is not null) then
    raise exception 'Ya perteneces a un hogar';
  end if;

  select * into target from public.households h where h.invite_code = upper(trim(code));
  if target.id is null then
    raise exception 'Ese código de invitación no existe';
  end if;

  select count(*) into member_count from public.profiles p where p.household_id = target.id;
  if member_count >= 2 then
    raise exception 'Ese hogar ya tiene dos integrantes';
  end if;

  update public.profiles set household_id = target.id where id = uid;

  return target;
end;
$$;

revoke execute on function public.create_household(text) from public, anon;
revoke execute on function public.join_household(text) from public, anon;
grant execute on function public.create_household(text) to authenticated;
grant execute on function public.join_household(text) to authenticated;
