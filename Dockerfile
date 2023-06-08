FROM node:18

RUN mkdir -p /home/service

# Exponer en el puerto 8080
EXPOSE 8080

# Variable de entorno para la conexion con la BD
ENV MONGO_URI=

WORKDIR /home/service

# Copiar el contenido a la carpeta
COPY . /home/service

CMD ["node", "index.js"]