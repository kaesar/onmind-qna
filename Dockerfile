# Questions aNd Answers (QNA) - Dockerfile
# Imagen optimizada para servir aplicación web estática con nginx

# Etapa 1: Construcción (opcional para futuras optimizaciones)
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de la aplicación
COPY . .

# Crear directorio de distribución
RUN mkdir -p /app/dist && \
    cp -r *.html css js test-data test-runner.html integration-test.html Quiz.md /app/dist/

# Etapa 2: Producción con nginx
FROM nginx:1.25-alpine

# Metadatos del contenedor
LABEL maintainer="Questions aNd Answers (QNA) Team"
LABEL description="Aplicación de quiz interactivo basada en archivos Markdown"
LABEL version="1.0.0"

# Instalar herramientas adicionales para debugging (opcional)
RUN apk add --no-cache curl

# Copiar archivos de la aplicación desde el builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Crear directorio para logs personalizados
RUN mkdir -p /var/log/quiz-app

# Configurar permisos
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/log/quiz-app

# Exponer puerto 80
EXPOSE 80

# Health check para verificar que la aplicación está funcionando
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]