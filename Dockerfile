# 1. Cambiamos a la versión 20 exigida por NestJS 11
FROM node:20-alpine

# 2. Creamos la carpeta de trabajo dentro del contenedor
WORKDIR /usr/src/app

# 3. Copiamos los archivos de dependencias
COPY package*.json ./

# 4. Instalamos las dependencias del proyecto
RUN npm install

# 5. Copiamos todo el código fuente del proyecto al contenedor
COPY . .

# 6. Construimos la aplicación de NestJS
RUN npm run build

# 7. Exponemos el puerto que usa NestJS
EXPOSE 3000

# 8. Comando para arrancar en modo desarrollo
CMD ["npm", "run", "start:dev"]