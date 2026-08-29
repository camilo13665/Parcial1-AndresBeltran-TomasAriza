# syntax=docker/dockerfile:1
# Build desde la raíz del monorepo:
#   docker build -f backend/services/dispatch/Dockerfile -t dispatch .

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/tsconfig.json backend/tsconfig.json
COPY backend/services/dispatch/package.json backend/services/dispatch/package.json
RUN npm ci --workspace=dispatch
COPY backend/services/dispatch/tsconfig.json backend/services/dispatch/tsconfig.json
COPY backend/services/dispatch/src backend/services/dispatch/src
RUN npm run build --workspace=dispatch

FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/services/dispatch/package.json backend/services/dispatch/package.json
RUN npm ci --workspace=dispatch --omit=dev

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
# Extensión de Lambda: reenvía invocaciones de la Runtime API a este mismo
# Fastify por HTTP local. Fuera de Lambda (docker run/compose) es inerte —
# el mismo Dockerfile sirve para local y para el contenedor de Lambda.
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app/backend/services/dispatch
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/backend/services/dispatch/dist ./dist
COPY backend/services/dispatch/package.json ./package.json
USER app
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://localhost:3002/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
