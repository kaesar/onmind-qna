// MarkdownParser - Parser de contenido Markdown para extraer preguntas de quiz

class MarkdownParser {
    constructor() {
        // Regex para identificar bloques de preguntas usando subtítulos ##
        this.questionBlockRegex = /## Pregunta \d+\n\n([\s\S]*?)(?=## Pregunta|\n---|\n#|$)/g;
        
        // Regex para extraer opciones de respuesta A, B, C, D, E, F, etc. (maneja formatos: A., **A**., **A**, A)
        this.optionRegex = /^(?:\*\*)?([A-Z])(?:\*\*)?\.*\s+(.+)$/gm;
        
        // Regex para extraer respuestas correctas desde elementos <as-button>
        this.correctAnswerRegex = /<as-button[^>]*message="([^"]+)"[^>]*>/;
        
        // Regex adicional para manejar atributo inquire (respuestas múltiples)
        this.inquireAnswerRegex = /<as-button[^>]*inquire="([^"]+)"[^>]*>/;
        
        // Regex para extraer el número de pregunta
        this.questionNumberRegex = /## Pregunta (\d+)/;
        
        // Logging and validation configuration
        this.enableDetailedLogging = true;
        this.validationErrors = [];
        this.parsingWarnings = [];
        this.processedQuestions = 0;
        this.skippedQuestions = 0;
        
        // Validation rules
        this.validationRules = {
            minContentLength: 10,
            maxContentLength: 2000,
            minOptions: 2,
            maxOptions: 8,
            requiredOptionLetters: ['A', 'B'], // Minimum required options
            maxOptionTextLength: 500
        };
    }

    parseQuestions(markdownContent) {
        // Reset parsing state
        this.resetParsingState();
        
        const questions = [];
        let match;
        let questionIndex = 0;
        
        this.log('info', 'Iniciando parsing de preguntas del archivo Markdown');
        this.log('debug', `Contenido del archivo: ${markdownContent.length} caracteres`);
        
        // Validate input content
        if (!this.validateMarkdownContent(markdownContent)) {
            throw new Error('El contenido del archivo Markdown no es válido para el parsing');
        }
        
        // Resetear el índice del regex para múltiples ejecuciones
        this.questionBlockRegex.lastIndex = 0;
        
        while ((match = this.questionBlockRegex.exec(markdownContent)) !== null) {
            questionIndex++;
            const fullBlock = match[0];
            
            this.log('debug', `Procesando bloque de pregunta ${questionIndex}`);
            
            try {
                const questionData = this.extractQuestion(fullBlock, questionIndex);
                
                if (questionData && this.validateQuestion(questionData, questionIndex)) {
                    questions.push(questionData);
                    this.processedQuestions++;
                    this.log('debug', `Pregunta ${questionData.id} procesada exitosamente`);
                } else {
                    this.skippedQuestions++;
                    this.log('warn', `Pregunta ${questionIndex} omitida por validación fallida`, {
                        block: fullBlock.substring(0, 200) + '...',
                        errors: this.getLastValidationErrors()
                    });
                }
            } catch (error) {
                this.skippedQuestions++;
                this.log('error', `Error al procesar pregunta ${questionIndex}: ${error.message}`, {
                    block: fullBlock.substring(0, 200) + '...',
                    error: error.stack
                });
                
                // Continue processing other questions (graceful recovery)
                continue;
            }
        }
        
        // Final validation and logging
        this.logParsingResults(questions.length, questionIndex);
        
        if (questions.length === 0) {
            throw new Error('No se encontraron preguntas válidas en el archivo. Revisa el formato del contenido.');
        }
        
        return questions;
    }

    extractQuestion(questionBlock, questionIndex = 0) {
        const extractionContext = {
            questionIndex,
            blockLength: questionBlock.length,
            timestamp: new Date().toISOString()
        };
        
        try {
            this.log('debug', `Iniciando extracción de pregunta ${questionIndex}`, extractionContext);
            
            // Extraer número de pregunta
            const numberMatch = this.questionNumberRegex.exec(questionBlock);
            if (!numberMatch) {
                throw new Error('No se pudo extraer el número de pregunta del bloque');
            }
            
            const questionNumber = numberMatch[1];
            this.log('debug', `Número de pregunta extraído: ${questionNumber}`);
            
            // Extraer el enunciado (texto entre el título y las opciones)
            const questionContent = this.extractQuestionContent(questionBlock);
            if (!questionContent) {
                throw new Error('No se pudo extraer el contenido de la pregunta');
            }
            
            // Extraer opciones de respuesta
            const options = this.extractAnswers(questionBlock);
            if (!options || Object.keys(options).length === 0) {
                throw new Error('No se pudieron extraer las opciones de respuesta');
            }
            
            // Extraer respuestas correctas
            const correctAnswers = this.extractCorrectAnswer(questionBlock);
            if (!correctAnswers || correctAnswers.length === 0) {
                throw new Error('No se pudieron extraer las respuestas correctas');
            }
            
            const questionData = {
                id: questionNumber.padStart(3, '0'),
                title: `Pregunta ${questionNumber}`,
                content: questionContent,
                options: options,
                correctAnswers: correctAnswers,
                rawBlock: questionBlock,
                extractionMetadata: {
                    ...extractionContext,
                    optionCount: Object.keys(options).length,
                    correctAnswerCount: correctAnswers.length,
                    contentLength: questionContent.length
                }
            };
            
            this.log('debug', `Pregunta ${questionNumber} extraída exitosamente`, {
                optionCount: Object.keys(options).length,
                correctAnswers: correctAnswers.join(','),
                contentLength: questionContent.length
            });
            
            return questionData;
            
        } catch (error) {
            this.log('error', `Error en extracción de pregunta ${questionIndex}: ${error.message}`, {
                ...extractionContext,
                error: error.stack,
                blockPreview: questionBlock.substring(0, 300) + '...'
            });
            throw error;
        }
    }

    extractAnswers(questionBlock) {
        const options = {};
        let match;
        
        // Resetear el índice del regex
        this.optionRegex.lastIndex = 0;
        
        while ((match = this.optionRegex.exec(questionBlock)) !== null) {
            const letter = match[1]; // A, B, C, D
            let optionText = match[2].trim();
            
            // Limpiar el texto de la opción removiendo marcado de negrita
            optionText = this.cleanOptionText(optionText);
            
            options[letter] = optionText;
        }
        
        return options;
    }

    extractCorrectAnswer(questionBlock) {
        const correctAnswers = [];
        
        // Extraer respuesta principal del atributo message
        const messageMatch = this.correctAnswerRegex.exec(questionBlock);
        if (messageMatch) {
            const messageValue = messageMatch[1];
            // Manejar respuestas múltiples en el atributo message (ej: "AB", "AC", "BE")
            for (const char of messageValue) {
                if (/[A-Z]/.test(char)) {
                    correctAnswers.push(char);
                }
            }
        }
        
        // Extraer respuestas adicionales del atributo inquire
        const inquireMatch = this.inquireAnswerRegex.exec(questionBlock);
        if (inquireMatch) {
            const inquireValue = inquireMatch[1];
            // Manejar respuestas múltiples en el atributo inquire
            for (const char of inquireValue) {
                if (/[A-Z]/.test(char) && !correctAnswers.includes(char)) {
                    correctAnswers.push(char);
                }
            }
        }
        
        return correctAnswers;
    }

    cleanOptionText(text) {
        // Remover marcado de negrita (**texto**)
        text = text.replace(/\*\*(.*?)\*\*/g, '$1');
        
        // Remover marcado de cursiva (*texto*)
        text = text.replace(/\*(.*?)\*/g, '$1');
        
        // Limpiar espacios extra
        text = text.trim();
        
        return text;
    }

    extractQuestionContent(questionBlock) {
        try {
            // Dividir por líneas para un análisis más preciso
            const lines = questionBlock.split('\n');
            let questionContent = '';
            
            // Empezar después del título (## Pregunta XXX) y línea vacía
            for (let i = 2; i < lines.length; i++) {
                const line = lines[i];
                
                // Verificar si esta línea es una opción (A, B, C, D, E, etc. al inicio de línea seguido de punto)
                if (/^(?:\*\*)?[A-Z](?:\*\*)?\./.test(line)) {
                    break;
                }
                
                // Parar cuando encontremos el botón de respuesta
                if (line.includes('<as-button')) {
                    break;
                }
                
                // Agregar la línea al contenido de la pregunta
                questionContent += line + '\n';
            }
            
            return questionContent.trim();
        } catch (error) {
            this.log('error', `Error extrayendo contenido de pregunta: ${error.message}`);
            throw error;
        }
    }

    validateQuestion(questionData, questionIndex = 0) {
        this.validationErrors = []; // Reset validation errors for this question
        let isValid = true;
        
        const context = {
            questionId: questionData?.id,
            questionIndex,
            timestamp: new Date().toISOString()
        };
        
        this.log('debug', `Iniciando validación de pregunta ${questionIndex}`, context);
        
        try {
            // Validar estructura básica
            if (!this.validateBasicStructure(questionData)) {
                isValid = false;
            }
            
            // Validar contenido de la pregunta
            if (!this.validateQuestionContent(questionData)) {
                isValid = false;
            }
            
            // Validar opciones de respuesta
            if (!this.validateQuestionOptions(questionData)) {
                isValid = false;
            }
            
            // Validar respuestas correctas
            if (!this.validateCorrectAnswers(questionData)) {
                isValid = false;
            }
            
            // Validar consistencia entre opciones y respuestas
            if (!this.validateAnswerConsistency(questionData)) {
                isValid = false;
            }
            
            if (isValid) {
                this.log('debug', `Pregunta ${questionData.id} validada exitosamente`);
            } else {
                this.log('warn', `Pregunta ${questionIndex} falló validación`, {
                    errors: this.validationErrors,
                    questionData: {
                        id: questionData?.id,
                        contentLength: questionData?.content?.length,
                        optionCount: questionData?.options ? Object.keys(questionData.options).length : 0,
                        correctAnswerCount: questionData?.correctAnswers?.length
                    }
                });
            }
            
            return isValid;
            
        } catch (error) {
            this.log('error', `Error durante validación de pregunta ${questionIndex}: ${error.message}`, {
                ...context,
                error: error.stack
            });
            return false;
        }
    }

    validateBasicStructure(questionData) {
        if (!questionData) {
            this.addValidationError('Datos de pregunta nulos o indefinidos');
            return false;
        }
        
        if (!questionData.id || typeof questionData.id !== 'string') {
            this.addValidationError('ID de pregunta faltante o inválido');
            return false;
        }
        
        if (!questionData.title || typeof questionData.title !== 'string') {
            this.addValidationError('Título de pregunta faltante o inválido');
            return false;
        }
        
        if (!questionData.content || typeof questionData.content !== 'string') {
            this.addValidationError('Contenido de pregunta faltante o inválido');
            return false;
        }
        
        if (!questionData.options || typeof questionData.options !== 'object') {
            this.addValidationError('Opciones de pregunta faltantes o inválidas');
            return false;
        }
        
        if (!questionData.correctAnswers || !Array.isArray(questionData.correctAnswers)) {
            this.addValidationError('Respuestas correctas faltantes o inválidas');
            return false;
        }
        
        return true;
    }

    validateQuestionContent(questionData) {
        const content = questionData.content;
        
        if (content.length < this.validationRules.minContentLength) {
            this.addValidationError(`Contenido muy corto (${content.length} caracteres, mínimo ${this.validationRules.minContentLength})`);
            return false;
        }
        
        if (content.length > this.validationRules.maxContentLength) {
            this.addValidationError(`Contenido muy largo (${content.length} caracteres, máximo ${this.validationRules.maxContentLength})`);
            return false;
        }
        
        // Verificar que el contenido no esté vacío después de limpiar espacios
        if (content.trim().length === 0) {
            this.addValidationError('Contenido de pregunta vacío después de limpiar espacios');
            return false;
        }
        
        return true;
    }

    validateQuestionOptions(questionData) {
        const options = questionData.options;
        const optionKeys = Object.keys(options);
        
        if (optionKeys.length < this.validationRules.minOptions) {
            this.addValidationError(`Muy pocas opciones (${optionKeys.length}, mínimo ${this.validationRules.minOptions})`);
            return false;
        }
        
        if (optionKeys.length > this.validationRules.maxOptions) {
            this.addValidationError(`Demasiadas opciones (${optionKeys.length}, máximo ${this.validationRules.maxOptions})`);
            return false;
        }
        
        // Verificar que las opciones requeridas estén presentes
        for (const requiredOption of this.validationRules.requiredOptionLetters) {
            if (!options[requiredOption]) {
                this.addValidationError(`Opción requerida faltante: ${requiredOption}`);
                return false;
            }
        }
        
        // Validar cada opción individualmente
        for (const [letter, text] of Object.entries(options)) {
            if (!this.validateSingleOption(letter, text)) {
                return false;
            }
        }
        
        return true;
    }

    validateSingleOption(letter, text) {
        if (!/^[A-Z]$/.test(letter)) {
            this.addValidationError(`Letra de opción inválida: ${letter}`);
            return false;
        }
        
        if (!text || typeof text !== 'string') {
            this.addValidationError(`Texto de opción ${letter} faltante o inválido`);
            return false;
        }
        
        if (text.trim().length === 0) {
            this.addValidationError(`Texto de opción ${letter} vacío`);
            return false;
        }
        
        if (text.length > this.validationRules.maxOptionTextLength) {
            this.addValidationError(`Texto de opción ${letter} muy largo (${text.length} caracteres, máximo ${this.validationRules.maxOptionTextLength})`);
            return false;
        }
        
        return true;
    }

    validateCorrectAnswers(questionData) {
        const correctAnswers = questionData.correctAnswers;
        
        if (correctAnswers.length === 0) {
            this.addValidationError('No hay respuestas correctas definidas');
            return false;
        }
        
        // Verificar que todas las respuestas correctas sean letras válidas
        for (const answer of correctAnswers) {
            if (!/^[A-Z]$/.test(answer)) {
                this.addValidationError(`Respuesta correcta inválida: ${answer}`);
                return false;
            }
        }
        
        // Verificar que no haya respuestas duplicadas
        const uniqueAnswers = [...new Set(correctAnswers)];
        if (uniqueAnswers.length !== correctAnswers.length) {
            this.addValidationError('Respuestas correctas duplicadas encontradas');
            return false;
        }
        
        return true;
    }

    validateAnswerConsistency(questionData) {
        const { options, correctAnswers } = questionData;
        
        // Verificar que todas las respuestas correctas existan en las opciones
        for (const answer of correctAnswers) {
            if (!options[answer]) {
                this.addValidationError(`Respuesta correcta ${answer} no existe en las opciones disponibles`);
                return false;
            }
        }
        
        return true;
    }

    validateMarkdownContent(content) {
        if (!content || typeof content !== 'string') {
            this.log('error', 'Contenido Markdown nulo o no es string');
            return false;
        }
        
        if (content.trim().length === 0) {
            this.log('error', 'Contenido Markdown vacío');
            return false;
        }
        
        // Verificar que contenga al menos una pregunta
        if (!this.questionBlockRegex.test(content)) {
            this.log('error', 'No se encontraron bloques de preguntas en el formato esperado');
            return false;
        }
        
        return true;
    }

    addValidationError(message) {
        this.validationErrors.push({
            message,
            timestamp: new Date().toISOString()
        });
    }

    getLastValidationErrors() {
        return [...this.validationErrors];
    }

    resetParsingState() {
        this.validationErrors = [];
        this.parsingWarnings = [];
        this.processedQuestions = 0;
        this.skippedQuestions = 0;
    }

    logParsingResults(validQuestions, totalBlocks) {
        const successRate = totalBlocks > 0 ? ((validQuestions / totalBlocks) * 100).toFixed(1) : 0;
        
        this.log('info', 'Parsing completado', {
            validQuestions,
            totalBlocks,
            skippedQuestions: this.skippedQuestions,
            successRate: `${successRate}%`,
            warnings: this.parsingWarnings.length,
            errors: this.validationErrors.length
        });
        
        if (this.skippedQuestions > 0) {
            this.log('warn', `Se omitieron ${this.skippedQuestions} preguntas por errores de formato o validación`);
        }
        
        if (validQuestions === 0) {
            this.log('error', 'No se procesaron preguntas válidas');
        }
    }

    log(level, message, data = null) {
        if (!this.enableDetailedLogging) return;
        
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            component: 'MarkdownParser',
            message,
            data
        };
        
        // Console output with appropriate level
        switch (level) {
            case 'error':
                console.error(`[${timestamp}] MarkdownParser ERROR: ${message}`, data || '');
                break;
            case 'warn':
                console.warn(`[${timestamp}] MarkdownParser WARN: ${message}`, data || '');
                break;
            case 'info':
                console.info(`[${timestamp}] MarkdownParser INFO: ${message}`, data || '');
                break;
            case 'debug':
                console.debug(`[${timestamp}] MarkdownParser DEBUG: ${message}`, data || '');
                break;
            default:
                console.log(`[${timestamp}] MarkdownParser: ${message}`, data || '');
        }
        
        // Store for potential retrieval
        if (level === 'error') {
            this.validationErrors.push(logEntry);
        } else if (level === 'warn') {
            this.parsingWarnings.push(logEntry);
        }
    }

    // Public method to get parsing statistics
    getParsingStats() {
        return {
            processedQuestions: this.processedQuestions,
            skippedQuestions: this.skippedQuestions,
            validationErrors: this.validationErrors.length,
            parsingWarnings: this.parsingWarnings.length,
            successRate: this.processedQuestions + this.skippedQuestions > 0 
                ? ((this.processedQuestions / (this.processedQuestions + this.skippedQuestions)) * 100).toFixed(1) + '%'
                : '0%'
        };
    }

    // Public method to get detailed logs
    getDetailedLogs() {
        return {
            errors: [...this.validationErrors],
            warnings: [...this.parsingWarnings]
        };
    }
}