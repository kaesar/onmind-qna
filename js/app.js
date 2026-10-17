/**
 * App.js - Main application entry point
 * Integrates all components and manages the complete quiz flow
 */

class QuizApp {
    constructor() {
        // Initialize components
        this.fileHandler = new FileHandler();
        this.markdownParser = new MarkdownParser();
        this.uiController = new UIController();
        this.quizEngine = null;
        
        // Application state
        this.questions = [];
        this.isInitialized = false;
        
        // Configuration
        this.currentFilePath = 'Quiz.md';
        
        // Bind methods to preserve context
        this.handleStartQuiz = this.handleStartQuiz.bind(this);
        this.handleAnswerSubmitted = this.handleAnswerSubmitted.bind(this);
        this.handleNewQuiz = this.handleNewQuiz.bind(this);
        this.handleReviewFailed = this.handleReviewFailed.bind(this);
        this.handleViewSkipped = this.handleViewSkipped.bind(this);
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('Inicializando aplicación Questions aNd Answers (QNA)...');
            
            // Initialize UI
            this.uiController.initialize();
            
            // Set up event listeners
            this.setupEventListeners();

            // Load quiz catalog, apply ?quiz= override, then load questions
            await this.loadQuizCatalog();
            await this.loadQuestions(this.uiController.getQuizFilename());
            // Saved-config reload during file load stomps URL params: re-assert them
            this.applyUrlOverrides();
            // ?question= validates a single question: start it directly
            this.autoStartSpecificQuestion();
            
            this.isInitialized = true;
            console.log('Aplicación inicializada correctamente');
            
        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
            if (this.uiController && !error.userNotified) {
                this.uiController.updateFileStatus('error', 
                    `Error al cargar la aplicación: ${error.message}`);
            }
            // Don't throw the error, let the app continue with manual loading
            this.isInitialized = true; // Mark as initialized even if initial load fails
        }
    }

    /**
     * Set up event listeners for UI interactions
     */
    setupEventListeners() {
        // Listen for custom events from UIController
        document.addEventListener('startQuiz', this.handleStartQuiz);
        document.addEventListener('answerSubmitted', this.handleAnswerSubmitted);
        document.addEventListener('newQuiz', this.handleNewQuiz);
        document.addEventListener('reviewFailed', this.handleReviewFailed);
        document.addEventListener('viewSkipped', this.handleViewSkipped);
        document.addEventListener('loadQuestions', this.handleLoadQuestions.bind(this));
        
        // Handle page visibility changes to save state
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.uiController.saveConfiguration();
            }
        });
        
        // Handle beforeunload to save configuration
        window.addEventListener('beforeunload', () => {
            this.uiController.saveConfiguration();
        });
    }

    /**
     * Load quiz catalog (quizzes.json) and apply ?quiz= URL override
     */
    async loadQuizCatalog() {
        let entries = [{ label: 'Quiz', path: './Quiz.md' }];

        try {
            const response = await fetch('quizzes.json');
            if (response.ok) {
                const catalog = await response.json();
                if (Array.isArray(catalog)) {
                    entries = catalog;
                } else if (catalog && Array.isArray(catalog.quizzes)) {
                    entries = catalog.quizzes;
                }
            }
        } catch (error) {
            console.warn('No se pudo cargar quizzes.json, usando valor por defecto:', error.message);
        }

        this.quizCatalog = entries;

        const quizParam = new URLSearchParams(window.location.search).get('quiz');
        if (quizParam) {
            this.uiController.setQuizFilename(quizParam);
        }
        this.uiController.setQuizCatalog(entries, this.uiController.getQuizFilename());
        this.applyUrlOverrides();

        return entries;
    }

    /**
     * Re-assert ?quiz=, ?questions= and ?question= over the inputs (saved
     * config reloads after file load would otherwise stomp them)
     */
    applyUrlOverrides() {
        const params = new URLSearchParams(window.location.search);
        const quizParam = params.get('quiz');
        if (quizParam) {
            this.uiController.setQuizFilename(quizParam);
        }

        // ?question= validates a single question: the count is forced to 1
        const questionParam = params.get('question');
        if (questionParam && this.uiController.questionCountInput) {
            this.uiController.questionCountInput.value = 1;
            return;
        }

        const questionsParam = parseInt(params.get('questions'), 10);
        if (questionsParam > 0 && this.uiController.questionCountInput) {
            const total = this.uiController.totalQuestionsAvailable || questionsParam;
            this.uiController.questionCountInput.value = Math.min(Math.max(1, questionsParam), total);
        }
    }

    /**
     * Resolve a question by its code/number (e.g. "9", "009", "18")
     */
    resolveQuestionByCode(code) {
        const raw = String(code == null ? '' : code).trim();
        if (!raw) return null;

        const digits = raw.replace(/\D/g, '');
        const padded = digits ? digits.padStart(3, '0') : '';

        return this.questions.find(q => q.id === raw)
            || (padded ? this.questions.find(q => q.id === padded) : null)
            || null;
    }

    /**
     * Auto-start a single-question quiz from ?question= (if present and resolvable)
     */
    autoStartSpecificQuestion() {
        const questionParam = new URLSearchParams(window.location.search).get('question');
        if (!questionParam) return;

        const question = this.resolveQuestionByCode(questionParam);
        if (!question) {
            this.uiController.showUserFriendlyError(
                t('qNotFound', { c: questionParam }), 'validando pregunta específica');
            return;
        }

        console.log(`Iniciando validación de la pregunta ${question.id}`);
        this.quizEngine = new QuizEngine([question], 1);
        this.displayCurrentQuestion();
    }

    /**
     * Load and parse questions from markdown file
     */
    async loadQuestions(filePath = null) {
        // Use provided filePath or current configured path
        const targetFilePath = filePath || this.currentFilePath;
        
        const loadingContext = {
            filePath: targetFilePath,
            timestamp: new Date().toISOString(),
            attempt: 1
        };
        
        try {
            console.log(`Cargando archivo: ${targetFilePath}`);
            
            // Load markdown content using FileHandler
            const markdownContent = await this.fileHandler.loadMarkdownFile(targetFilePath);
            
            // Update current file path on successful load
            this.currentFilePath = targetFilePath;
            
            // Parse questions using MarkdownParser
            console.log('Contenido del archivo cargado:', markdownContent.length, 'caracteres');
            
            this.questions = this.markdownParser.parseQuestions(markdownContent);
            
            console.log('Preguntas parseadas:', this.questions.length);
            if (this.questions.length > 0) {
                console.log('Primera pregunta:', this.questions[0]);
            }
            
            if (this.questions.length === 0) {
                throw new Error('No se encontraron preguntas válidas en el archivo después del parsing');
            }
            
            // Get parsing statistics for user feedback
            const parsingStats = this.markdownParser.getParsingStats();
            const fileStats = this.fileHandler.getLoadingStats();
            
            console.log('Estadísticas de parsing:', parsingStats);
            console.log('Estadísticas de archivo:', fileStats);
            
            // Create success message with details
            let successMessage = t('fileLoaded');
            if (parsingStats && parsingStats.skippedQuestions > 0) {
                successMessage += t('fileLoadedSkipped', { n: parsingStats.skippedQuestions });
                console.warn('Preguntas omitidas:', parsingStats.skippedQuestions, 'razones:', parsingStats.errors || 'No disponible');
            }
            
            // Update UI with success status
            this.uiController.updateFileStatus('success', successMessage, this.questions.length);

            // Save skipped log for the detail screen
            this.lastSkippedLogs = this.markdownParser.getDetailedLogs();
            this.lastSkippedCount = parsingStats.skippedQuestions || 0;
            this.uiController.setSkippedLog(this.lastSkippedLogs, this.lastSkippedCount);
            
            // Log detailed results
            console.log(`Cargadas ${this.questions.length} preguntas exitosamente`, {
                parsingStats,
                fileStats,
                loadingContext
            });
            
            // Show warnings if any
            if (fileStats.warnings > 0 || parsingStats.parsingWarnings > 0) {
                console.warn('Se encontraron advertencias durante la carga:', {
                    fileWarnings: this.fileHandler.getValidationWarnings(),
                    parsingWarnings: this.markdownParser.getDetailedLogs().warnings
                });
            }
            
        } catch (error) {
            console.error('Error al cargar preguntas:', error, loadingContext);

            // No silent fallback to another file: report the failure for the requested file
            const userFriendlyMessage = this.createUserFriendlyErrorMessage(error);

            // Update UI with error status
            this.uiController.updateFileStatus('error', userFriendlyMessage);

            // Show detailed error to user
            this.uiController.showUserFriendlyError(error.message, 'cargando archivo de preguntas');

            // Mark as already reported so callers don't overwrite the descriptive message
            error.userNotified = true;
            throw error;
        }
    }

    createUserFriendlyErrorMessage(error) {
        const message = error.message || 'Error desconocido';
        const filePath = error.filePath || this.currentFilePath;

        if (message.includes('File not found') || message.includes('404') || message.includes('Archivo no encontrado')) {
            return t('loadErrNotFound', { f: filePath });
        } else if (message.includes('Invalid markdown content') || message.includes('No questions found')
            || message.includes('Formato inválido') || message.includes('No se encontraron preguntas')) {
            return t('loadErrFormat', { f: filePath });
        } else if (message.includes('Network') || message.includes('fetch failed')
            || message.includes('Error de red') || message.includes('Error de conexión')) {
            return t('loadErrNetwork');
        } else if (message.includes('parsing') || message.includes('extract') || message.includes('procesar')) {
            return t('loadErrParsing', { f: filePath });
        } else if (message.includes('validation') || message.includes('validación')) {
            return t('loadErrValidation', { f: filePath });
        } else {
            return t('loadErrGeneric', { f: filePath, m: message });
        }
    }

    /**
     * Handle load questions event from UI
     */
    async handleLoadQuestions(event) {
        const { filename } = event.detail;
        
        try {
            console.log(`Cargando archivo: ${filename}`);
            
            // Update file status to loading
            this.uiController.updateFileStatus('loading', `Cargando archivo ${filename}...`);
            
            // Load questions from specified file
            await this.loadQuestions(filename);
            
        } catch (error) {
            console.error('Error al cargar archivo:', error);
            if (!error.userNotified) {
                this.uiController.updateFileStatus('error', `Error: ${error.message}`);
            }
        }
    }

    /**
     * Handle start quiz event from UI
     */
    handleStartQuiz(event) {
        const startContext = {
            requestedQuestions: event.detail?.questionCount,
            filename: event.detail?.filename,
            availableQuestions: this.questions?.length,
            timestamp: new Date().toISOString()
        };
        
        try {
            const { questionCount, filename } = event.detail;
            
            // Update filename if provided and different from current
            if (filename && filename !== this.currentFilePath) {
                console.log(`Actualizando archivo de ${this.currentFilePath} a ${filename}`);
                this.loadQuestions(filename).catch(err => console.error('Error loading file:', err));
            }
            
            console.log(`Iniciando quiz con ${questionCount} preguntas`, startContext);
            
            // Comprehensive validation before starting
            this.validateQuizStartConditions(questionCount);
            
            // Validate question count and adjust if necessary
            const actualQuestionCount = Math.min(questionCount, this.questions.length);
            if (actualQuestionCount !== questionCount) {
                console.warn(`Ajustando número de preguntas de ${questionCount} a ${actualQuestionCount}`);
                
                // Inform user about adjustment
                if (actualQuestionCount < questionCount) {
                    this.uiController.showUserFriendlyError(
                        t('adjustedCount', { a: actualQuestionCount, r: questionCount }),
                        'iniciando quiz'
                    );
                }
            }
            
            // Create new quiz engine instance with error handling
            try {
                this.quizEngine = new QuizEngine(this.questions, actualQuestionCount);
            } catch (engineError) {
                console.error('Error creando QuizEngine:', engineError);
                throw new Error(`Error al configurar el quiz: ${engineError.message}`);
            }
            
            // Save configuration
            try {
                this.uiController.saveConfiguration();
            } catch (saveError) {
                console.warn('Error guardando configuración:', saveError);
                // Non-critical error, continue with quiz
            }
            
            // Display first question
            this.displayCurrentQuestion();
            
            console.log('Quiz iniciado exitosamente', {
                ...startContext,
                actualQuestions: actualQuestionCount,
                quizEngineStats: this.quizEngine.getEngineStats()
            });
            
        } catch (error) {
            console.error('Error al iniciar quiz:', error, startContext);
            
            // Provide specific error handling based on error type
            if (error.message.includes('No hay preguntas')) {
                this.uiController.showUserFriendlyError(
                    'No se pueden iniciar el quiz porque no hay preguntas válidas disponibles',
                    'iniciando quiz'
                );
                
                // Try to reload questions
                this.attemptQuestionReload();
            } else if (error.message.includes('Quiz engine')) {
                this.uiController.showUserFriendlyError(
                    'Error en el sistema de quiz. Intenta recargar la página',
                    'configurando quiz'
                );
            } else {
                this.uiController.showUserFriendlyError(error.message, 'iniciando quiz');
            }
        }
    }

    validateQuizStartConditions(questionCount) {
        if (!this.isInitialized) {
            throw new Error('La aplicación no está completamente inicializada');
        }
        
        if (!this.questions || !Array.isArray(this.questions)) {
            throw new Error('No hay preguntas disponibles para el quiz');
        }
        
        if (this.questions.length === 0) {
            throw new Error('La lista de preguntas está vacía');
        }
        
        if (!questionCount || typeof questionCount !== 'number' || questionCount < 1) {
            throw new Error('Número de preguntas inválido');
        }
        
        if (questionCount > 100) {
            throw new Error('Número de preguntas demasiado alto (máximo 100)');
        }
    }

    async attemptQuestionReload() {
        try {
            console.log('Intentando recargar preguntas automáticamente...');
            await this.loadQuestions();
            
            if (this.questions.length > 0) {
                console.log('Preguntas recargadas exitosamente');
            }
        } catch (reloadError) {
            console.error('Error en recarga automática:', reloadError);
        }
    }

    /**
     * Handle answer submission from UI
     */
    handleAnswerSubmitted(event) {
        try {
            const { answer } = event.detail;
            
            if (!this.quizEngine) {
                throw new Error('Quiz engine no está inicializado');
            }
            
            console.log(`Respuesta enviada: ${answer}`);
            
            // Submit answer to quiz engine
            const result = this.quizEngine.submitAnswer(answer);
            console.log(`Respuesta ${result.isCorrect ? 'correcta' : 'incorrecta'} para pregunta ${result.questionIndex + 1}`);
            
            // Move to next question or show results
            const nextQuestion = this.quizEngine.nextQuestion();
            
            if (nextQuestion) {
                // Display next question
                this.displayCurrentQuestion();
            } else {
                // Quiz completed, show results
                this.displayResults();
            }
            
        } catch (error) {
            console.error('Error al procesar respuesta:', error);
            this.uiController.showError(t('errAnswer', { m: error.message }));
        }
    }

    /**
     * Handle new quiz request from UI
     */
    handleNewQuiz(event) {
        try {
            console.log('Iniciando nuevo quiz');

            // Always rebuild from the full pool (this.questions):
            // after a Review, quizEngine.allQuestions stays narrowed to the failed ones.
            if (this.questions && this.questions.length > 0) {
                const count = this.uiController
                    ? this.uiController.getQuestionCount()
                    : this.questions.length;
                this.quizEngine = new QuizEngine(this.questions, count);
                this.displayCurrentQuestion();
            } else if (this.quizEngine) {
                this.quizEngine.startNewQuiz();
                this.displayCurrentQuestion();
            } else {
                // Return to configuration screen
                this.uiController.showConfiguration();
            }

        } catch (error) {
            console.error('Error al iniciar nuevo quiz:', error);
            this.uiController.showError(t('errNewQuiz', { m: error.message }));
        }
    }

    handleReviewFailed() {
        try {
            if (!this.quizEngine) throw new Error('Quiz engine no está inicializado');

            const failedQuestions = this.quizEngine.selectedQuestions.filter(
                (_, i) => {
                    const ans = this.quizEngine.userAnswers[i];
                    return !ans || !this.quizEngine.isAnswerCorrect(i, ans);
                }
            );

            if (failedQuestions.length === 0) {
                this.uiController.showError(t('noFailed'));
                return;
            }

            console.log(`Repasando ${failedQuestions.length} falladas`);
            this.quizEngine = new QuizEngine(failedQuestions, failedQuestions.length);
            this.displayCurrentQuestion();
        } catch (error) {
            console.error('Error al repasar falladas:', error);
            this.uiController.showError(t('errReview', { m: error.message }));
        }
    }

    handleViewSkipped() {
        try {
            if (!this.lastSkippedLogs || (this.lastSkippedCount || 0) === 0) {
                this.uiController.showError(t('noSkipped'));
                return;
            }
            this.uiController.displaySkipped(this.lastSkippedLogs);
        } catch (error) {
            console.error('Error al mostrar descartadas:', error);
            this.uiController.showError(t('errSkipped', { m: error.message }));
        }
    }

    /**
     * Display current question using UI controller
     */
    displayCurrentQuestion() {
        try {
            if (!this.quizEngine) {
                throw new Error('Quiz engine no está inicializado');
            }
            
            const questionData = this.quizEngine.getCurrentQuestion();
            
            if (!questionData) {
                throw new Error('No hay pregunta actual disponible');
            }
            
            // Display question through UI controller
            this.uiController.displayQuestion(questionData);
            
            // Log progress
            const progress = this.quizEngine.progress;
            console.log(`Mostrando pregunta ${progress.current} de ${progress.total} (${progress.percentage}%)`);
            
        } catch (error) {
            console.error('Error al mostrar pregunta:', error);
            this.uiController.showError(t('errShowQ', { m: error.message }));
        }
    }

    /**
     * Display quiz results using UI controller
     */
    displayResults() {
        try {
            if (!this.quizEngine) {
                throw new Error('Quiz engine no está inicializado');
            }
            
            // Get results from quiz engine
            const results = this.quizEngine.getResults();
            
            // Display results through UI controller
            this.uiController.displayResults(results);
            
            // Log final results
            console.log(`Quiz completado: ${results.score}% (${results.correctCount}/${results.totalQuestions})`);
            console.log(`Duración: ${results.duration} segundos`);
            
        } catch (error) {
            console.error('Error al mostrar resultados:', error);
            this.uiController.showError(t('errShowR', { m: error.message }));
        }
    }

    /**
     * Get application status for debugging
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            currentFilePath: this.currentFilePath,
            questionsLoaded: this.questions.length,
            quizActive: !!this.quizEngine,
            currentScreen: this.uiController.currentScreen
        };
    }

    /**
     * Reload questions from file (for development/debugging)
     */
    async reloadQuestions(filePath = null) {
        try {
            console.log('Recargando preguntas...');
            await this.loadQuestions(filePath);
            
            // Reset quiz engine if active
            if (this.quizEngine) {
                this.quizEngine = null;
                this.uiController.showConfiguration();
            }
            
        } catch (error) {
            console.error('Error al recargar preguntas:', error);
            throw error;
        }
    }
}

