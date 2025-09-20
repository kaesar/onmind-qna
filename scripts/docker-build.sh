#!/bin/bash

# Script para construir y gestionar el contenedor Questions aNd Answers (QNA)
# Uso: ./scripts/docker-build.sh [comando]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
IMAGE_NAME="quiz-markdown"
CONTAINER_NAME="quiz-markdown-app"
PORT="8080"

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}Questions aNd Answers (QNA) - Docker Management Script${NC}"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  build     - Construir la imagen Docker"
    echo "  run       - Ejecutar el contenedor"
    echo "  stop      - Detener el contenedor"
    echo "  restart   - Reiniciar el contenedor"
    echo "  logs      - Mostrar logs del contenedor"
    echo "  shell     - Acceder al shell del contenedor"
    echo "  clean     - Limpiar imágenes y contenedores"
    echo "  dev       - Ejecutar en modo desarrollo"
    echo "  test      - Ejecutar pruebas en contenedor"
    echo "  help      - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 build && $0 run"
    echo "  $0 dev"
    echo "  $0 logs -f"
}

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Verificar si Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker no está instalado. Por favor instala Docker primero."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker no está ejecutándose. Por favor inicia Docker."
        exit 1
    fi
}

# Construir imagen
build_image() {
    log "Construyendo imagen Docker para Questions aNd Answers (QNA)..."
    
    # Verificar que los archivos necesarios existen
    if [[ ! -f "Dockerfile" ]]; then
        error "Dockerfile no encontrado en el directorio actual"
        exit 1
    fi
    
    if [[ ! -f "Quiz.md" ]]; then
        warning "Archivo Quiz.md no encontrado. La aplicación puede no funcionar correctamente."
    fi
    
    # Construir imagen
    docker build -t ${IMAGE_NAME}:latest . \
        --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        --build-arg VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    
    log "Imagen construida exitosamente: ${IMAGE_NAME}:latest"
}

# Ejecutar contenedor
run_container() {
    log "Ejecutando contenedor Questions aNd Answers (QNA)..."
    
    # Detener contenedor existente si está ejecutándose
    if docker ps -q -f name=${CONTAINER_NAME} | grep -q .; then
        warning "Deteniendo contenedor existente..."
        docker stop ${CONTAINER_NAME}
        docker rm ${CONTAINER_NAME}
    fi
    
    # Crear directorio de logs si no existe
    mkdir -p logs
    
    # Ejecutar contenedor
    docker run -d \
        --name ${CONTAINER_NAME} \
        -p ${PORT}:80 \
        -v $(pwd)/logs:/var/log/quiz-app \
        -v $(pwd)/Quiz.md:/usr/share/nginx/html/Quiz.md:ro \
        --restart unless-stopped \
        ${IMAGE_NAME}:latest
    
    log "Contenedor ejecutándose en http://localhost:${PORT}"
    log "Logs disponibles en: ./logs/"
}

# Detener contenedor
stop_container() {
    log "Deteniendo contenedor..."
    if docker ps -q -f name=${CONTAINER_NAME} | grep -q .; then
        docker stop ${CONTAINER_NAME}
        docker rm ${CONTAINER_NAME}
        log "Contenedor detenido"
    else
        warning "No hay contenedor ejecutándose"
    fi
}

# Reiniciar contenedor
restart_container() {
    log "Reiniciando contenedor..."
    stop_container
    run_container
}

# Mostrar logs
show_logs() {
    if docker ps -q -f name=${CONTAINER_NAME} | grep -q .; then
        docker logs ${CONTAINER_NAME} "$@"
    else
        error "Contenedor no está ejecutándose"
        exit 1
    fi
}

# Acceder al shell
access_shell() {
    if docker ps -q -f name=${CONTAINER_NAME} | grep -q .; then
        docker exec -it ${CONTAINER_NAME} /bin/sh
    else
        error "Contenedor no está ejecutándose"
        exit 1
    fi
}

# Limpiar imágenes y contenedores
clean_docker() {
    log "Limpiando contenedores e imágenes..."
    
    # Detener y remover contenedor
    if docker ps -aq -f name=${CONTAINER_NAME} | grep -q .; then
        docker stop ${CONTAINER_NAME} 2>/dev/null || true
        docker rm ${CONTAINER_NAME} 2>/dev/null || true
    fi
    
    # Remover imagen
    if docker images -q ${IMAGE_NAME} | grep -q .; then
        docker rmi ${IMAGE_NAME}:latest 2>/dev/null || true
    fi
    
    # Limpiar imágenes huérfanas
    docker image prune -f
    
    log "Limpieza completada"
}

# Modo desarrollo
dev_mode() {
    log "Iniciando modo desarrollo..."
    
    # Usar docker-compose para desarrollo
    if command -v docker-compose &> /dev/null; then
        docker-compose --profile dev up -d quiz-dev
        log "Servidor de desarrollo ejecutándose en http://localhost:3000"
        log "Los archivos se recargan automáticamente"
    else
        warning "docker-compose no disponible, usando contenedor simple..."
        
        # Ejecutar con volúmenes para desarrollo
        docker run -d \
            --name ${CONTAINER_NAME}-dev \
            -p 3000:80 \
            -v $(pwd):/usr/share/nginx/html:ro \
            -v $(pwd)/nginx-dev.conf:/etc/nginx/nginx.conf:ro \
            nginx:1.25-alpine
        
        log "Servidor de desarrollo ejecutándose en http://localhost:3000"
    fi
}

# Ejecutar pruebas
run_tests() {
    log "Ejecutando pruebas en contenedor..."
    
    # Construir imagen si no existe
    if ! docker images -q ${IMAGE_NAME} | grep -q .; then
        build_image
    fi
    
    # Ejecutar contenedor temporal para pruebas
    docker run --rm \
        -v $(pwd)/test-data:/usr/share/nginx/html/test-data:ro \
        ${IMAGE_NAME}:latest \
        /bin/sh -c "
            # Verificar que los archivos están presentes
            ls -la /usr/share/nginx/html/
            
            # Verificar que nginx está configurado correctamente
            nginx -t
            
            # Verificar que los archivos de prueba están disponibles
            test -f /usr/share/nginx/html/test-runner.html && echo 'Test runner: OK' || echo 'Test runner: MISSING'
            test -f /usr/share/nginx/html/integration-test.html && echo 'Integration tests: OK' || echo 'Integration tests: MISSING'
            test -f /usr/share/nginx/html/Quiz.md && echo 'Quiz data: OK' || echo 'Quiz data: MISSING'
        "
    
    log "Pruebas completadas"
}

# Función principal
main() {
    check_docker
    
    case "${1:-help}" in
        build)
            build_image
            ;;
        run)
            run_container
            ;;
        stop)
            stop_container
            ;;
        restart)
            restart_container
            ;;
        logs)
            shift
            show_logs "$@"
            ;;
        shell)
            access_shell
            ;;
        clean)
            clean_docker
            ;;
        dev)
            dev_mode
            ;;
        test)
            run_tests
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Comando desconocido: $1"
            show_help
            exit 1
            ;;
    esac
}

# Ejecutar función principal con todos los argumentos
main "$@"