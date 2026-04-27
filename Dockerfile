# Questions aNd Answers (QNA) - Dockerfile

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN mkdir -p /app/dist && \
    cp -r *.html css js Quiz.md /app/dist/ && \
    chmod -R a+rX /app/dist

FROM nginx:1.25-alpine

LABEL maintainer="Cesar Andres Arcila B."
LABEL description="OnMind-QNA: Quiz Application based on Markdown - Questions aNd Answers"
LABEL version="1.0.0"

RUN apk add --no-cache curl

COPY --from=builder /app/dist /usr/share/nginx/html

VOLUME /usr/share/nginx/html

RUN chmod -R a+rX /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /var/log/quiz-app

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/log/quiz-app

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]