// Global application instance
let quizApp;

/**
 * Initialize application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('DOM cargado, inicializando aplicación...');
        
        // Create and initialize application
        quizApp = new QuizApp();
        await quizApp.initialize();
        
        // Make app available globally for debugging
        window.quizApp = quizApp;
        
    } catch (error) {
        console.error('Error crítico al inicializar la aplicación:', error);
        
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #e74c3c;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            z-index: 9999;
        `;
        errorDiv.innerHTML = `
            <h3>Error al cargar la aplicación</h3>
            <p>${error.message}</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #e74c3c;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
            ">Recargar página</button>
        `;
        document.body.appendChild(errorDiv);
    }
});

/**
 * Handle errors that might occur during runtime
 */
window.addEventListener('error', (event) => {
    const errorInfo = {
        message: event.error?.message || 'Error desconocido',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
    };
    
    console.error('Error no manejado:', errorInfo);
    
    if (quizApp && quizApp.uiController) {
        // Provide user-friendly error message
        let userMessage = t('sysErrUnexpected');
        
        if (errorInfo.message.includes('fetch') || errorInfo.message.includes('network')) {
            userMessage = t('sysErrConn');
        } else if (errorInfo.message.includes('parse') || errorInfo.message.includes('JSON')) {
            userMessage = t('sysErrParse');
        } else if (errorInfo.message.includes('permission') || errorInfo.message.includes('access')) {
            userMessage = t('sysErrPerm');
        }
        
        quizApp.uiController.showUserFriendlyError(userMessage, 'error del sistema');
    }
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    const rejectionInfo = {
        reason: event.reason,
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
    };
    
    console.error('Promise rechazada no manejada:', rejectionInfo);
    
    if (quizApp && quizApp.uiController) {
        // Provide user-friendly error message for promise rejections
        let userMessage = t('opErrAsync');
        
        if (rejectionInfo.message.includes('File not found') || rejectionInfo.message.includes('404')) {
            userMessage = t('opErrFile');
        } else if (rejectionInfo.message.includes('timeout')) {
            userMessage = t('opErrTimeout');
        } else if (rejectionInfo.message.includes('network') || rejectionInfo.message.includes('fetch')) {
            userMessage = t('opErrConn');
        }
        
        quizApp.uiController.showUserFriendlyError(userMessage, 'operación asíncrona');
    }
    
    // Prevent default browser behavior
    event.preventDefault();
});