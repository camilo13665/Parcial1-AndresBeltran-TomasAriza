# Manual de despliegue

Guía paso a paso para desplegar el Sistema de Gestión de Emergencias desde cero: Supabase → backend en AWS (Lambda + API Gateway + Canary) → frontend en Vercel → gobernanza de costos. Cada paso es el que realmente se ejecutó para levantar el ambiente `prod` actual, no un procedimiento aspiracional.

Ver también: [`README.md`](../README.md) (referencia técnica de cada pieza) y [`docs/migrations/`](./migrations/) (esquema SQL).

## 0. Prerrequisitos

**Cuentas** (todas tienen capa gratuita):
- Supabase — [supabase.com](https://supabase.com)
- AWS — [aws.amazon.com](https://aws.amazon.com). Si la cuenta es nueva, dos cosas a tener en cuenta desde ya (ver [Troubleshooting](#troubleshooting)): puede pedir pasar de "Free Plan" a "Paid Plan" antes de que Lambda/CodeDeploy respondan, y una IAM key recién creada puede tardar unos minutos en tener acceso pleno a Lambda.
- Vercel — [vercel.com](https://vercel.com)

**Herramientas locales:**

```bash
# macOS (Homebrew)
brew install node awscli aws-sam-cli
npm install -g vercel
```

Node 18+, npm 9+. Docker Desktop corriendo (`sam build` compila las imágenes de Lambda con Docker).

## 1. Supabase

1. Crear un proyecto nuevo en el dashboard de Supabase.
2. **SQL Editor** → pegar y ejecutar, en orden, el contenido completo de:
   - [`docs/migrations/001_initial_schema.sql`](./migrations/001_initial_schema.sql) — las 4 tablas.
   - [`docs/migrations/002_rls_and_postgis.sql`](./migrations/002_rls_and_postgis.sql) — PostGIS, columnas geográficas, políticas RLS.
3. **Project Settings → API** → anotar:
   - `Project URL` → será `SUPABASE_URL`
   - `service_role` (o `sb_secret_...` en el sistema nuevo de keys) → será `SUPABASE_SERVICE_ROLE_KEY`
   - `anon` (o `sb_publishable_...`) → solo necesaria para `scripts/verify-supabase.mjs`

4. Verificar antes de seguir:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_ANON_KEY=... npm run verify:supabase
```

Debe confirmar: las 4 tablas accesibles, `nearby_resources` responde (PostGIS activo), la `anon key` puede leer pero no escribir (RLS activo).

## 2. Backend en AWS (Lambda + API Gateway + Canary)

### 2.1 Credenciales

```bash
aws configure
# o exportar directamente:
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_DEFAULT_REGION=us-east-1
```

El usuario de IAM necesita permisos amplios (Lambda, ECR, API Gateway, IAM, Secrets Manager, CloudFormation, S3, CodeDeploy, CloudWatch, Budgets) — en una cuenta personal, adjuntar la policy administrada `AdministratorAccess` es lo más simple.

### 2.2 Crear los 4 secretos

Mismos valores para `intake-triage` y `dispatch` en `ADMIN_SESSION_SECRET` / `ADMIN_USERNAME` — el primero emite el token de sesión admin, el segundo solo lo verifica.

```bash
aws secretsmanager create-secret --name emergencias/prod/intake-triage --secret-string '{
  "SUPABASE_URL": "https://TU-PROYECTO.supabase.co",
  "SUPABASE_SERVICE_ROLE_KEY": "TU_SERVICE_ROLE_KEY",
  "ADMIN_SESSION_SECRET": "un-secreto-largo-y-random",
  "ADMIN_USERNAME": "admin",
  "ADMIN_PASSWORD": "una-contrasena-fuerte"
}'

aws secretsmanager create-secret --name emergencias/prod/dispatch --secret-string '{
  "SUPABASE_URL": "https://TU-PROYECTO.supabase.co",
  "SUPABASE_SERVICE_ROLE_KEY": "TU_SERVICE_ROLE_KEY",
  "ADMIN_SESSION_SECRET": "el-mismo-secreto-de-arriba",
  "ADMIN_USERNAME": "admin"
}'

aws secretsmanager create-secret --name emergencias/prod/geospatial --secret-string '{}'

aws secretsmanager create-secret --name emergencias/prod/notification --secret-string '{
  "SUPABASE_URL": "https://TU-PROYECTO.supabase.co",
  "SUPABASE_SERVICE_ROLE_KEY": "TU_SERVICE_ROLE_KEY"
}'
```

Generar un secreto random para `ADMIN_SESSION_SECRET`: `openssl rand -hex 32`.

### 2.3 Build y deploy

Desde la raíz del monorepo:

```bash
sam build
sam deploy \
  --stack-name emergencias \
  --region us-east-1 \
  --resolve-image-repos \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset
```

Esto crea/actualiza: 4 repos ECR, 4 funciones Lambda (con alias `prod` y canary `Canary10Percent5Minutes`), el API Gateway, 8 alarmas de CloudWatch, la app de CodeDeploy, y el presupuesto de AWS Budgets — todo en un solo comando, definido en [`template.yaml`](../template.yaml).

En una función que cambió de código, el deploy tarda ~5 minutos: sube al 10% de tráfico, espera la ventana del canary, y si no hay alarmas pasa al 100%.

### 2.4 Conectar los servicios entre sí

Los 4 servicios están detrás del mismo Gateway pero **no pueden llamarse por `localhost`** (cada Lambda es un proceso aislado). Como referenciar la URL del propio Gateway desde una función que ese Gateway invoca es una dependencia circular para CloudFormation, esto se resuelve en un paso aparte:

```bash
STACK_NAME=emergencias AWS_REGION=us-east-1 ./scripts/set-lambda-service-urls.sh
```

**Correr este script después de CADA `sam deploy`** — CloudFormation no conoce estas variables (no están en el template) y las borra en cada actualización de las funciones que toca.

### 2.5 Verificar

```bash
API=$(aws cloudformation describe-stacks --stack-name emergencias --region us-east-1 \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)

