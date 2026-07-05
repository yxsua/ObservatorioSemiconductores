# -----------------------------
# Stage 1
# Instalación de dependencias
# -----------------------------
FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm install

# -----------------------------
# Stage 2
# Aplicación
# -----------------------------
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

EXPOSE 3001

CMD ["npm", "start"]