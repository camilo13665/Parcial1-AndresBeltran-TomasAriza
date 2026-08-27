# Frontend — Gestión de Emergencias

Next.js (App Router) + TypeScript + Tailwind CSS.

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura

```text
app/            Páginas (/, /reportar, /emergencia/[id], /dashboard)
components/     ui/, emergency/, dashboard/, map/
services/api/   Cliente HTTP centralizado hacia los 4 microservicios
types/          Entidades y enums del dominio
hooks/          useServiceHealth — sondeo en vivo de los microservicios
lib/            Constantes de dominio y datos mock
```

Ver el README en la raíz del monorepo para instrucciones completas de
instalación y ejecución del stack completo (frontend + backend).
