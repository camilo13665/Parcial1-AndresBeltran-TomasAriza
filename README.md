# Sistema de Gestión de Emergencias

Plataforma para recibir, clasificar, asignar y monitorear solicitudes de
emergencia tras un desastre natural, en **Chocó, Pereira, Cali y
Manizales**.

Este repositorio contiene la **fase 1**: la estructura de Frontend +
Backend, ejecutable localmente, sobre la que se implementará
progresivamente la lógica de negocio y, más adelante, el despliegue en AWS
(Lambda, API Gateway, ECR), Docker, Supabase/PostgreSQL con PostGIS, y
Vercel.

## Arquitectura

```text
gestion-emergencias-2/
├── frontend/          Next.js + TypeScript + Tailwind — puerto 3000
├── backend/
│   ├── services/
│   │   ├── intake-triage/     Fastify — puerto 3001
│   │   ├── dispatch/          Fastify — puerto 3002
│   │   ├── geospatial/        Fastify — puerto 3003
│   │   └── notification/      Fastify — puerto 3004
│   └── shared/         Tipos, errores y utilidades comunes
└── docs/
```

Cada microservicio es independiente, mantiene su **propio contrato de
datos** (con Zod) y su store en memoria — no comparten base de datos ni
un paquete de tipos en tiempo de ejecución, para mantenerlos
verdaderamente desacoplados. `backend/shared/types/` documenta el
contrato de referencia común, pero los servicios no lo importan
directamente.

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Instalación

Desde la raíz del repositorio (usa npm workspaces):

```bash
npm install
```

### Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta `docs/supabase-schema.sql` en el SQL Editor.
3. Copia `.env.example` a `.env` y completa `SUPABASE_URL` y
  `SUPABASE_SERVICE_ROLE_KEY`.

La clave `SUPABASE_SERVICE_ROLE_KEY` es exclusiva del backend: nunca debe
llevar el prefijo `NEXT_PUBLIC_` ni publicarse en GitHub. Al iniciar, Intake,
Dispatch y Notification insertan sus datos semilla solo si todavía no existen.

Esto instala las dependencias del frontend y de los cuatro microservicios
en un solo paso.

## Ejecutar en desarrollo

**Backend** — cada microservicio en su propia terminal:

```bash
npm run dev:intake
npm run dev:dispatch
npm run dev:geospatial
npm run dev:notification
```

O los cuatro a la vez, con un único comando multiplataforma:

```bash
npm run dev:backend
```

> `dev:backend` ejecuta `scripts/dev-backend.mjs`, que levanta los cuatro
> microservicios como procesos hijos de Node (usando `npm.cmd` en
> Windows), muestra todos los logs en la misma terminal, y los detiene
> juntos con `Ctrl+C`. La versión anterior (`npm run dev:intake & ... &
> wait`) es sintaxis de bash/zsh y **no funciona en Windows/PowerShell** —
> ahí solo un servicio quedaba arriba de forma confiable, y por eso el
> frontend no encontraba Dispatch, Geospatial ni Notification y caía a
> datos de ejemplo. Este script no depende del shell del sistema
> operativo, así que funciona igual en Linux, macOS y Windows.

**Frontend**, en otra terminal:

```bash
npm run dev:frontend
```

## Verificar que todo funciona

Frontend:

```text
http://localhost:3000
http://localhost:3000/reportar
http://localhost:3000/dashboard
http://localhost:3000/emergencia/EMG-2024-0001   (dato mock)
```

Backend:

```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

Cada uno debe responder algo como:

```json
{ "status": "ok", "service": "intake-triage" }
```

El Frontend incluye una franja de **estado del sistema** (visible en Home
y en el Dashboard) que consulta estos cuatro `/health` en vivo desde el
navegador, para confirmar visualmente que los microservicios están
corriendo y aislados entre sí.

## Comunicación entre microservicios

Los cuatro microservicios ya **no son islas**: se comunican entre sí
exclusivamente por HTTP (sin base de datos compartida, sin imports de
lógica interna entre servicios). Cada uno sigue siendo dueño de su
propio contrato de datos.

```text
Frontend
  │  POST /emergencies
  ▼
Intake & Triage (3001)
  │  PATCH .../status  ──HTTP──▶  Notification (3004)
  ▲                                  POST /notifications
  │  GET /emergencies/:id
  │  PATCH .../status
  │
