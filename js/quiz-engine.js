// QuizEngine - Motor del quiz para manejar la lógica del juego

class QuizEngine {
    constructor(questions, numberOfQuestions = 10) {
        this.allQuestions = questions || [];
        this.numberOfQuestions = Math.min(numberOfQuestions, this.allQuestions.length);
        this.selectedQuestions = [];
        this.currentIndex = 0;
        this.userAnswers = [];
        this.startTime = null;
        this.endTime = null;
        this.isCompleted = false;
        
        // Error tracking
        this.engineErrors = [];
        this.validationWarnings = [];
        this.enableDetailedLogging = true;
        
        // Validation rules
        this.validationRules = {
            minQuestions: 1,
            maxQuestions: 100,
            maxAnswerLength: 10
        };
        
        this.log('info', 'Inicializando QuizEngine', {
            totalQuestions: this.allQuestions.length,
            requestedQuestions: numberOfQuestions,
            finalQuestions: this.numberOfQuestions
        });
        
        // Validar que tengamos preguntas disponibles
        this.validateInitialQuestions();
        
        // Seleccionar preguntas aleatorias al inicializar
        this.selectRandomQuestions();
    }

    selectRandomQuestions() {
        // Crear una copia del array de preguntas para no modificar el original
        const availableQuestions = [...this.allQuestions];
        this.selectedQuestions = [];
        
        // Seleccionar preguntas aleatorias sin repetición
        for (let i = 0; i < this.numberOfQuestions && availableQuestions.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableQuestions.length);
            const selectedQuestion = availableQuestions.splice(randomIndex, 1)[0];
            this.selectedQuestions.push(selectedQuestion);
        }
        
        // Inicializar array de respuestas del usuario
        this.userAnswers = new Array(this.selectedQuestions.length).fill(null);
        
