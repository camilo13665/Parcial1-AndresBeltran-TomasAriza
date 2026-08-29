# Sistema de Gestion de Emergencias

Plataforma web para recibir, clasificar, asignar y monitorear solicitudes de emergencia en Choco, Pereira, Cali y Manizales.

Para desplegar todo desde cero (Supabase, AWS y Vercel), ver [`docs/MANUAL_DESPLIEGUE.md`](docs/MANUAL_DESPLIEGUE.md). Diagramas C4 editables en [`docs/diagramas/c4-diagramas.drawio`](docs/diagramas/c4-diagramas.drawio).

El sistema esta organizado como un monorepo con un frontend Next.js y cuatro microservicios independientes en Fastify y TypeScript. La persistencia operativa se realiza en Supabase mediante su API REST.

## Arquitectura

```text
                           +------------------+
                           | Frontend Next.js |
                           |    localhost:3000|
                           +--------+---------+
                                    |
          +-------------------------+--------------------------+
          |                         |                          |
          v                         v                          v
 +----------------+        +----------------+        +----------------+
 | Intake &       | HTTP   | Dispatch &     | HTTP   | Geospatial &   |
 | Triage :3001   +-------->+ Resources :3002|        | Zones :3003    |
 +-------+--------+        +----------------+        +-------+--------+
         |                                                   |
         | HTTP                                              | HTTP
         v                                                   v
 +----------------+                                  Intake & Triage
 | Notification & |
 | Broadcast :3004|
 +--------+-------+
          |
          v
       Supabase
   emergencies, resources,
   dispatches, notifications
```

Cada microservicio mantiene sus rutas, esquemas Zod y reglas de negocio. La comunicacion entre servicios ocurre por HTTP; no se importan implementaciones internas ni se comparte logica en tiempo de ejecucion. `backend/shared/types` contiene tipos de referencia para el dominio.

## Requisitos

- Node.js 18 o superior.
- npm 9 o superior.
- Un proyecto de Supabase.
- Puertos disponibles `3000` a `3004` para ejecutar todos los servicios localmente.

## Instalacion

Desde `gestion-emergencias-2/gestion-emergencias-2`:

```bash
npm install
```


## Ejecucion

Para levantar los cuatro microservicios en una sola terminal:

```bash
npm run dev:backend
```

En otra terminal, levanta el frontend:

```bash
npm run dev:frontend
```

Tambien puedes iniciar cada servicio por separado:

```bash
npm run dev:intake
npm run dev:dispatch
npm run dev:geospatial
npm run dev:notification
```

### Ejecucion con Docker

Cada microservicio tiene su propio `Dockerfile` (multi-stage, imagen final
`node:20-alpine` sin dependencias de desarrollo). El build se hace desde la
raiz del monorepo porque las imagenes reutilizan el `package-lock.json` del
workspace:

```bash
docker build -f backend/services/intake-triage/Dockerfile -t intake-triage .
```

