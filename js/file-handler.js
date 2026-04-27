/**
 * FileHandler - Handles loading and validation of Markdown files
 * Responsible for reading local files and basic content validation
 */
class FileHandler {
    constructor() {
        this.supportedExtensions = ['.md', '.markdown'];
        this.enableDetailedLogging = true;
        this.loadingErrors = [];
        this.validationWarnings = [];
        
        // File validation rules
        this.validationRules = {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            minFileSize: 100, // 100 bytes
            requiredPatterns: [
                /##\s+Pregunta\s+\d+/i, // Question headers
                /<as-button[^>]*message="[^"]*"[^>]*>/i, // Answer buttons
                /^\s*\*?\*?[A-D]\*?\*?\.\s+.+$/m // Answer options
            ]
        };
    }

    /**
     * Load markdown file content from local file system
     * @param {string} filePath - Path to the markdown file
     * @returns {Promise<string>} - Promise that resolves to file content
     * @throws {Error} - If file cannot be loaded or is invalid
     */
    async loadMarkdownFile(filePath) {
        const loadingContext = {
            filePath,
            timestamp: new Date().toISOString(),
            attempt: 1
        };
        
        this.resetLoadingState();
        this.log('info', `Iniciando carga de archivo: ${filePath}`, loadingContext);
        
        try {
            // Validate file path
            this.validateFilePath(filePath);
            
            // Attempt to load file with retry logic
            const content = await this.loadFileWithRetry(filePath, 3);
            
            // Validate loaded content
            await this.validateFileContent(content, filePath);
            
            this.log('info', `Archivo cargado exitosamente: ${content.length} caracteres`, {
                ...loadingContext,
                contentLength: content.length,
                success: true
            });
            
            return content;
            
        } catch (error) {
            this.log('error', `Error cargando archivo: ${error.message}`, {
                ...loadingContext,
                error: error.stack,
                errorType: error.constructor.name
            });
            
            // Enhance error message with context
            const enhancedError = this.createEnhancedError(error, filePath);
            throw enhancedError;
        }
    }

    async loadFileWithRetry(filePath, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.log('debug', `Intento de carga ${attempt}/${maxRetries} para ${filePath}`);
                
                const response = await fetch(filePath);
                
                if (!response.ok) {
                    const errorMessage = this.getHttpErrorMessage(response.status, response.statusText, filePath);
                    throw new Error(errorMessage);
                }
                
                // Check content length
                const contentLength = response.headers.get('content-length');
                if (contentLength) {
                    const size = parseInt(contentLength);
                    this.validateFileSize(size, filePath);
                }
                
                const content = await response.text();
                
                this.log('debug', `Archivo cargado exitosamente en intento ${attempt}`, {
                    contentLength: content.length,
                    responseStatus: response.status
                });
                
                return content;
                
            } catch (error) {
                lastError = error;
                this.log('warn', `Intento ${attempt} falló: ${error.message}`);
                
                // Don't retry for certain types of errors
                if (error.message.includes('File not found') || 
                    error.message.includes('Unsupported file type') ||
                    error.message.includes('File too large') ||
                    error.message.includes('File too small')) {
                    break;
                }
                
                // Wait before retry (exponential backoff)
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
                    this.log('debug', `Esperando ${delay}ms antes del siguiente intento`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    validateFilePath(filePath) {
        if (!filePath || typeof filePath !== 'string') {
            throw new Error('Ruta de archivo inválida: debe ser una cadena de texto no vacía');
        }
        
        if (filePath.trim().length === 0) {
            throw new Error('Ruta de archivo vacía');
        }
        
        // Check file extension
        const hasValidExtension = this.supportedExtensions.some(ext => 
            filePath.toLowerCase().endsWith(ext)
        );
        
        if (!hasValidExtension) {
            throw new Error(`Tipo de archivo no soportado. Se esperaba: ${this.supportedExtensions.join(', ')}. Archivo: ${filePath}`);
        }
        
        // Check for potentially dangerous paths
        if (filePath.includes('..') || filePath.includes('//')) {
            throw new Error('Ruta de archivo potencialmente insegura detectada');
        }
    }

    validateFileSize(size, filePath) {
        if (size > this.validationRules.maxFileSize) {
            throw new Error(`Archivo demasiado grande: ${this.formatFileSize(size)} (máximo permitido: ${this.formatFileSize(this.validationRules.maxFileSize)})`);
        }
        
        if (size < this.validationRules.minFileSize) {
            throw new Error(`Archivo demasiado pequeño: ${this.formatFileSize(size)} (mínimo requerido: ${this.formatFileSize(this.validationRules.minFileSize)})`);
        }
    }

    getHttpErrorMessage(status, statusText, filePath) {
        switch (status) {
            case 404:
                return `Archivo no encontrado: ${filePath}. Verifica que el archivo existe y la ruta es correcta.`;
            case 403:
                return `Acceso denegado al archivo: ${filePath}. Verifica los permisos del archivo.`;
            case 500:
                return `Error del servidor al cargar: ${filePath}. Intenta nuevamente más tarde.`;
            case 0:
                return `Error de red al cargar: ${filePath}. Verifica tu conexión a internet.`;
            default:
                return `Error HTTP ${status} al cargar archivo: ${filePath}. ${statusText}`;
        }
    }

    /**
     * Validate markdown content structure and format
     * @param {string} content - File content to validate
     * @param {string} filePath - File path for context in error messages
     * @throws {Error} - If content is invalid
     */
    async validateFileContent(content, filePath = 'unknown') {
        const validationContext = {
            filePath,
            contentLength: content ? content.length : 0,
            timestamp: new Date().toISOString()
        };
        
        this.log('debug', 'Iniciando validación de contenido', validationContext);
        
        try {
            // Basic content validation
            this.validateBasicContent(content);
            
            // Structure validation
            this.validateContentStructure(content);
            
            // Pattern validation
            this.validateRequiredPatterns(content);
            
            // Content quality validation
            this.validateContentQuality(content);
            
            this.log('info', 'Validación de contenido completada exitosamente', {
                ...validationContext,
                warnings: this.validationWarnings.length
            });
            
            // Log warnings if any
            if (this.validationWarnings.length > 0) {
                this.log('warn', `Se encontraron ${this.validationWarnings.length} advertencias durante la validación`, {
                    warnings: this.validationWarnings
                });
            }
            
        } catch (error) {
            this.log('error', `Validación de contenido falló: ${error.message}`, {
                ...validationContext,
                error: error.stack
            });
            throw error;
        }
    }

    validateBasicContent(content) {
        if (!content || typeof content !== 'string') {
            throw new Error('Contenido inválido: el contenido está vacío o no es texto');
        }

        const trimmedContent = content.trim();
        if (trimmedContent.length === 0) {
            throw new Error('Contenido inválido: el archivo está vacío');
        }

        if (trimmedContent.length < this.validationRules.minFileSize) {
            throw new Error(`Contenido muy corto: ${trimmedContent.length} caracteres (mínimo requerido: ${this.validationRules.minFileSize})`);
        }

        if (content.length > this.validationRules.maxFileSize) {
            throw new Error(`Contenido muy largo: ${this.formatFileSize(content.length)} (máximo permitido: ${this.formatFileSize(this.validationRules.maxFileSize)})`);
        }
    }

    validateContentStructure(content) {
        // Check for basic markdown structure
        const lines = content.split('\n');
        let hasHeaders = false;
        let hasContent = false;
        
        for (const line of lines) {
            if (line.trim().startsWith('##')) {
                hasHeaders = true;
            }
            if (line.trim().length > 0 && !line.trim().startsWith('#')) {
                hasContent = true;
            }
        }
        
        if (!hasHeaders) {
            throw new Error('Estructura inválida: no se encontraron encabezados de sección (##)');
        }
        
        if (!hasContent) {
            throw new Error('Estructura inválida: no se encontró contenido además de los encabezados');
        }
    }

    validateRequiredPatterns(content) {
        const patternResults = [];
        
        for (let i = 0; i < this.validationRules.requiredPatterns.length; i++) {
            const pattern = this.validationRules.requiredPatterns[i];
            const matches = content.match(pattern);
            
            patternResults.push({
                pattern: pattern.toString(),
                found: !!matches,
                count: matches ? matches.length : 0
            });
        }
        
        // Check for questions
        const questionPattern = patternResults[0];
        if (!questionPattern.found) {
            throw new Error('Formato inválido: no se encontraron preguntas en el formato esperado (## Pregunta XXX)');
        }
        
        // Check for answer buttons
        const buttonPattern = patternResults[1];
        if (!buttonPattern.found) {
            throw new Error('Formato inválido: no se encontraron botones de respuesta en el formato esperado (<as-button message="...">)');
        }
        
        // Check for answer options
        const optionPattern = patternResults[2];
        if (!optionPattern.found) {
            throw new Error('Formato inválido: no se encontraron opciones de respuesta en el formato esperado (A. B. C. D.)');
        }
        
        // Log pattern analysis
        this.log('debug', 'Análisis de patrones completado', { patternResults });
        
        // Validate pattern consistency
        if (questionPattern.count > buttonPattern.count) {
            this.addValidationWarning(`Se encontraron ${questionPattern.count} preguntas pero solo ${buttonPattern.count} botones de respuesta`);
        }
        
        if (questionPattern.count * 2 > optionPattern.count) {
            this.addValidationWarning(`Posible falta de opciones de respuesta: ${questionPattern.count} preguntas vs ${optionPattern.count} opciones`);
        }
    }

    validateContentQuality(content) {
        // Check for common formatting issues
        const issues = [];
        
        // Check for excessive whitespace
        if (/\n\s*\n\s*\n\s*\n/.test(content)) {
            issues.push('Espaciado excesivo detectado (más de 3 líneas vacías consecutivas)');
        }
        
        // Check for inconsistent question numbering
        const questionNumbers = [];
        const questionMatches = content.match(/## Pregunta (\d+)/g);
        if (questionMatches) {
            for (const match of questionMatches) {
                const number = parseInt(match.match(/\d+/)[0]);
                questionNumbers.push(number);
            }
            
            // Check for gaps or duplicates
            const sortedNumbers = [...questionNumbers].sort((a, b) => a - b);
            for (let i = 1; i < sortedNumbers.length; i++) {
                if (sortedNumbers[i] === sortedNumbers[i-1]) {
                    issues.push(`Número de pregunta duplicado: ${sortedNumbers[i]}`);
                }
                if (sortedNumbers[i] - sortedNumbers[i-1] > 1) {
                    issues.push(`Salto en numeración de preguntas: de ${sortedNumbers[i-1]} a ${sortedNumbers[i]}`);
                }
            }
        }
        
        // Check for malformed HTML tags
        const htmlTags = content.match(/<[^>]+>/g);
        if (htmlTags) {
            for (const tag of htmlTags) {
                if (!tag.includes('as-button') && !tag.match(/^<\/?\w+[^>]*>$/)) {
                    issues.push(`Etiqueta HTML posiblemente malformada: ${tag}`);
                }
            }
        }
        
        // Log quality issues as warnings
        for (const issue of issues) {
            this.addValidationWarning(issue);
        }
        
        if (issues.length > 0) {
            this.log('warn', `Se detectaron ${issues.length} problemas de calidad en el contenido`, { issues });
        }
    }

    /**
     * Check if a file path appears to be valid
     * @param {string} filePath - Path to check
     * @returns {boolean} - True if path appears valid
     */
    isValidFilePath(filePath) {
        if (!filePath || typeof filePath !== 'string') {
            return false;
        }

        return this.supportedExtensions.some(ext => 
            filePath.toLowerCase().endsWith(ext)
        );
    }

    /**
     * Get supported file extensions
     * @returns {string[]} - Array of supported extensions
     */
    getSupportedExtensions() {
        return [...this.supportedExtensions];
    }

    createEnhancedError(originalError, filePath) {
        let enhancedMessage = originalError.message;
        
        // Add helpful suggestions based on error type
        if (originalError.message.includes('File not found')) {
            enhancedMessage += '\n\nSugerencias:\n• Verifica que el archivo existe en la ubicación especificada\n• Asegúrate de que el nombre del archivo es correcto\n• Verifica que tienes permisos de lectura';
        } else if (originalError.message.includes('Unsupported file type')) {
            enhancedMessage += `\n\nSugerencias:\n• Usa un archivo con extensión ${this.supportedExtensions.join(' o ')}\n• Verifica que el archivo es realmente un archivo Markdown`;
        } else if (originalError.message.includes('Invalid markdown content')) {
            enhancedMessage += '\n\nSugerencias:\n• Verifica el formato del archivo Markdown\n• Asegúrate de que contiene preguntas en el formato esperado\n• Revisa que los botones de respuesta están correctamente formateados';
        } else if (originalError.message.includes('too large')) {
            enhancedMessage += `\n\nSugerencias:\n• Reduce el tamaño del archivo (máximo: ${this.formatFileSize(this.validationRules.maxFileSize)})\n• Divide el contenido en múltiples archivos más pequeños`;
        }
        
        const enhancedError = new Error(enhancedMessage);
        enhancedError.originalError = originalError;
        enhancedError.filePath = filePath;
        enhancedError.timestamp = new Date().toISOString();
        
        return enhancedError;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    addValidationWarning(message) {
        this.validationWarnings.push({
            message,
            timestamp: new Date().toISOString()
        });
    }

    resetLoadingState() {
        this.loadingErrors = [];
        this.validationWarnings = [];
    }

    log(level, message, data = null) {
        if (!this.enableDetailedLogging) return;
        
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            component: 'FileHandler',
            message,
            data
        };
        
        // Console output with appropriate level
        switch (level) {
            case 'error':
                console.error(`[${timestamp}] FileHandler ERROR: ${message}`, data || '');
                this.loadingErrors.push(logEntry);
                break;
            case 'warn':
                console.warn(`[${timestamp}] FileHandler WARN: ${message}`, data || '');
                break;
            case 'info':
                console.info(`[${timestamp}] FileHandler INFO: ${message}`, data || '');
                break;
            case 'debug':
                console.debug(`[${timestamp}] FileHandler DEBUG: ${message}`, data || '');
                break;
            default:
                console.log(`[${timestamp}] FileHandler: ${message}`, data || '');
        }
    }

    // Public methods for getting error information
    getLoadingErrors() {
        return [...this.loadingErrors];
    }

    getValidationWarnings() {
        return [...this.validationWarnings];
    }

    getLoadingStats() {
        return {
            errors: this.loadingErrors.length,
            warnings: this.validationWarnings.length,
            lastError: this.loadingErrors.length > 0 ? this.loadingErrors[this.loadingErrors.length - 1] : null,
            lastWarning: this.validationWarnings.length > 0 ? this.validationWarnings[this.validationWarnings.length - 1] : null
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileHandler;
}