curl "$API/health/intake"
curl "$API/health/dispatch"
curl "$API/health/geospatial"
curl "$API/health/notification"
curl "$API/zones"
```

Los 4 `/health/*` deben responder `{"status":"ok",...}` y `/zones` debe traer las 4 ciudades.

## 3. Frontend en Vercel

```bash
cd frontend
vercel link           # crea/vincula el proyecto
```

Setear las 4 variables (todas apuntan a la MISMA URL del Gateway, ya que un solo API Gateway sirve a los 4 servicios):

```bash
for var in NEXT_PUBLIC_INTAKE_URL NEXT_PUBLIC_DISPATCH_URL NEXT_PUBLIC_GEOSPATIAL_URL NEXT_PUBLIC_NOTIFICATION_URL; do
  echo "$API" | vercel env add "$var" production
done

vercel deploy --prod
```

**Importante:** después de desplegar, tomar la URL real de Vercel (ej. `https://tu-proyecto.vercel.app`) y agregarla a `CorsConfiguration.AllowOrigins` en `template.yaml`, después redesplegar el backend (paso 2.3) — si no, el navegador bloquea las peticiones por CORS aunque la API funcione bien por `curl`.

## 4. AWS Budgets

Ya queda creado por el mismo `sam deploy` del paso 2.3 (recurso `MonthlyCostBudget` en `template.yaml`): $10 USD/mes, alertas al 50% real y 85% proyectado, por correo (parámetro `BudgetAlertEmail`, default en el template).

Para usar otro correo o límite sin editar el archivo:

```bash
sam deploy ... --parameter-overrides BudgetAlertEmail=otro@correo.com MonthlyBudgetLimitUsd=15
```

Verificar:

```bash
aws budgets describe-budgets --account-id <ACCOUNT_ID> \
  --query "Budgets[?BudgetName=='emergencias-presupuesto-mensual']"
```

Para la entrega: captura de pantalla de **Billing and Cost Management → Budgets** en la consola.

## 5. Probar el rollback automático (opcional, para evidencia)

Reproduce lo que se validó en este proyecto: romper una función a propósito, ver la alarma dispararse y a CodeDeploy revertir solo.

1. Editar, por ejemplo, `backend/services/geospatial/src/controllers/health.controller.ts` y agregar `process.exit(1);` como primera línea de `getHealth`.
2. `sam build && sam deploy ...` (mismo comando del paso 2.3).
3. En paralelo, mandar tráfico al endpoint roto durante la ventana canary (los primeros ~5 minutos tras el deploy):
   ```bash
   for i in $(seq 1 100); do curl -s -o /dev/null "$API/health/geospatial" & done; wait
   ```
4. Revisar la alarma y el estado del alias:
   ```bash
   aws cloudwatch describe-alarms --alarm-name-prefix emergencias-Geospatial --query "MetricAlarms[].StateValue"
   aws lambda get-alias --function-name emergencias-geospatial --name prod --query "RoutingConfig"
   ```
   Con la alarma en `ALARM`, CodeDeploy detiene el despliegue y el alias vuelve a la versión anterior — `RoutingConfig` queda en `null` (100% en la versión buena) sin que se ejecute ningún comando de rollback manual.
5. Revertir el cambio y repetir el paso 2.3 para volver a un estado limpio.

## Troubleshooting

| Síntoma | Causa | Solución |
|---|---|---|
| `AccessDeniedException` en llamadas a Lambda, aunque el usuario tenga `AdministratorAccess` | Una access key recién creada puede tardar unos minutos en tener acceso pleno a Lambda específicamente (no es un problema de permisos) | Esperar 1-3 minutos y reintentar |
| `SubscriptionRequiredException` en CodeDeploy | Cuenta de AWS nueva en "Free Plan", con acceso restringido a ciertos servicios | Consola de AWS → completar el paso de "Upgrade plan" (no cobra una suscripción aparte, solo habilita el pago por uso normal) |
| `POST /prod/emergencies` da 404 aunque la ruta exista | El endpoint `execute-api` por defecto manda el nombre del stage como parte del path | Ya resuelto en el template con `AWS_LWA_REMOVE_BASE_PATH: /prod` — si se quita ese env var, vuelve a pasar |
| `AWS::Lambda::Version` falla con "A version for this Lambda function exists" en un redeploy tras un deploy fallido anterior | El intento fallido publicó una versión que CloudFormation no pudo limpiar en el rollback | `aws lambda list-versions-by-function --function-name <fn>`, confirmar que la versión huérfana no tiene alias apuntándole, y `aws lambda delete-function --function-name <fn> --qualifier <version>` |
| Las funciones no se encuentran entre sí (timeouts en `DISPATCH_SERVICE_URL`, etc.) | Se olvidó correr `set-lambda-service-urls.sh` después del último `sam deploy` | Correrlo — ver paso 2.4 |
| El navegador bloquea las peticiones al API pero `curl` funciona bien | CORS en `template.yaml` no incluye el dominio real del frontend | Agregar la URL de Vercel a `CorsConfiguration.AllowOrigins` y redesplegar |
| Una notificación o liberación de recursos "best effort" nunca llega | Una llamada a otro servicio sin `await` — en un servidor persistente igual corre en segundo plano, pero Lambda congela el proceso apenas se devuelve la respuesta HTTP | Todas las llamadas entre servicios deben llevar `await`, incluso las "best effort" (ver `emergency.controller.ts`) |