Para levantar los cuatro contenedores en red local con `docker-compose.yml`,
exporta primero las variables requeridas (ver [Configuracion y secretos](#configuracion-y-secretos-sin-env)) y luego:

```bash
docker compose up --build
```

Los servicios quedan disponibles en los mismos puertos `3001`-`3004`, ahora
resolviendose entre si por el nombre del servicio en la red de Docker en
vez de `localhost`.

URLs principales:

- Frontend: `http://localhost:3000`
- Reportar emergencia: `http://localhost:3000/reportar`
- Dashboard: `http://localhost:3000/dashboard`
- Intake & Triage: `http://localhost:3001`
- Dispatch: `http://localhost:3002`
- Geospatial: `http://localhost:3003`
- Notification: `http://localhost:3004`

Configuracion opcional del frontend:

```env
NEXT_PUBLIC_INTAKE_URL=http://localhost:3001
NEXT_PUBLIC_DISPATCH_URL=http://localhost:3002
NEXT_PUBLIC_GEOSPATIAL_URL=http://localhost:3003
NEXT_PUBLIC_NOTIFICATION_URL=http://localhost:3004
```

## Configuracion y secretos (sin .env)

Los cuatro microservicios **no leen ningun archivo `.env`** ni dependen de
`dotenv`: cada uno resuelve su configuracion con `loadConfig()`
(`src/config/secrets.ts`, uno por servicio, sin logica compartida en
tiempo de ejecucion) apenas arranca el proceso.

- **En AWS Lambda** (detectado por la variable `AWS_LAMBDA_FUNCTION_NAME`
  que Lambda define automaticamente): `loadConfig()` pide el secreto
  `emergencias/<STAGE>/<servicio>` a AWS Secrets Manager una sola vez por
  cold start, usando el rol IAM de ejecucion de la funcion, y lo deja en
  `process.env` para el resto de la instancia. `STAGE` por defecto es `prod`.
- **Fuera de Lambda** (local, Docker, docker-compose): toma las variables
  que ya inyecto el proceso o el contenedor. Nunca las lee de un archivo del
  repositorio; se exportan en la shell o se pasan con `docker run -e` /
  `environment:` en `docker-compose.yml`.
- Si falta una variable requerida, el servicio falla al arrancar con un
  mensaje explicito (`Faltan variables de configuracion: ...`) en vez de
  arrancar a medias.

Variables requeridas por servicio:

| Servicio | Variables |
|---|---|
| `intake-triage` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` |
| `dispatch` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SESSION_SECRET`, `ADMIN_USERNAME` |
| `geospatial` | ninguna obligatoria hoy (usa `INTAKE_SERVICE_URL` con fallback a `http://localhost:3001`) |
| `notification` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

`ADMIN_SESSION_SECRET` y `ADMIN_USERNAME` deben tener el **mismo valor** en
`intake-triage` y `dispatch`: el primero emite el token de sesion
administrativa y el segundo solo lo verifica.

Para correr localmente sin Docker, exporta las variables en la shell antes
de `npm run dev:backend` (por ejemplo en `~/.zshrc` o en un script propio
fuera del repo). Para Docker, exportalas antes de `docker compose up`; el
compose las reclama con `${VAR:?...}` y falla explicitamente si falta alguna.

## Despliegue en AWS (Lambda + API Gateway)

`template.yaml` (AWS SAM) define los 4 microservicios como funciones Lambda
empaquetadas como contenedor (mismo `Dockerfile` que Docker local, con el
[AWS Lambda Web Adapter](https://github.com/awslabs/aws-lambda-web-adapter)
agregado para correr Fastify sin reescribir handlers), detrás de un API
Gateway HTTP API compartido con stage `prod`.

Enrutamiento (sin prefijo `/v1`, 1:1 con las rutas reales de cada servicio,
sin solapamientos): `/emergencies*` y `/admin*` → Intake & Triage,
`/resources*` y `/dispatches*` → Dispatch, `/zones*` → Geospatial,
`/notifications*` → Notification. `/health` **no** se expone por el
Gateway (colisiona entre los 4 servicios); en Lambda el estado se observa
por CloudWatch, no por polling HTTP.

### Deploy

```bash
# 1. Crear los 4 secretos una sola vez (mismos valores que usa Docker/local):
aws secretsmanager create-secret --name emergencias/prod/intake-triage --secret-string '{"SUPABASE_URL":"...","SUPABASE_SERVICE_ROLE_KEY":"...","ADMIN_SESSION_SECRET":"...","ADMIN_USERNAME":"...","ADMIN_PASSWORD":"..."}'
aws secretsmanager create-secret --name emergencias/prod/dispatch --secret-string '{"SUPABASE_URL":"...","SUPABASE_SERVICE_ROLE_KEY":"...","ADMIN_SESSION_SECRET":"...","ADMIN_USERNAME":"..."}'
aws secretsmanager create-secret --name emergencias/prod/geospatial --secret-string '{}'
aws secretsmanager create-secret --name emergencias/prod/notification --secret-string '{"SUPABASE_URL":"...","SUPABASE_SERVICE_ROLE_KEY":"..."}'

# 2. Build + deploy
sam build
sam deploy --stack-name emergencias --region us-east-1 \
  --resolve-image-repos --resolve-s3 --capabilities CAPABILITY_IAM \
  --no-confirm-changeset --no-fail-on-empty-changeset

# 3. Conectar los servicios entre sí (ver por qué no va en el template más abajo)
STACK_NAME=emergencias AWS_REGION=us-east-1 ./scripts/set-lambda-service-urls.sh
```

### Por qué hace falta el paso 3

Cada Lambda corre aislada — no hay `localhost` compartido entre funciones
como en Docker Compose. Intake llama a Dispatch y Notification; Dispatch y
Geospatial llaman a Intake. La forma obvia de resolver esas URLs sería un
env var `!Sub https://${EmergenciasHttpApi}...` en el propio `template.yaml`,
pero eso es una dependencia circular para CloudFormation (la función
necesita la URL del Gateway, el Gateway necesita la función) y el deploy
falla. `scripts/set-lambda-service-urls.sh` corre después, lee la URL real
del stack y actualiza cada función por separado.

**Importante**: cualquier `sam deploy` posterior sobrescribe esas variables
con lo que hay en `template.yaml` (que no las incluye). Hay que volver a
correr el paso 3 después de *cualquier* redeploy, no solo el primero.

### Gotchas si algo no funciona

- **`AWS_LWA_REMOVE_BASE_PATH=/prod`** (ya en el template): el endpoint
  `execute-api` por defecto incluye el nombre del stage como prefijo
  literal del path que le llega a la función (`/prod/emergencies` en vez de
  `/emergencies`); sin esta variable, todo devuelve 404.
- Un servicio que llame a Secrets Manager necesita su propio permiso IAM
  (`Policies` en `template.yaml`) además de que el secreto exista — un
  secreto sin política da `AccessDeniedException` en el cold start.
- Una key de IAM recién creada puede tardar unos minutos en tener acceso a
  Lambda específicamente, aunque ya funcione para otros servicios con la
  misma policy — no es un problema de permisos, es propagación.
- Llamadas "best effort" entre servicios (notificaciones, liberación de
  recursos) deben llevar `await`: sin él, Lambda congela el proceso apenas
  se devuelve la respuesta HTTP y la llamada de fondo nunca termina.

## Estrategia de despliegue (Canary + rollback automático)

Opción elegida: **Canary con AWS CodeDeploy y alias Lambda**, integrado en `template.yaml` vía SAM (no hace falta CodeDeploy/Serverless Framework por fuera):

- `AutoPublishAlias: prod` (en `Globals.Function`): cada `sam deploy` publica una versión inmutable nueva y el alias `prod` — el que usa el API Gateway, no `$LATEST` — la recibe gradualmente.
- `DeploymentPreference: { Type: Canary10Percent5Minutes }` por función: 10% del tráfico a la versión nueva durante 5 minutos: si nada se dispara, pasa al 100%.
- Una alarma de **Errors** y otra de **Duration > 1500ms** por función (8 en total), con `Dimensions.Resource = <función>:prod` — miran específicamente el alias, no la función entera — y `Alarms` en el `DeploymentPreference` de cada una.

### Rollback automático — probado de verdad, no solo configurado

Para confirmar que el rollback funciona (no alcanza con tenerlo configurado), rompí `geospatial` a propósito (`process.exit(1)` en `/health/geospatial`), lo desplegué, y generé tráfico real contra el endpoint roto durante la ventana canary. Resultado:

1. La alarma `GeospatialErrorsAlarm` pasó a `ALARM` en cuanto CloudWatch evaluó el minuto con errores.
2. CodeDeploy detectó la alarma, **detuvo el despliegue solo** (`ALARM_ACTIVE`) y **revirtió el alias `prod` al 100% de la versión anterior** — sin ningún comando manual de mi parte.
3. `sam deploy` termina en `Error` cuando esto pasa (el rollback del alias hace fallar el update de CloudFormation) — es el comportamiento esperado, no un bug: un canary revertido es, por diseño, un deploy fallido.

Después revertí el bug y confirmé `curl` limpio (0 errores en 20 requests) antes de seguir.

### Operación

```bash
sam build
sam deploy --stack-name emergencias --region us-east-1 \
  --resolve-image-repos --resolve-s3 --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
  --no-confirm-changeset --no-fail-on-empty-changeset
STACK_NAME=emergencias AWS_REGION=us-east-1 ./scripts/set-lambda-service-urls.sh
```

`CAPABILITY_AUTO_EXPAND` es nuevo respecto a antes de tener canary — hace falta porque SAM expande `DeploymentPreference` en recursos de CodeDeploy por debajo. Si el deploy falla la primera vez con `SubscriptionRequiredException` en CodeDeploy, es porque la cuenta de AWS es nueva y CodeDeploy todavía no se activó — entrar una vez a la consola de CodeDeploy (o completar el upgrade de "Free Plan" a "Paid Plan" en cuentas nuevas de AWS) lo resuelve.

## Gobernanza de costos (AWS Budgets)

`MonthlyCostBudget` en `template.yaml` (`AWS::Budgets::Budget`) — versionado junto con el resto de la infraestructura, no configurado a mano en la consola:

- Presupuesto mensual estricto: **$10.00 USD** (parámetro `MonthlyBudgetLimitUsd`, override con `--parameter-overrides` si hace falta otro límite).
- Alerta 1: consumo **real** > 50% del presupuesto.
- Alerta 2: consumo **proyectado** (forecasted) > 85% del presupuesto.
- Ambas por correo (parámetro `BudgetAlertEmail`, default `tomas13ariza@gmail.com`).

Verificar la configuración desde la CLI:

```bash
aws budgets describe-budgets --account-id <account-id> --query "Budgets[?BudgetName=='emergencias-presupuesto-mensual']"
aws budgets describe-notifications-for-budget --account-id <account-id> --budget-name emergencias-presupuesto-mensual
```

## Base de datos y migraciones

El esquema vive versionado en `docs/migrations/`, en orden:

1. `001_initial_schema.sql` — las 4 tablas (`emergencies`, `resources`, `dispatches`, `notifications`) con RLS habilitado.
2. `002_rls_and_postgis.sql` — habilita la extension `postgis`, agrega una columna `ubicacion geography(Point,4326)` calculada automaticamente a partir de `latitud`/`longitud` (no cambia el contrato REST existente), un indice GiST, la funcion `nearby_resources(lat, lng, radio_metros, solo_disponibles)` para proximidad real, y las politicas RLS reales.

Corran ambos archivos completos, en orden, en el SQL Editor de Supabase (o via `supabase db push` si migran a la CLI de Supabase).

### Row Level Security

El backend siempre usa `SUPABASE_SERVICE_ROLE_KEY`, que en Postgres/Supabase **bypassea RLS por diseño** — las politicas no afectan a los microservicios. Gobiernan el acceso directo con la `anon key` (necesaria para que el dashboard use Supabase Realtime sin exponer la service role key en el navegador):

- **Lectura publica** en las 4 tablas: cualquiera con la `anon key` puede hacer `SELECT` (transparencia del panel).
- **Escritura bloqueada**: sin politica de `INSERT`/`UPDATE`/`DELETE` para `anon`/`authenticated`, Postgres deniega por defecto. Todas las escrituras pasan por los microservicios, que aplican las reglas de negocio (triage, transicion de estados, verificacion de disponibilidad) y, para acciones administrativas, el token de sesion HMAC.

El sistema todavia no tiene autenticacion de usuarios via Supabase Auth (la sesion admin es HMAC propia del backend, no un JWT de Supabase), asi que hoy no hay un claim real de "ciudadano" vs. "operador" para filtrar filas por rol dentro de Postgres — ver el comentario en `002_rls_and_postgis.sql` para el punto de extension cuando se agregue.

### PostGIS

`GET /resources/nearby?latitud=...&longitud=...&radioMetros=...&soloDisponibles=...` (en Dispatch, puerto `3002`) usa la funcion `nearby_resources` para encontrar recursos dentro de un radio real, ordenados por distancia — en vez del filtro "misma ciudad" que usa `POST /dispatches`. La semilla de 80 recursos ya trae coordenadas (dispersas alrededor del centro de cada ciudad) para poder probarlo.

### Verificar la conexion y las credenciales

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_ANON_KEY=... npm run verify:supabase
```

Corre `scripts/verify-supabase.mjs`: confirma que las 4 tablas son accesibles con la service role key, que `nearby_resources` existe (o sea, que `002_rls_and_postgis.sql` corrio y PostGIS esta habilitado), y — si le pasan `SUPABASE_ANON_KEY` — que la anon key puede leer pero no puede escribir. Cada chequeo que falla imprime que migracion correr o que revisar.

Las tres variables se consiguen en el dashboard de Supabase, en **Project Settings → API**: `SUPABASE_URL` es el "Project URL", `SUPABASE_SERVICE_ROLE_KEY` es la `service_role` (secreta, nunca al frontend), `SUPABASE_ANON_KEY` es la `anon`/`public` (esa si es segura de exponer, RLS la protege).

## Microservicios

### Intake & Triage

Puerto `3001`. Es el propietario del ciclo de vida de las emergencias.

- Recibe reportes con `POST /emergencies`.
- Lista y filtra emergencias con `GET /emergencies`.
- Consulta estadisticas con `GET /emergencies/stats`.
- Consulta una emergencia con `GET /emergencies/:id`.
- Cambia el estado con `PATCH /emergencies/:id/status`.
- Valida los datos con Zod y clasifica la prioridad segun el tipo de emergencia.
- Notifica cambios de estado a Notification.
- Solicita la liberacion de recursos cuando una emergencia queda `RESUELTA` o `CANCELADA`.

Estados soportados: `RECIBIDA`, `VALIDANDO`, `PRIORIZADA`, `ASIGNADA`, `EN_ATENCION`, `RESUELTA` y `CANCELADA`.

### Dispatch & Resource Assignment

Puerto `3002`. Administra recursos y despachos.

- Crea, consulta y filtra recursos mediante `/resources`.
- Consulta disponibilidad con `GET /resources/stats`.
- Busca recursos por proximidad real (PostGIS) con `GET /resources/nearby`.
- Cambia el estado de un recurso con `PATCH /resources/:id/status`.
- Asigna uno o varios recursos con `POST /dispatches`.
- Libera recursos asociados con `POST /resources/release`.
- Antes de asignar, valida con Intake que la emergencia exista y este `PRIORIZADA`.
- Verifica que los recursos pertenezcan a la misma ciudad y esten `DISPONIBLE`.

La semilla contiene 80 recursos: 20 por ciudad. Se insertan en Supabase de forma idempotente cuando Dispatch consulta recursos o despachos.

### Geospatial & Zone Aggregation

Puerto `3003`. Consulta y agrupa informacion geografica sin guardar agregaciones.

- `GET /zones`: metadata de las zonas monitoreadas.
- `GET /zones/stats`: estadisticas por ciudad y prioridad; consulta emergencias en Intake.
- `POST /zones/aggregate`: agrega una lista de emergencias recibida en el body.
- `POST /zones/nearest`: calcula la zona mas cercana usando distancia Haversine.

### Notification & Status Broadcast

Puerto `3004`. Registra el historial de cambios de estado.

- `POST /notifications`: guarda un evento.
- `GET /notifications`: lista los eventos mas recientes.
- `GET /notifications/:id`: consulta un evento especifico.
- `GET /notifications?emergenciaId=...`: filtra el historial de una emergencia.

Actualmente funciona como bitacora consultable. No envia SMS, correo ni push, y la entrega en tiempo real se puede incorporar posteriormente con Webhooks o Supabase Realtime.

## Comunicacion y resiliencia

- Intake comunica cambios de estado a Notification por HTTP.
- Dispatch consulta y actualiza emergencias mediante Intake.
- Geospatial consulta emergencias mediante Intake.
- Las llamadas entre servicios tienen timeout de tres segundos.
- Los fallos de servicios externos se expresan con errores explicitos, normalmente `502 UPSTREAM_SERVICE_ERROR`.
- Las notificaciones y la liberacion de recursos son operaciones secundarias de tipo *best effort*: una falla no bloquea el cambio principal de estado.
- El frontend consulta los cuatro `health checks` y muestra un estado degradado cuando un servicio no esta disponible.

## Verificacion rapida

Comprueba la salud de cada servicio:

```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```





## Seguridad

### Controles implementados

- Las entradas de los endpoints se validan con esquemas Zod.
- Los errores se devuelven con codigos y mensajes consistentes, sin exponer credenciales.
- La clave `SUPABASE_SERVICE_ROLE_KEY` solo se utiliza en el backend y nunca debe exponerse al frontend.
- Supabase tiene Row Level Security habilitado en las 4 tablas, con politicas reales: lectura publica para la `anon key` (dashboard/Realtime), escritura bloqueada salvo para la `service_role` que usa el backend. Ver [Base de datos y migraciones](#base-de-datos-y-migraciones).
- Las operaciones de asignacion de despachos requieren un Bearer token de sesion administrativa.
- La sesion administrativa se firma con HMAC-SHA256, tiene expiracion y compara firmas de forma segura.
- Ningun servicio usa `dotenv` ni lee archivos `.env`: la configuracion se resuelve en tiempo de ejecucion desde AWS Secrets Manager (Lambda) o desde variables de entorno inyectadas por el contenedor (local/Docker). Ver [Configuracion y secretos](#configuracion-y-secretos-sin-env).
- Logs, dependencias y artefactos de compilacion estan excluidos de Git; cualquier archivo `.env` que llegue a crearse localmente tambien lo esta, aunque el codigo ya no lo necesita para funcionar.


## Validacion del proyecto

Compilar los microservicios individualmente:

```bash
cd backend/services/intake-triage && npm run build
cd ../dispatch && npm run build
cd ../geospatial && npm run build
cd ../notification && npm run build
```

Compilar y revisar el frontend:

```bash
cd frontend
npm run lint
npm run build
```

Construir las imagenes de Docker de los cuatro microservicios (desde la raiz del monorepo):

```bash
docker build -f backend/services/intake-triage/Dockerfile -t intake-triage .
docker build -f backend/services/dispatch/Dockerfile -t dispatch .
docker build -f backend/services/geospatial/Dockerfile -t geospatial .
docker build -f backend/services/notification/Dockerfile -t notification .
```

