FROM node:18

# Exponer en el puerto 8080
EXPOSE 8080

# Variable de entorno para la conexion con la BD
ENV MONG_URI=

WORKDIR /home/service

# Copiar el contenido a la carpeta
COPY . /home/service

RUN mkdir -p /home/service

CMD ["node", "/home/service/index.js"]