Dispatch (3002)  ◀── valida la emergencia antes de asignar recursos

Geospatial (3003) ──HTTP──▶ GET /emergencies (Intake & Triage)
                              genera estadísticas por zona
```

**Intake & Triage → Notification.** Cada vez que `PATCH
/emergencies/:id/status` cambia el estado de una emergencia, Intake &
Triage llama a `POST /notifications` en Notification & Status Broadcast
con el estado anterior y el nuevo. Es *best effort*: si Notification no
responde, la transición de estado en Intake & Triage se confirma
igualmente (no queremos que un servicio de notificaciones caído bloquee
el triage), y la respuesta incluye `sincronizacionNotification: { ok,
mensaje }` para que quien llamó sepa si el aviso se entregó.

**Dispatch → Intake & Triage.** Antes de asignar recursos, `POST
/dispatches` consulta `GET /emergencies/:id` en Intake & Triage para
confirmar que la emergencia existe y está en estado `PRIORIZADA`. Si
Intake & Triage no responde, Dispatch devuelve `502
UPSTREAM_SERVICE_ERROR` en vez de asumir que la emergencia es válida.
Si la validación pasa y los recursos se asignan, Dispatch llama a
`PATCH /emergencies/:id/status` con `estado: "ASIGNADA"` — ese cambio de
estado en Intake & Triage es lo que a su vez dispara la notificación.

**Geospatial → Intake & Triage.** `GET /zones/stats` consulta `GET
/emergencies` en Intake & Triage y agrega los resultados por
zona/prioridad en el momento (no guarda nada). Sigue existiendo `POST
/zones/aggregate`, que acepta una lista de emergencias directamente en
el body — útil para pruebas o clientes que ya tienen los datos a mano.

Cada llamada entre servicios tiene un timeout de 3 segundos y, si falla,
responde con un error explícito (`502 UPSTREAM_SERVICE_ERROR`) en vez de
colgarse o caerse — puedes apagar cualquier servicio y los demás siguen
funcionando y reportando el problema con claridad.

Las URLs de cada servicio se configuran por variable de entorno
(`INTAKE_SERVICE_URL`, `NOTIFICATION_SERVICE_URL`), con `localhost` y el
puerto por defecto como valor de respaldo.

### Demostrar el flujo completo

```bash
# 1. Crear una emergencia
curl -X POST http://localhost:3001/emergencies -H "Content-Type: application/json" -d '{
  "tipo":"SEARCH_RESCUE_MEDICAL","ciudad":"CALI",
  "descripcion":"Edificio colapsado con personas atrapadas",
  "latitud":3.45,"longitud":-76.53,
  "datosEspecificos":{"personasAtrapadasOHeridas":3,"riesgoInminente":true,"fugaDeGas":false,"fuego":true}
}'
# -> guarda el "id" devuelto, ej. EMG-2026-0009

# 2. Asignar un recurso ANTES de priorizar -> Dispatch lo rechaza (409)
curl -X POST http://localhost:3002/dispatches -H "Content-Type: application/json" \
  -d '{"emergenciaId":"EMG-2026-0009","recursoIds":["RES-002"]}'

# 3. Avanzar el estado hasta PRIORIZADA (cada paso notifica a Notification)
curl -X PATCH http://localhost:3001/emergencies/EMG-2026-0009/status -d '{"estado":"VALIDANDO"}' -H "Content-Type: application/json"
curl -X PATCH http://localhost:3001/emergencies/EMG-2026-0009/status -d '{"estado":"PRIORIZADA"}' -H "Content-Type: application/json"

# 4. Ahora sí: Dispatch valida contra Intake, asigna el recurso,
#    y avisa a Intake que la emergencia pasó a ASIGNADA
curl -X POST http://localhost:3002/dispatches -H "Content-Type: application/json" \
  -d '{"emergenciaId":"EMG-2026-0009","recursoIds":["RES-004"]}'

# 5. Confirmar que Intake ya la ve como ASIGNADA
curl http://localhost:3001/emergencies/EMG-2026-0009

# 6. Ver el historial de notificaciones generado automáticamente
curl "http://localhost:3004/notifications?emergenciaId=EMG-2026-0009"

