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
            
            // Load and process markdown file with UI filename
            await this.loadQuestions(this.uiController.getQuizFilename());
            
            this.isInitialized = true;
            console.log('Aplicación inicializada correctamente');
            
        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
            if (this.uiController) {
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
            this.questions = this.markdownParser.parseQuestions(markdownContent);
            
            if (this.questions.length === 0) {
                throw new Error('No se encontraron preguntas válidas en el archivo después del parsing');
            }
            
            // Get parsing statistics for user feedback
            const parsingStats = this.markdownParser.getParsingStats();
            const fileStats = this.fileHandler.getLoadingStats();
            
            // Create success message with details
            let successMessage = 'Archivo cargado correctamente';
            if (parsingStats.skippedQuestions > 0) {
                successMessage += ` (${parsingStats.skippedQuestions} preguntas omitidas por errores de formato)`;
            }
            
            // Update UI with success status
            this.uiController.updateFileStatus('success', successMessage, this.questions.length);
            
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
            
            // Attempt graceful recovery
            const recoveryResult = await this.attemptErrorRecovery(error);
            
            if (recoveryResult.recovered) {
                console.log('Recuperación exitosa:', recoveryResult);
                this.questions = recoveryResult.questions;
                this.uiController.updateFileStatus('success', 
                    `Archivo cargado con recuperación de errores (${recoveryResult.questions.length} preguntas válidas)`, 
                    recoveryResult.questions.length);
                return;
            }
            
            // Create user-friendly error message
            const userFriendlyMessage = this.createUserFriendlyErrorMessage(error);
            
            // Update UI with error status
            this.uiController.updateFileStatus('error', userFriendlyMessage);
            
            // Show detailed error to user
            this.uiController.showUserFriendlyError(error.message, 'cargando archivo de preguntas');
            
            throw error;
        }
    }

    async attemptErrorRecovery(originalError) {
        console.log('Intentando recuperación de errores...');
        
        try {
            // Try alternative file paths
            const alternativePaths = [
                './Quiz.md',
                '../Quiz.md',
                'data/Quiz.md',
                'assets/Quiz.md'
            ];
            
            for (const altPath of alternativePaths) {
                if (altPath === this.currentFilePath) continue;
                
                try {
                    console.log(`Intentando ruta alternativa: ${altPath}`);
                    const content = await this.fileHandler.loadMarkdownFile(altPath);
                    const questions = this.markdownParser.parseQuestions(content);
                    
                    if (questions.length > 0) {
                        console.log(`Recuperación exitosa con ${altPath}: ${questions.length} preguntas`);
                        return {
                            recovered: true,
                            questions,
                            recoveryMethod: 'alternative_path',
                            recoveryPath: altPath
                        };
                    }
                } catch (altError) {
                    console.debug(`Ruta alternativa ${altPath} falló:`, altError.message);
                }
            }
            
            // Try with relaxed validation if original error was validation-related
            if (originalError.message.includes('validation') || originalError.message.includes('Invalid')) {
                try {
                    console.log('Intentando carga con validación relajada...');
                    
                    // Temporarily disable strict validation
                    const originalValidation = this.markdownParser.enableDetailedLogging;
                    this.markdownParser.enableDetailedLogging = false;
                    
                    const content = await this.fileHandler.loadMarkdownFile(this.currentFilePath);
                    const questions = this.markdownParser.parseQuestions(content);
                    
                    // Restore original validation setting
                    this.markdownParser.enableDetailedLogging = originalValidation;
                    
                    if (questions.length > 0) {
                        console.log(`Recuperación con validación relajada: ${questions.length} preguntas`);
                        return {
                            recovered: true,
                            questions,
                            recoveryMethod: 'relaxed_validation'
                        };
                    }
                } catch (relaxedError) {
                    console.debug('Recuperación con validación relajada falló:', relaxedError.message);
                }
            }
            
        } catch (recoveryError) {
            console.error('Error durante intento de recuperación:', recoveryError);
        }
        
        return { recovered: false };
    }

    createUserFriendlyErrorMessage(error) {
        const message = error.message || 'Error desconocido';
        
        if (message.includes('File not found') || message.includes('404')) {
            return `No se encontró el archivo "${this.currentFilePath}". Asegúrate de que el archivo existe en la carpeta del proyecto.`;
        } else if (message.includes('Invalid markdown content') || message.includes('No questions found')) {
            return 'El archivo no contiene preguntas en el formato esperado. Verifica el formato del contenido.';
        } else if (message.includes('Network') || message.includes('fetch failed')) {
            return 'Error de conexión al cargar el archivo. Verifica tu conexión a internet.';
        } else if (message.includes('parsing') || message.includes('extract')) {
            return 'Error al procesar el contenido del archivo. Algunos elementos pueden tener formato incorrecto.';
        } else if (message.includes('validation')) {
            return 'Se encontraron problemas de formato en algunas preguntas. Revisa la estructura del archivo.';
        } else {
            return `Error al cargar el archivo: ${message}`;
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
            this.uiController.updateFileStatus('error', `Error: ${error.message}`);
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
                        `Solo hay ${actualQuestionCount} preguntas disponibles, se ajustó de ${questionCount}`,
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
            this.uiController.showError(`Error al procesar la respuesta: ${error.message}`);
        }
    }

    /**
     * Handle new quiz request from UI
     */
    handleNewQuiz(event) {
        try {
            console.log('Iniciando nuevo quiz');
            
            // Reset quiz engine if it exists
            if (this.quizEngine) {
                this.quizEngine.startNewQuiz();
                this.displayCurrentQuestion();
            } else {
                // Return to configuration screen
                this.uiController.showConfiguration();
            }
            
        } catch (error) {
            console.error('Error al iniciar nuevo quiz:', error);
            this.uiController.showError(`Error al iniciar nuevo quiz: ${error.message}`);
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
            this.uiController.showError(`Error al mostrar la pregunta: ${error.message}`);
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
            this.uiController.showError(`Error al mostrar los resultados: ${error.message}`);
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
        let userMessage = 'Ha ocurrido un error inesperado en la aplicación.';
        
        if (errorInfo.message.includes('fetch') || errorInfo.message.includes('network')) {
            userMessage = 'Error de conexión. Verifica tu conexión a internet.';
        } else if (errorInfo.message.includes('parse') || errorInfo.message.includes('JSON')) {
            userMessage = 'Error procesando datos. El archivo puede tener formato incorrecto.';
        } else if (errorInfo.message.includes('permission') || errorInfo.message.includes('access')) {
            userMessage = 'Error de permisos. Verifica que tienes acceso al archivo.';
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
        let userMessage = 'Error en operación asíncrona.';
        
        if (rejectionInfo.message.includes('File not found') || rejectionInfo.message.includes('404')) {
            userMessage = 'No se pudo cargar un archivo necesario.';
        } else if (rejectionInfo.message.includes('timeout')) {
            userMessage = 'La operación tardó demasiado tiempo. Intenta nuevamente.';
        } else if (rejectionInfo.message.includes('network') || rejectionInfo.message.includes('fetch')) {
            userMessage = 'Error de conexión durante la operación.';
        }
        
        quizApp.uiController.showUserFriendlyError(userMessage, 'operación asíncrona');
    }
    
    // Prevent default browser behavior
    event.preventDefault();
});