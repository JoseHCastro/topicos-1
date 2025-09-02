# Multi-stage build para imagen más pequeña
FROM node:18.19-alpine AS builder

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar dependencias (incluyendo devDependencies para el build)
RUN npm ci --only=production --silent && \
    npm ci --only=development --silent

# Copiar código fuente
COPY src/ ./src/
COPY public/ ./public/
COPY seed.ts ./

# Compilar la aplicación
RUN npm run build

# NO limpiar dependencias de desarrollo para mantener ts-node para seeders
# RUN npm prune --production

# Imagen final optimizada
FROM node:18.19-alpine AS production

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Instalar dumb-init para manejo correcto de señales
RUN apk add --no-cache dumb-init

# Copiar solo lo necesario desde el builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/public ./public
COPY --from=builder --chown=nestjs:nodejs /app/seed.ts ./
COPY --from=builder --chown=nestjs:nodejs /app/tsconfig*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/nest-cli.json ./

# Cambiar al usuario no-root
USER nestjs

# Configurar variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Exponer puerto
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Usar dumb-init para manejo correcto de señales
ENTRYPOINT ["dumb-init", "--"]

# Comando de arranque
CMD ["node", "dist/src/main.js"]