# 7. Geospatial consulta Intake por HTTP y genera estadísticas por zona
curl http://localhost:3003/zones/stats
```

### Liberación de recursos (Intake & Triage → Dispatch)

Además del flujo anterior, cuando una emergencia llega a un estado final
(`RESUELTA` o `CANCELADA`), Intake & Triage llama a `POST
/resources/release` en Dispatch con el `emergenciaId`. Dispatch busca los
despachos asociados a esa emergencia y devuelve cada recurso a
`DISPONIBLE` (salvo los que estén `INACTIVO` a propósito). Es *best
effort*, igual que el aviso a Notification: si Dispatch no responde, el
cambio de estado en Intake & Triage se confirma igual, y la respuesta
incluye `sincronizacionDispatch: { ok, mensaje }`.

Sin esto, un recurso quedaba `ASIGNADO` para siempre después de atender
una sola emergencia — la ciudad se quedaba sin recursos disponibles tras
un par de pruebas y el panel de asignación mostraba "No hay recursos
disponibles" de forma permanente, sin importar la ciudad.

```bash
# Continuando el ejemplo anterior: resolver la emergencia libera el recurso
curl -X PATCH http://localhost:3001/emergencies/EMG-2026-0009/status \
  -H "Content-Type: application/json" -d '{"estado":"EN_ATENCION"}'
curl -X PATCH http://localhost:3001/emergencies/EMG-2026-0009/status \
  -H "Content-Type: application/json" -d '{"estado":"RESUELTA"}'
# -> la respuesta incluye "sincronizacionDispatch":{"ok":true}

