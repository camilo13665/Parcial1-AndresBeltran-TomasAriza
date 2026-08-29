create table if not exists public.emergencies (
  id text primary key,
  tipo text not null,
  prioridad text not null check (prioridad in ('CRITICA','ALTA','MEDIA','BAJA')),
  ciudad text not null check (ciudad in ('CHOCO','PEREIRA','CALI','MANIZALES')),
  descripcion text not null,
  latitud double precision not null,
  longitud double precision not null,
  estado text not null check (estado in ('RECIBIDA','VALIDANDO','PRIORIZADA','ASIGNADA','EN_ATENCION','RESUELTA','CANCELADA')),
  datos_especificos jsonb not null default '{}'::jsonb,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create table if not exists public.resources (
  id text primary key,
  tipo text not null,
  organismo text not null,
  ciudad text not null check (ciudad in ('CHOCO','PEREIRA','CALI','MANIZALES')),
  estado text not null check (estado in ('DISPONIBLE','ASIGNADO','EN_RUTA','OCUPADO','INACTIVO')),
  latitud double precision,
  longitud double precision,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create table if not exists public.dispatches (
  id text primary key,
  emergencia_id text not null,
  recurso_ids text[] not null,
  notas text,
  fecha_asignacion timestamptz not null default now()
);

create table if not exists public.notifications (
  id text primary key,
  emergencia_id text not null,
  estado_anterior text not null,
  estado_nuevo text not null,
  mensaje text not null,
  fecha_creacion timestamptz not null default now()
);

create index if not exists emergencies_ciudad_idx on public.emergencies(ciudad);
create index if not exists emergencies_estado_idx on public.emergencies(estado);
create index if not exists dispatches_emergencia_idx on public.dispatches(emergencia_id);
create index if not exists notifications_emergencia_idx on public.notifications(emergencia_id);

alter table public.emergencies enable row level security;
alter table public.resources enable row level security;
alter table public.dispatches enable row level security;
alter table public.notifications enable row level security;
