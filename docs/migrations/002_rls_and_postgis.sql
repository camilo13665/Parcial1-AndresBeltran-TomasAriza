-- 002_rls_and_postgis.sql
-- Aplica sobre 001_initial_schema.sql. Ejecutar completo en el SQL Editor
-- de Supabase (o vía `supabase db push` si migran a la CLI).
--
-- Después de correrlo, si el frontend/Postman no ven las columnas o la
-- función nuevas de inmediato, refresquen el cache de esquema de PostgREST:
--   NOTIFY pgrst, 'reload schema';
-- (normalmente Supabase lo hace solo tras un DDL, pero a veces tarda unos
-- segundos o no dispara si se corrió desde una conexión externa).

-- ── PostGIS ──────────────────────────────────────────────────────────────
-- Habilita tipos y funciones geoespaciales (ST_*, geography).
create extension if not exists postgis;

-- Columna geography derivada de latitud/longitud, calculada por Postgres
-- (GENERATED ALWAYS ... STORED): no se puede escribir directo y se
-- mantiene sincronizada sola. El contrato REST no cambia — PostgREST
-- sigue devolviendo latitud/longitud como number igual que hoy — esta
-- columna es solo para consultas espaciales del lado del servidor.
alter table public.emergencies
  add column if not exists ubicacion geography(Point, 4326)
    generated always as (ST_SetSRID(ST_MakePoint(longitud, latitud), 4326)::geography) stored;

-- resources.latitud/longitud ya existen en 001 (nullable: hoy ningún
-- recurso las trae poblada por defecto). La columna generada queda en
-- null hasta que un recurso tenga coordenadas.
alter table public.resources
  add column if not exists ubicacion geography(Point, 4326)
    generated always as (
      case when latitud is not null and longitud is not null
        then ST_SetSRID(ST_MakePoint(longitud, latitud), 4326)::geography
      end
    ) stored;

create index if not exists emergencies_ubicacion_gix on public.emergencies using gist (ubicacion);
create index if not exists resources_ubicacion_gix on public.resources using gist (ubicacion);

-- RPC de proximidad real (radio en metros, ST_DWithin usa el índice GiST).
-- Expuesta automáticamente por PostgREST en POST /rest/v1/rpc/nearby_resources.
create or replace function public.nearby_resources(
  lat double precision,
  lng double precision,
  radio_metros double precision default 15000,
  solo_disponibles boolean default true
)
returns table (
  id text,
  tipo text,
  organismo text,
  ciudad text,
  estado text,
  distancia_metros double precision
)
language sql
stable
as $$
  select r.id, r.tipo, r.organismo, r.ciudad, r.estado,
         ST_Distance(r.ubicacion, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) as distancia_metros
  from public.resources r
  where r.ubicacion is not null
    and ST_DWithin(r.ubicacion, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radio_metros)
    and (not solo_disponibles or r.estado = 'DISPONIBLE')
  order by distancia_metros asc;
$$;

grant execute on function public.nearby_resources(double precision, double precision, double precision, boolean)
  to anon, authenticated;

-- ── RLS ──────────────────────────────────────────────────────────────────
-- El backend (los 4 microservicios) siempre usa la service_role key, que
-- Postgres/Supabase hace bypassear RLS por diseño — estas políticas NO
-- afectan al backend. Gobiernan el acceso directo con la anon key, que
-- hace falta para que el dashboard use Supabase Realtime sin exponer la
-- service role key en el navegador.
--
-- El sistema todavía no tiene autenticación de usuarios vía Supabase Auth
-- (la sesión admin es HMAC propia del backend, no un JWT de Supabase), así
-- que hoy no existe un claim real de "ciudadano" vs "operador" para filtrar
-- filas por rol dentro de Postgres. Mientras eso no se implemente, esa
-- distinción vive en el backend (HTTP): las escrituras administrativas ya
-- están protegidas por `requireAdmin`. Estas políticas dejan lectura
-- pública (transparencia del panel para cualquier ciudad) y bloquean toda
-- escritura directa a la base — INSERT/UPDATE/DELETE solo pasan por los
-- microservicios, que sí aplican las reglas de negocio (triage, transición
-- de estados, disponibilidad de recursos). Sin una política de escritura,
-- RLS deniega por defecto: no hace falta un REVOKE explícito.
--
-- Extensión futura, cuando haya Supabase Auth con un claim de rol:
--   using (auth.jwt() ->> 'role' = 'operador' or <condición pública>)

drop policy if exists "lectura publica" on public.emergencies;
create policy "lectura publica" on public.emergencies
  for select to anon, authenticated using (true);

drop policy if exists "lectura publica" on public.resources;
create policy "lectura publica" on public.resources
  for select to anon, authenticated using (true);

drop policy if exists "lectura publica" on public.dispatches;
create policy "lectura publica" on public.dispatches
  for select to anon, authenticated using (true);

drop policy if exists "lectura publica" on public.notifications;
create policy "lectura publica" on public.notifications
  for select to anon, authenticated using (true);

notify pgrst, 'reload schema';