# El recurso ya vuelve a aparecer como DISPONIBLE en su ciudad
curl "http://localhost:3002/resources?ciudad=CALI&estado=DISPONIBLE"
```

## Panel de operador (UI)

Ya no hace falta usar `curl` para operar el sistema — el dashboard y el
detalle de cada emergencia tienen acciones reales conectadas al backend:

- **Tabla del dashboard**: cada fila tiene una acción rápida "→ Siguiente
  estado" que llama a `PATCH /emergencies/:id/status` sin salir de la
  lista. Cuando una emergencia está en `PRIORIZADA`, esa acción rápida no
  aparece — hay que asignarle un recurso (ver abajo), que es lo que
  realmente la mueve a `ASIGNADA`.
- **Detalle de una emergencia** (`/emergencia/[id]`):
  - **Avanzar / Cancelar estado** — botones que llaman a Intake &
    Triage. "Avanzar" no aparece si el estado actual es `PRIORIZADA`
    (ver punto anterior) ni en estados finales (`RESUELTA`,
    `CANCELADA`).
  - **Asignar recurso** — solo visible/habilitado cuando la emergencia
    está en `PRIORIZADA`. Lista los recursos `DISPONIBLE` de la misma
    ciudad (`GET /resources?ciudad=...&estado=DISPONIBLE` en Dispatch) y,
    al confirmar, llama a `POST /dispatches` — el mismo endpoint que
    valida contra Intake & Triage y dispara la notificación automática.
  - **Actividad** — historial real de despachos (`GET /dispatches?emergenciaId=`)
    y notificaciones (`GET /notifications?emergenciaId=`) de esa
    emergencia específica.
- **Panel lateral del dashboard**:
  - **Estadísticas por zona** — vía `GET /zones/stats` en Geospatial
    (que a su vez consulta a Intake & Triage), no un conteo local.
  - **Notificaciones recientes** — los últimos eventos de todo el
    sistema, vía `GET /notifications` en Notification.

Cada acción refresca automáticamente el resto de paneles del dashboard
(estadísticas, tabla, notificaciones) para que el estado se vea
consistente en toda la pantalla sin recargar la página. Si el backend no
está corriendo, estas acciones simplemente no se muestran (el detalle
cae al modo de solo lectura con datos de ejemplo, igual que el
dashboard).

## Qué SÍ incluye esta fase

- Estructura completa de monorepo (frontend + backend + shared).
- Cuatro microservicios Fastify/TypeScript con **lógica de negocio real**
  (store en memoria, sin base de datos todavía):
  - **Intake & Triage**: `POST /emergencies`, `GET /emergencies` (con
    filtros de ciudad/prioridad/estado), `GET /emergencies/stats`,
    `GET /emergencies/:id`, `PATCH /emergencies/:id/status`. Valida con
    Zod, clasifica prioridad automáticamente según el tipo (P1–P4), y
    valida que las transiciones de estado sigan el flujo definido.
  - **Dispatch & Resource Assignment**: CRUD de recursos
    (`/resources`) y `POST /dispatches` para asignar recursos a una
    emergencia, validando que estén `DISPONIBLE` antes de asignarlos.
    `POST /resources/release` libera los recursos de una emergencia
    (invocado automáticamente por Intake & Triage al llegar a un estado
    final).
  - **Geospatial & Zone Aggregation**: `GET /zones` (metadata de las 4
    zonas), `POST /zones/aggregate` (agregación de emergencias por
    zona/prioridad) y `POST /zones/nearest` (distancia Haversine a la
    zona monitoreada más cercana).
  - **Notification & Status Broadcast**: `POST /notifications` y
    `GET /notifications` — registro de eventos de cambio de estado.
  - Cada servicio expone su propio `GET /health` y valida entradas con
    Zod, devolviendo errores 400/404/409 consistentes.
- Frontend conectado a los endpoints reales:
  - `/reportar` tiene campos reales por tipo de emergencia (P1–P4) y
    hace `POST /emergencies` contra Intake & Triage.
  - `/dashboard` hace `GET /emergencies` y `GET /resources` en vivo, con
    filtros funcionales.
  - `/emergencia/[id]` consulta la emergencia real por id.
  - **Si el backend no está corriendo**, el frontend no se rompe: cae
    automáticamente a datos mock y muestra un aviso de que está
    mostrando datos de ejemplo.
- Cliente HTTP centralizado (`frontend/services/api/client.ts`) con
  métodos tipados para cada servicio.

## Qué NO incluye todavía (fases posteriores)

- PostGIS y consultas geográficas avanzadas — la persistencia base en
  Supabase ya está preparada, pero las rutas siguen usando OSRM.
- Broker de eventos (Kafka, RabbitMQ, EventBridge). La comunicación
  entre microservicios es síncrona, por HTTP directo — funciona bien
  para esta fase, pero no hay colas, reintentos automáticos, ni entrega
  garantizada si un servicio está caído más de unos segundos.
- Transacciones distribuidas: si Dispatch reserva recursos y luego no
  logra avisarle a Intake & Triage (por ejemplo porque se cayó justo en
  ese momento), la asignación local no se revierte automáticamente —
  queda reflejado en `sincronizacionIntake.ok: false` para resolverlo
  manualmente.
- Autenticación y autorización.
- AWS (Lambda, API Gateway, ECR, Secrets Manager, IAM, CloudWatch,
  Canary/Feature Flags, Budgets), Docker de despliegue, CI/CD.
- Proveedor de mapas real y notificaciones en tiempo real (Webhooks /
  Realtime) — Notification solo expone un log consultable por polling.

## Solución de problemas

**El dashboard muestra "No se pudo conectar con Intake & Triage / Dispatch — mostrando datos de ejemplo".**
Significa que el frontend está arriba pero no encuentra alguno de los
cuatro microservicios en `localhost:3001–3004`. Verifica:

1. Que corriste `npm run dev:backend` (o los 4 `npm run dev:*`) y que la
   terminal no muestra errores de arranque.
2. Que cada uno responde: `curl http://localhost:3001/health` (y 3002,
   3003, 3004).
3. Si usas Windows y ves errores raros de sincronización de procesos con
   un método distinto a `npm run dev:backend`, usa ese script — está
   pensado para no depender de sintaxis de shell específica de Unix.

**Error de instalación / algo relacionado con `tsconfig.json` o
`compilerOptions` al correr `npm run dev` en un microservicio.**
Casi siempre es un `node_modules` fragmentado — por ejemplo, si en algún
momento se instaló una dependencia entrando a la carpeta de un
microservicio (`cd backend/services/dispatch && npm install`) en vez de
hacerlo desde la raíz con `npm install` (que usa los workspaces).
Solución: borra todos los `node_modules` y el lockfile, y reinstala una
sola vez desde la raíz:

```bash
rm -rf node_modules package-lock.json
rm -rf backend/services/*/node_modules
rm -rf frontend/node_modules
npm install
```

## Seguridad

No hay secretos ni credenciales en este repositorio. `.env` está
excluido en `.gitignore`; la gestión de secretos real se hará más
adelante mediante AWS Secrets Manager o Parameter Store.
