# Imagen base de Node.js 20 LTS (Alpine para menor tamaño)
FROM node:20-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Generar cliente de Prisma
RUN npx prisma generate

# El puerto se define vía variable de entorno en docker-compose
# EXPOSE es informativo

# Comando por defecto (desarrollo con hot reload)
# En producción se puede cambiar a: npm run build && npm start
CMD ["npm", "run", "dev"]
