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
COPY --from=builder /app ./
EXPOSE 4321
CMD ["npm", "run", "dev"]