        console.log(`Seleccionadas ${this.selectedQuestions.length} preguntas aleatorias para el quiz`);
    }

    getCurrentQuestion() {
        if (this.currentIndex >= this.selectedQuestions.length) {
            return null;
        }
        
        return {
            question: this.selectedQuestions[this.currentIndex],
            questionNumber: this.currentIndex + 1,
            totalQuestions: this.selectedQuestions.length,
            isLast: this.currentIndex === this.selectedQuestions.length - 1
        };
    }

    nextQuestion() {
        if (this.currentIndex < this.selectedQuestions.length - 1) {
            this.currentIndex++;
            return this.getCurrentQuestion();
        }
        
        // Si es la última pregunta, marcar como completado
        if (this.currentIndex === this.selectedQuestions.length - 1) {
            this.isCompleted = true;
            this.endTime = new Date();
        }
        
        return null;
    }

    previousQuestion() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return this.getCurrentQuestion();
        }
        return null;
    }

    submitAnswer(selectedAnswer) {
        const submissionContext = {
            questionIndex: this.currentIndex,
            selectedAnswer,
            timestamp: new Date().toISOString()
        };
        
        this.log('debug', 'Procesando respuesta del usuario', submissionContext);
        
        try {
            // Validate quiz state
            this.validateQuizState();
            
            // Validate current question index
            if (this.currentIndex >= this.selectedQuestions.length) {
                throw new Error(`Índice de pregunta fuera de rango: ${this.currentIndex}/${this.selectedQuestions.length}`);
            }
            
            // Inicializar tiempo de inicio si es la primera respuesta
            if (this.startTime === null) {
                this.startTime = new Date();
                this.log('info', 'Quiz iniciado - primera respuesta recibida');
            }
            
            // Validate answer format
            this.validateAnswerFormat(selectedAnswer);
            
            // Validar que la respuesta sea válida para la pregunta actual
            const currentQuestion = this.selectedQuestions[this.currentIndex];
            this.validateAnswerForQuestion(selectedAnswer, currentQuestion);
            
            // Guardar la respuesta del usuario
            this.userAnswers[this.currentIndex] = selectedAnswer;
            
            const isCorrect = this.isAnswerCorrect(this.currentIndex, selectedAnswer);
            
            this.log('info', `Respuesta procesada para pregunta ${this.currentIndex + 1}`, {
                answer: selectedAnswer,
                isCorrect,
                questionId: currentQuestion.id
            });
            
            return {
                questionIndex: this.currentIndex,
                answer: selectedAnswer,
                isCorrect: isCorrect,
                questionId: currentQuestion.id,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            this.log('error', `Error procesando respuesta: ${error.message}`, {
                ...submissionContext,
                error: error.stack
            });
            throw error;
        }
    }

    isAnswerCorrect(questionIndex, userAnswer) {
        if (questionIndex >= this.selectedQuestions.length) {
            return false;
        }
        
        const question = this.selectedQuestions[questionIndex];
        
        // Handle multiple selection answers (e.g., "AB", "ACD")
        if (userAnswer.length > 1) {
            const userAnswerArray = userAnswer.split('').sort();
            const correctAnswerArray = question.correctAnswers.sort();
            
            // Check if arrays are equal
            return userAnswerArray.length === correctAnswerArray.length &&
                   userAnswerArray.every((answer, index) => answer === correctAnswerArray[index]);
        }
        
        // Handle single selection
        return question.correctAnswers.includes(userAnswer);
    }

    calculateScore() {
        let correctCount = 0;
        
        for (let i = 0; i < this.selectedQuestions.length; i++) {
            const userAnswer = this.userAnswers[i];
            if (userAnswer && this.isAnswerCorrect(i, userAnswer)) {
                correctCount++;
            }
        }
        
        const score = Math.round((correctCount / this.selectedQuestions.length) * 100);
        
        return {
            score: score,
            correctCount: correctCount,
            totalQuestions: this.selectedQuestions.length,
            percentage: score
        };
    }

    getResults() {
        if (!this.isCompleted) {
            throw new Error('El quiz no ha sido completado aún');
        }
        
        const scoreData = this.calculateScore();
        const details = [];
        
        // Generar detalles por pregunta
        for (let i = 0; i < this.selectedQuestions.length; i++) {
            const question = this.selectedQuestions[i];
            const userAnswer = this.userAnswers[i];
            const isCorrect = userAnswer ? this.isAnswerCorrect(i, userAnswer) : false;
            
            // Handle multiple selection answer text
            let userAnswerText = 'Sin respuesta';
            if (userAnswer) {
                if (userAnswer.length > 1) {
                    // Multiple selection - combine all selected option texts
                    userAnswerText = userAnswer.split('').map(letter => 
                        `${letter}. ${question.options[letter]}`
                    ).join(', ');
                } else {
                    // Single selection
                    userAnswerText = `${userAnswer}. ${question.options[userAnswer]}`;
                }
            }
            
            details.push({
                questionNumber: i + 1,
                question: question,
                userAnswer: userAnswer,
                correctAnswers: question.correctAnswers,
                isCorrect: isCorrect,
                userAnswerText: userAnswerText,
                correctAnswerTexts: question.correctAnswers.map(ans => question.options[ans])
            });
        }
        
        // Calcular duración
        const duration = this.endTime && this.startTime ? 
            Math.round((this.endTime - this.startTime) / 1000) : 0;
        
        return {
            score: scoreData.score,
            correctCount: scoreData.correctCount,
            totalQuestions: scoreData.totalQuestions,
            percentage: scoreData.percentage,
            details: details,
            duration: duration,
            startTime: this.startTime,
            endTime: this.endTime
        };
    }

    // Método para reiniciar el quiz con las mismas preguntas
    restart() {
        this.currentIndex = 0;
        this.userAnswers = new Array(this.selectedQuestions.length).fill(null);
        this.startTime = null;
        this.endTime = null;
        this.isCompleted = false;
    }

    // Método para iniciar un nuevo quiz con preguntas diferentes
    startNewQuiz(numberOfQuestions = null) {
        if (numberOfQuestions !== null) {
            this.numberOfQuestions = Math.min(numberOfQuestions, this.allQuestions.length);
        }
        
        this.currentIndex = 0;
        this.startTime = null;
        this.endTime = null;
        this.isCompleted = false;
        
        this.selectRandomQuestions();
    }

    // Getters para información del estado actual
    get progress() {
        return {
            current: this.currentIndex + 1,
            total: this.selectedQuestions.length,
            percentage: Math.round(((this.currentIndex + 1) / this.selectedQuestions.length) * 100)
        };
    }

    get isStarted() {
        return this.startTime !== null;
    }

    get questionsRemaining() {
        return this.selectedQuestions.length - this.currentIndex - 1;
    }

    // Método para obtener estadísticas del quiz actual
    getCurrentStats() {
        const answeredCount = this.userAnswers.filter(answer => answer !== null).length;
        let correctSoFar = 0;
        
        for (let i = 0; i <= this.currentIndex; i++) {
            if (this.userAnswers[i] && this.isAnswerCorrect(i, this.userAnswers[i])) {
                correctSoFar++;
            }
        }
        
        return {
            questionsAnswered: answeredCount,
            questionsRemaining: this.selectedQuestions.length - answeredCount,
            correctSoFar: correctSoFar,
            currentAccuracy: answeredCount > 0 ? Math.round((correctSoFar / answeredCount) * 100) : 0
        };
    }

    validateInitialQuestions() {
        if (!this.allQuestions || !Array.isArray(this.allQuestions)) {
            throw new Error('Lista de preguntas inválida: debe ser un array');
        }
        
        if (this.allQuestions.length === 0) {
            throw new Error('No hay preguntas disponibles para el quiz');
        }
        
        // Validate each question structure
        const invalidQuestions = [];
        for (let i = 0; i < this.allQuestions.length; i++) {
            const question = this.allQuestions[i];
            const validationResult = this.validateQuestionStructure(question, i);
            if (!validationResult.isValid) {
                invalidQuestions.push({
                    index: i,
                    questionId: question?.id || 'unknown',
                    errors: validationResult.errors
                });
            }
        }
        
        if (invalidQuestions.length > 0) {
            this.log('warn', `Se encontraron ${invalidQuestions.length} preguntas con problemas de estructura`, {
                invalidQuestions: invalidQuestions.slice(0, 5) // Log first 5 for brevity
            });
            
            // Remove invalid questions
            this.allQuestions = this.allQuestions.filter((_, index) => 
                !invalidQuestions.some(invalid => invalid.index === index)
            );
            
            this.log('info', `Preguntas válidas después de filtrado: ${this.allQuestions.length}`);
            
            if (this.allQuestions.length === 0) {
                throw new Error('No quedan preguntas válidas después de la validación');
            }
        }
    }

    validateQuestionStructure(question, index) {
        const errors = [];
        
        if (!question || typeof question !== 'object') {
            errors.push('Pregunta no es un objeto válido');
            return { isValid: false, errors };
        }
        
        if (!question.id || typeof question.id !== 'string') {
            errors.push('ID de pregunta faltante o inválido');
        }
        
        if (!question.content || typeof question.content !== 'string') {
            errors.push('Contenido de pregunta faltante o inválido');
        }
        
        if (!question.options || typeof question.options !== 'object') {
            errors.push('Opciones de pregunta faltantes o inválidas');
        } else {
            const optionCount = Object.keys(question.options).length;
            if (optionCount < 2) {
                errors.push(`Muy pocas opciones: ${optionCount} (mínimo 2)`);
            }
        }
        
        if (!question.correctAnswers || !Array.isArray(question.correctAnswers)) {
            errors.push('Respuestas correctas faltantes o inválidas');
        } else if (question.correctAnswers.length === 0) {
            errors.push('No hay respuestas correctas definidas');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateQuizState() {
        if (!this.selectedQuestions || this.selectedQuestions.length === 0) {
            throw new Error('Quiz no inicializado: no hay preguntas seleccionadas');
        }
        
        if (this.isCompleted) {
            throw new Error('Quiz ya completado: no se pueden enviar más respuestas');
        }
    }

    validateAnswerFormat(answer) {
        if (!answer || typeof answer !== 'string') {
            throw new Error('Formato de respuesta inválido: debe ser una cadena de texto');
        }
        
        if (answer.length === 0) {
            throw new Error('Respuesta vacía no permitida');
        }
        
        if (answer.length > this.validationRules.maxAnswerLength) {
            throw new Error(`Respuesta muy larga: ${answer.length} caracteres (máximo ${this.validationRules.maxAnswerLength})`);
        }
        
        // Allow single letter (A, B, C) or multiple letters (AB, ACD) for multiple selection
        if (!/^[A-Z]+$/.test(answer)) {
            throw new Error(`Formato de respuesta inválido: "${answer}". Se esperaba una o más letras mayúsculas (A, B, AB, ACD, etc.)`);
        }
    }

    validateAnswerForQuestion(answer, question) {
        if (!question) {
            throw new Error('Pregunta actual no disponible');
        }
        
        if (!question.options) {
            throw new Error('Opciones de pregunta no disponibles');
        }
        
        // For multiple selection, validate each letter individually
        if (answer.length > 1) {
            for (const letter of answer) {
                if (!question.options[letter]) {
                    const availableOptions = Object.keys(question.options).join(', ');
                    throw new Error(`Respuesta "${letter}" no es válida para esta pregunta. Opciones disponibles: ${availableOptions}`);
                }
            }
        } else {
            // Single selection validation
            if (!question.options[answer]) {
                const availableOptions = Object.keys(question.options).join(', ');
                throw new Error(`Respuesta "${answer}" no es válida para esta pregunta. Opciones disponibles: ${availableOptions}`);
            }
        }
    }

    log(level, message, data = null) {
        if (!this.enableDetailedLogging) return;
        
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            component: 'QuizEngine',
            message,
            data
        };
        
        // Console output with appropriate level
        switch (level) {
            case 'error':
                console.error(`[${timestamp}] QuizEngine ERROR: ${message}`, data || '');
                this.engineErrors.push(logEntry);
                break;
            case 'warn':
                console.warn(`[${timestamp}] QuizEngine WARN: ${message}`, data || '');
                this.validationWarnings.push(logEntry);
                break;
            case 'info':
                console.info(`[${timestamp}] QuizEngine INFO: ${message}`, data || '');
                break;
            case 'debug':
                console.debug(`[${timestamp}] QuizEngine DEBUG: ${message}`, data || '');
                break;
            default:
                console.log(`[${timestamp}] QuizEngine: ${message}`, data || '');
        }
    }

    // Public methods for error tracking
    getEngineErrors() {
        return [...this.engineErrors];
    }

    getValidationWarnings() {
        return [...this.validationWarnings];
    }

    getEngineStats() {
        return {
            totalQuestions: this.allQuestions.length,
            selectedQuestions: this.selectedQuestions.length,
            currentIndex: this.currentIndex,
            answersProvided: this.userAnswers.filter(a => a !== null).length,
            isCompleted: this.isCompleted,
            errors: this.engineErrors.length,
            warnings: this.validationWarnings.length,
            startTime: this.startTime,
            endTime: this.endTime
        };
    }
}