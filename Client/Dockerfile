# Etapa 1: construir el frontend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: servir con Astro preview
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/astro.config.mjs ./
EXPOSE 4321
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
