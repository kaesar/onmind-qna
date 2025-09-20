# Questions aNd Answers (QNA)

Aplicación web de quiz interactivo que utiliza archivos Markdown como base de datos de contenido.

## Descripción

Esta aplicación permite crear quizzes interactivos a partir del archivo `Quiz.md`, extrayendo preguntas y respuestas automáticamente y presentando un quiz aleatorio al usuario.

## Características

- Interfaz web responsiva
- Extracción automática de preguntas desde Markdown
- Selección aleatoria de preguntas
- Número configurable de preguntas (10 por defecto)
- Puntuación y resultados detallados
- Soporte para respuestas múltiples

## Estructura del Proyecto

```
quiz-markdown/
├── index.html              # Página principal
├── css/
│   └── styles.css          # Estilos de la aplicación
├── js/
│   ├── app.js              # Punto de entrada principal
│   ├── markdown-parser.js  # Parser de Markdown
│   ├── quiz-engine.js      # Motor del quiz
│   ├── ui-controller.js    # Controlador de UI
│   └── file-handler.js     # Manejador de archivos
├── Quiz.md                 # Archivo de datos
└── README.md               # Este archivo
```

## Cómo Iniciar el Servicio

Para evitar problemas de **CORS** al cargar archivos evita abrir directamente el archivo `index.html`, es recomendable usar un servidor web local. He aquí unas alternativas para exponer la página web como un servicio local...

### Python (si tienes Python instalado)

Es usual que en equipos con **macOS** cuentes con **Python** instalado (incluso algunos **Linux**).

```bash
python3 -m http.server 8000
```

> Para versión de **Python 2.7** usa: `python -m SimpleHTTPServer 8000`

### Bun (si No tienes Python instalado)

Una buena alternativa consiste en instalar **Bun** (desde la línea de comandos o terminal) y luego un modulo que hace las veces de servidor web (basado en entorno **Javascript**).

```bash
# Instalar Bun
curl -fsSL https://bun.com/install | bash  # for macOS, Linux, and WSL
powershell -c "irm bun.sh/install.ps1|iex" # for Windows

# Instalar servidor global
bun install -g http-server

# Ejecutar servidor
bunx http-server -p 8000
```

### PHP (si tienes PHP instalado):

```bash
php -S localhost:8000
```

Luego abre un navegador y usa la dirección: `http://localhost:8000`

## Uso de la Aplicación

1. **Configurar**: Selecciona el número de preguntas deseado (1-50)
2. **Iniciar**: Haz clic en "Iniciar Quiz"
3. **Responder**: Selecciona una opción para cada pregunta
4. **Navegar**: Usa "Siguiente Pregunta" para avanzar
5. **Resultados**: Revisa tu puntuación y respuestas detalladas
6. **Repetir**: Inicia un nuevo quiz con preguntas diferentes

## Testing y Desarrollo

### Ejecutar Pruebas

El proyecto incluye herramientas completas de testing:

#### Suite de Pruebas Principal
```bash
# Abrir el runner de pruebas
open test-runner.html
# o navegar a http://localhost:8000/test-runner.html
```

#### Pruebas de Integración
```bash
# Abrir pruebas de integración completas
open integration-test.html
# o navegar a http://localhost:8000/integration-test.html
```

### Herramientas de Desarrollo

- **Performance Monitor**: Monitoreo en tiempo real de rendimiento
- **Responsive Tester**: Pruebas automáticas de responsividad
- **Error Handling**: Manejo robusto de errores y casos edge
- **Test Data**: Archivos de prueba en `test-data/`

### Estructura de Testing
```
test-data/
├── test-questions.md       # Preguntas de prueba
├── malformed-questions.md  # Casos edge y errores
test-runner.html           # Suite de pruebas automatizadas
integration-test.html      # Pruebas de integración E2E
```

## Desarrollo

Este proyecto está implementado en **JavaScript** vanilla sin dependencias externas. Utiliza las siguientes tecnologías:

- **Frontend**: HTML5 semántico, CSS3 con diseño responsivo
- **JavaScript**: ES6+ con módulos nativos
- **APIs**: File API para lectura de archivos locales
- **Parsing**: Expresiones regulares optimizadas
- **Testing**: Suite completa de pruebas automatizadas
- **Performance**: Monitoreo y optimización en tiempo real

### Arquitectura

- `app.js` - Orquestador principal y manejo de eventos
- `markdown-parser.js` - Extracción y validación de preguntas
- `quiz-engine.js` - Lógica del quiz y puntuación
- `ui-controller.js` - Gestión de interfaz y navegación
- `file-handler.js` - Carga y validación de archivos
- `performance-monitor.js` - Monitoreo de rendimiento
- `responsive-tester.js` - Testing de responsividad

## Requisitos

### Mínimos
- Navegador web moderno con soporte para ES6+
- Archivo `Quiz.md` en el directorio raíz

### Recomendados
- Servidor web local para evitar restricciones CORS
- Resolución mínima: 375px (móvil)
- JavaScript habilitado

### Navegadores Soportados
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📱 Características Responsive

- **Móvil**: ≤ 768px - Interfaz optimizada para touch
- **Tablet**: 769px - 1024px - Diseño híbrido
- **Desktop**: > 1024px - Experiencia completa

## Solución de Problemas

### Error: "No se puede cargar el archivo"
- Usa un servidor local en lugar de abrir el archivo directamente
- Verifica que `Quiz.md` existe en el directorio raíz

### Error: "No se encontraron preguntas"
- Revisa el formato del archivo Markdown
- Asegúrate de que las preguntas siguen el formato esperado:
  ```markdown
  ## Pregunta XXX
  
  Contenido de la pregunta
  
  A. Opción A
  B. Opción B
  
  <as-button message="A"></as-button>
  ```

### Problemas de Rendimiento
- Abre `integration-test.html` para diagnóstico
- Revisa la consola del navegador para warnings
- Considera reducir el número de preguntas para archivos muy grandes
