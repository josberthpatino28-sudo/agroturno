FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
# Crea las tablas (si no existen) y luego inicia la API
CMD ["sh", "-c", "node src/db/init.js && node src/server.js"]
