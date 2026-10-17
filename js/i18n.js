/**
 * i18n - Spanish/English UI labels for OnMind-QNA
 * Questions and options always come from the Markdown source and are NOT translated.
 */
const I18N_STRINGS = {
    es: {
        appSubtitle: 'Trivia/Quiz interactivo basado en contenido Markdown',
        configTitle: 'Configuración del Quiz',
        configDesc: 'Personaliza tu experiencia de quiz antes de comenzar.',
        catalogLabel: 'Catálogo:',
        catalogHelp: 'Elige del catálogo (quizzes.json)',
        fileLabel: 'Archivo de preguntas:',
        fileHelp: 'Ruta local, URL o URL S3 (también vía ?quiz=) del Markdown con las preguntas',
        countLabel: 'Número de preguntas:',
        countHelp: 'Selecciona entre 1 y {n} preguntas',
        savedMsg: 'Configuración guardada ✓',
        fileStatusLabel: 'Estado del archivo:',
        loadingDefault: 'Cargando archivo...',
        loadBtn: 'Cargar Preguntas',
        startBtn: 'Iniciar Quiz',
        skippedBtn: 'Ver omitidas',
        skippedBtnCount: 'Ver omitidas ({n})',
        skippedTitle: 'Preguntas descartadas',
        skippedDesc: 'Detalle de preguntas omitidas por errores de formato o validación.',
        backBtn: 'Volver',
        noSkippedDetail: 'No hay detalle de descartadas para esta carga.',
        skippedItemValidation: 'Pregunta {n} omitida por validación fallida',
        skippedItemExtraction: 'Pregunta {n} omitida por error de extracción',
        nextBtn: 'Siguiente Pregunta',
        resultsBtn: 'Ver Resultados',
        selectFirst: 'Por favor selecciona una respuesta antes de continuar.',
        questionN: 'Pregunta {n}',
        progressOf: '{a} de {b}',
        resultsTitle: '¡Quiz Completado!',
        resultsDetails: 'Detalle de Respuestas',
        newQuizBtn: 'Nuevo Quiz',
        configBtn: 'Configuración',
        reviewBtn: 'Repasar',
        reviewBtnCount: 'Repasar ({n})',
        scoreOf: '{c} de {t} respuestas correctas',
        yourAnswer: 'Tu respuesta:',
        correctAnswer: 'Respuesta correcta:',
        notAnswered: 'No respondida',
        questionsAvailable: '{n} preguntas disponibles',
        fileLoaded: 'Archivo cargado correctamente',
        fileLoadedSkipped: ' ({n} preguntas omitidas por errores de formato)',
        adjustedCount: 'Solo hay {a} preguntas disponibles, se ajustó de {r}',
        qNotFound: 'No se encontró la pregunta "{c}" en el archivo cargado.',
        noFailed: 'Sin falladas para repasar.',
        noSkipped: 'No hay preguntas descartadas en la última carga.',
        enc90: '¡Excelente! Dominas el tema perfectamente.',
        enc80: '¡Muy bien! Tienes un buen conocimiento del tema.',
        enc70: 'Buen trabajo. Con un poco más de estudio serás un experto.',
        enc60: 'No está mal. Revisa los temas que fallaste y vuelve a intentarlo.',
        encLow: 'Sigue practicando. Cada intento te acerca más al éxito.',
        errTitle: 'Error en la aplicación',
        closeBtn: 'Cerrar',
        techDetails: 'Ver detalles técnicos',
        errUnexpected: 'Ha ocurrido un error inesperado.',
        errNotFound: 'No se pudo encontrar el archivo de preguntas.',
        errFormat: 'El archivo de preguntas tiene un formato incorrecto.',
        errNetwork: 'Problema de conexión al cargar el archivo.',
        errEngine: 'Error en el sistema de preguntas del quiz.',
        sugPrefix: 'Sugerencias:',
        sugNotFound: ['Verifica que el archivo existe en la carpeta del proyecto', 'Asegúrate de que el nombre del archivo es correcto', 'Recarga la página para intentar nuevamente'],
        sugFormat: ['Verifica que el archivo contiene preguntas en el formato esperado', 'Asegúrate de que cada pregunta tiene opciones A, B, C, D', 'Revisa que las respuestas están correctamente marcadas'],
        sugNetwork: ['Verifica tu conexión a internet', 'Recarga la página para intentar nuevamente', 'Si el problema persiste, contacta al administrador'],
        sugEngine: ['Intenta reiniciar el quiz', 'Verifica que hay preguntas válidas disponibles', 'Recarga la página si el problema persiste'],
        loadErrNotFound: 'No se encontró el archivo "{f}". Asegúrate de que el archivo existe en la carpeta del proyecto.',
        loadErrFormat: 'El archivo "{f}" no contiene preguntas en el formato esperado. Verifica el formato del contenido.',
        loadErrNetwork: 'Error de conexión al cargar el archivo. Verifica tu conexión a internet.',
        loadErrParsing: 'Error al procesar el contenido de "{f}". Algunos elementos pueden tener formato incorrecto.',
        loadErrValidation: 'Se encontraron problemas de formato en "{f}". Revisa la estructura del archivo.',
        loadErrGeneric: 'No se pudo cargar "{f}": {m}',
        errNewQuiz: 'Error al iniciar nuevo quiz: {m}',
        errReview: 'Error al repasar falladas: {m}',
        errAnswer: 'Error al procesar la respuesta: {m}',
        errShowQ: 'Error al mostrar la pregunta: {m}',
        errShowR: 'Error al mostrar los resultados: {m}',
        errSkipped: 'Error al mostrar descartadas: {m}',
        sysErrUnexpected: 'Ha ocurrido un error inesperado en la aplicación.',
        sysErrConn: 'Error de conexión. Verifica tu conexión a internet.',
        sysErrParse: 'Error procesando datos. El archivo puede tener formato incorrecto.',
        sysErrPerm: 'Error de permisos. Verifica que tienes acceso al archivo.',
        opErrAsync: 'Error en operación asíncrona.',
        opErrFile: 'No se pudo cargar un archivo necesario.',
        opErrTimeout: 'La operación tardó demasiado tiempo. Intenta nuevamente.',
        opErrConn: 'Error de conexión durante la operación.'
    },
    en: {
        appSubtitle: 'Interactive trivia/quiz based on Markdown content',
        configTitle: 'Quiz Setup',
        configDesc: 'Customize your quiz experience before starting.',
        catalogLabel: 'Catalog:',
        catalogHelp: 'Choose from the catalog (quizzes.json)',
        fileLabel: 'Question file:',
        fileHelp: 'Local path, URL or S3 URL (also via ?quiz=) of the Markdown with questions',
        countLabel: 'Number of questions:',
        countHelp: 'Select between 1 and {n} questions',
        savedMsg: 'Configuration saved ✓',
        fileStatusLabel: 'File status:',
        loadingDefault: 'Loading file...',
        loadBtn: 'Load Questions',
        startBtn: 'Start Quiz',
        skippedBtn: 'View skipped',
        skippedBtnCount: 'View skipped ({n})',
        skippedTitle: 'Skipped questions',
        skippedDesc: 'Detail of questions skipped due to format or validation errors.',
        backBtn: 'Back',
        noSkippedDetail: 'No skipped detail for this load.',
        skippedItemValidation: 'Question {n} skipped due to failed validation',
        skippedItemExtraction: 'Question {n} skipped due to extraction error',
        nextBtn: 'Next Question',
        resultsBtn: 'View Results',
        selectFirst: 'Please select an answer before continuing.',
        questionN: 'Question {n}',
        progressOf: '{a} of {b}',
        resultsTitle: 'Quiz Completed!',
        resultsDetails: 'Answer Details',
        newQuizBtn: 'New Quiz',
        configBtn: 'Settings',
        reviewBtn: 'Review',
        reviewBtnCount: 'Review ({n})',
        scoreOf: '{c} of {t} correct answers',
        yourAnswer: 'Your answer:',
        correctAnswer: 'Correct answer:',
        notAnswered: 'Not answered',
        questionsAvailable: '{n} questions available',
        fileLoaded: 'File loaded successfully',
        fileLoadedSkipped: ' ({n} questions skipped due to format errors)',
        adjustedCount: 'Only {a} questions available, adjusted from {r}',
        qNotFound: 'Question "{c}" was not found in the loaded file.',
        noFailed: 'No failed questions to review.',
        noSkipped: 'No skipped questions in the last load.',
        enc90: 'Excellent! You master the topic perfectly.',
        enc80: 'Very good! You have solid knowledge of the topic.',
        enc70: 'Good job. With a bit more study you will be an expert.',
        enc60: 'Not bad. Review the topics you missed and try again.',
        encLow: 'Keep practicing. Every attempt brings you closer to success.',
        errTitle: 'Application error',
        closeBtn: 'Close',
        techDetails: 'View technical details',
        errUnexpected: 'An unexpected error occurred.',
        errNotFound: 'The question file could not be found.',
        errFormat: 'The question file has an incorrect format.',
        errNetwork: 'Connection problem while loading the file.',
        errEngine: 'Error in the quiz question system.',
        sugPrefix: 'Suggestions:',
        sugNotFound: ['Verify the file exists in the project folder', 'Make sure the file name is correct', 'Reload the page to try again'],
        sugFormat: ['Verify the file contains questions in the expected format', 'Make sure each question has A, B, C, D options', 'Check that answers are correctly marked'],
        sugNetwork: ['Check your internet connection', 'Reload the page to try again', 'If the problem persists, contact the administrator'],
        sugEngine: ['Try restarting the quiz', 'Verify that valid questions are available', 'Reload the page if the problem persists'],
        loadErrNotFound: 'File "{f}" not found. Make sure the file exists in the project folder.',
        loadErrFormat: 'File "{f}" has no questions in the expected format. Check the content format.',
        loadErrNetwork: 'Connection error while loading the file. Check your internet connection.',
        loadErrParsing: 'Error processing the content of "{f}". Some items may be misformatted.',
        loadErrValidation: 'Format problems found in "{f}". Review the file structure.',
        loadErrGeneric: 'Could not load "{f}": {m}',
        errNewQuiz: 'Error starting new quiz: {m}',
        errReview: 'Error reviewing failed questions: {m}',
        errAnswer: 'Error processing the answer: {m}',
        errShowQ: 'Error displaying the question: {m}',
        errShowR: 'Error displaying the results: {m}',
        errSkipped: 'Error displaying skipped questions: {m}',
        sysErrUnexpected: 'An unexpected error occurred in the application.',
        sysErrConn: 'Connection error. Check your internet connection.',
        sysErrParse: 'Error processing data. The file may be misformatted.',
        sysErrPerm: 'Permission error. Verify you have access to the file.',
        opErrAsync: 'Error in async operation.',
        opErrFile: 'A required file could not be loaded.',
        opErrTimeout: 'The operation took too long. Try again.',
        opErrConn: 'Connection error during the operation.'
    }
};

