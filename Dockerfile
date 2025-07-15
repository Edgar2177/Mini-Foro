# Usa una imagen base de nginx ligera
FROM nginx:alpine

# Copia el contenido del build (dist) a la carpeta pública de nginx
COPY dist /usr/share/nginx/html

# Expone el puerto 80 (puerto por defecto de nginx)
EXPOSE 80

# Comando por defecto para mantener nginx corriendo
CMD ["nginx", "-g", "daemon off;"]
