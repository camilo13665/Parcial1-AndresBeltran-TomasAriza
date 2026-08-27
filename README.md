# Sistema de Gestion de Emergencias

Plataforma web para recibir, clasificar, asignar y monitorear solicitudes de emergencia en Choco, Pereira, Cali y Manizales.

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

### Configuracion de Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta [docs/supabase-schema.sql](docs/supabase-schema.sql) en el SQL Editor.
3. Crea un archivo `.env` en la raiz del proyecto con:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role
ADMIN_USERNAME=admin
ADMIN_PASSWORD=elige-una-clave-segura
ADMIN_SESSION_SECRET=una-clave-secreta-larga
```

El archivo `.env` es local y esta excluido por `.gitignore`. No publiques la `SUPABASE_SERVICE_ROLE_KEY` ni ninguna otra credencial.

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

Ejemplo de consulta de recursos:

```bash
curl "http://localhost:3002/resources?ciudad=CALI&estado=DISPONIBLE"
```

Ejemplo de historial de una emergencia:

```bash
curl "http://localhost:3004/notifications?emergenciaId=EMG-2026-0001"
```

## Seguridad

### Controles implementados

- Las entradas de los endpoints se validan con esquemas Zod.
- Los errores se devuelven con codigos y mensajes consistentes, sin exponer credenciales.
- La clave `SUPABASE_SERVICE_ROLE_KEY` solo se utiliza en el backend y nunca debe exponerse al frontend.
- Supabase tiene Row Level Security habilitado en las tablas principales.
- Las operaciones de asignacion de despachos requieren un Bearer token de sesion administrativa.
- La sesion administrativa se firma con HMAC-SHA256, tiene expiracion y compara firmas de forma segura.
- `.env`, logs, dependencias y artefactos de compilacion estan excluidos de Git.

### Recomendaciones para despliegue

- Usar HTTPS para frontend y comunicaciones entre servicios.
- Guardar secretos en un gestor como AWS Secrets Manager, Parameter Store o el sistema de secretos del proveedor de despliegue.
- Crear politicas RLS explicitas en Supabase para cada rol y tabla.
- Reemplazar credenciales administrativas simples por un proveedor de identidad con roles y rotacion de claves.
- Restringir CORS a los dominios autorizados; la configuracion local permite origenes amplios para desarrollo.
- Agregar rate limiting, auditoria, reintentos con backoff e idempotencia para operaciones distribuidas.

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

## Limitaciones conocidas

- La comunicacion entre servicios es sincrona y no existe una cola de eventos.
- No hay reintentos automaticos ni garantia de entrega cuando Notification esta caido.
- No existen transacciones distribuidas para revertir una asignacion si falla la sincronizacion con Intake.
- Notification registra eventos, pero no entrega avisos por canales externos.
- La autenticacion administrativa actual es basica y debe evolucionar antes de un despliegue publico.
