# syntax=docker/dockerfile:1
# Build desde la raíz del monorepo:
#   docker build -f backend/services/intake-triage/Dockerfile -t intake-triage .

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/tsconfig.json backend/tsconfig.json
COPY backend/services/intake-triage/package.json backend/services/intake-triage/package.json
RUN npm ci --workspace=intake-triage
COPY backend/services/intake-triage/tsconfig.json backend/services/intake-triage/tsconfig.json
COPY backend/services/intake-triage/src backend/services/intake-triage/src
RUN npm run build --workspace=intake-triage

FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/services/intake-triage/package.json backend/services/intake-triage/package.json
RUN npm ci --workspace=intake-triage --omit=dev

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
# Extensión de Lambda: reenvía invocaciones de la Runtime API a este mismo
# Fastify por HTTP local. Fuera de Lambda (docker run/compose) es inerte —
# el mismo Dockerfile sirve para local y para el contenedor de Lambda.
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app/backend/services/intake-triage
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/backend/services/intake-triage/dist ./dist
COPY backend/services/intake-triage/package.json ./package.json
USER app
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://localhost:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