let __qnaLang = 'es';

function getLanguage() {
    try {
        const saved = localStorage.getItem('quiz-lang');
        if (saved === 'en' || saved === 'es') __qnaLang = saved;
    } catch (e) { /* storage unavailable */ }
    return __qnaLang;
}

function setLanguage(lang) {
    __qnaLang = (lang === 'en') ? 'en' : 'es';
    try {
        localStorage.setItem('quiz-lang', __qnaLang);
    } catch (e) { /* storage unavailable */ }
    return __qnaLang;
}

function t(key, vars) {
    const dict = I18N_STRINGS[__qnaLang] || I18N_STRINGS.es;
    let s = (key in dict) ? dict[key] : (I18N_STRINGS.es[key] ?? key);
    if (vars && typeof s === 'string') {
        for (const k of Object.keys(vars)) {
            s = s.replace('{' + k + '}', vars[k]);
        }
    }
    return s;
}

function tList(key) {
    const dict = I18N_STRINGS[__qnaLang] || I18N_STRINGS.es;
    const v = (key in dict) ? dict[key] : I18N_STRINGS.es[key];
    return Array.isArray(v) ? [...v] : [];
}

function translateStatic(root) {
    const base = root || document;
    base.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.getAttribute('data-i18n'));
    });
}

// Parser reason messages are always logged in Spanish: map them for English UI
const PARSER_REASON_PATTERNS = [
    [/^No se pudo extraer el número de pregunta del bloque$/, 'Could not extract the question number from the block'],
    [/^No se pudo extraer el contenido de la pregunta$/, 'Could not extract the question content'],
    [/^No se pudieron extraer las opciones de respuesta$/, 'Could not extract the answer options'],
    [/^No se pudieron extraer las respuestas correctas$/, 'Could not extract the correct answers'],
    [/^Datos de pregunta nulos o indefinidos$/, 'Null or undefined question data'],
    [/^ID de pregunta faltante o inválido$/, 'Missing or invalid question ID'],
    [/^Título de pregunta faltante o inválido$/, 'Missing or invalid question title'],
    [/^Contenido de pregunta faltante o inválido$/, 'Missing or invalid question content'],
    [/^Opciones de pregunta faltantes o inválidas$/, 'Missing or invalid question options'],
    [/^Respuestas correctas faltantes o inválidas$/, 'Missing or invalid correct answers'],
    [/^Contenido muy corto \((\d+) caracteres, mínimo (\d+)\)$/, 'Content too short ($1 chars, minimum $2)'],
    [/^Contenido muy largo \((\d+) caracteres, máximo (\d+)\)$/, 'Content too long ($1 chars, maximum $2)'],
    [/^Contenido de pregunta vacío después de limpiar espacios$/, 'Question content empty after trimming whitespace'],
    [/^Muy pocas opciones \((\d+), mínimo (\d+)\)$/, 'Too few options ($1, minimum $2)'],
    [/^Demasiadas opciones \((\d+), máximo (\d+)\)$/, 'Too many options ($1, maximum $2)'],
    [/^Opción requerida faltante: ([A-Z])$/, 'Missing required option: $1'],
    [/^Letra de opción inválida: (.+)$/, 'Invalid option letter: $1'],
    [/^Texto de opción ([A-Z]) faltante o inválido$/, 'Option $1 text missing or invalid'],
    [/^Texto de opción ([A-Z]) vacío$/, 'Option $1 text empty'],
    [/^Texto de opción ([A-Z]) muy largo \((\d+) caracteres, máximo (\d+)\)$/, 'Option $1 text too long ($2 chars, maximum $3)'],
    [/^No hay respuestas correctas definidas$/, 'No correct answers defined'],
    [/^Respuesta correcta inválida: (.+)$/, 'Invalid correct answer: $1'],
    [/^Respuestas correctas duplicadas encontradas$/, 'Duplicate correct answers found'],
    [/^Respuesta correcta (.+) no existe en las opciones disponibles$/, 'Correct answer $1 not found in the available options']
];

function translateParserReason(msg) {
    if (getLanguage() !== 'en' || typeof msg !== 'string') return msg;
    for (const [re, en] of PARSER_REASON_PATTERNS) {
        if (re.test(msg)) return msg.replace(re, en);
    }
    return msg;
}
