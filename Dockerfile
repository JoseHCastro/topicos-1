# Stage 1: build
FROM node:18-alpine AS build
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias y Nest CLI
RUN npm install && npm install -g @nestjs/cli

# Copiar código
COPY . .

# Compilar NestJS
RUN nest build

# Stage 2: producción
FROM node:18-alpine
WORKDIR /app

# Copiar solo dist y package.json de la etapa build
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Instalar solo dependencias de producción
RUN npm install --production

# Exponer puerto
EXPOSE 3000

# Comando de arranque
CMD ["node", "dist/src/main.js"]
