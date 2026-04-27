/**
 * UIController - Manages all user interface interactions and screen navigation
 * Handles displaying questions, configuration, progress, and results
 */
class UIController {
    constructor() {
        // Screen elements
        this.configScreen = document.getElementById('config-screen');
        this.quizScreen = document.getElementById('quiz-screen');
        this.resultsScreen = document.getElementById('results-screen');
        
        // Configuration elements
        this.quizFilenameInput = document.getElementById('quiz-filename');
        this.loadQuestionsBtn = document.getElementById('load-questions-btn');
        this.questionCountInput = document.getElementById('question-count');
        this.fileStatusDiv = document.getElementById('file-status');
        this.startQuizBtn = document.getElementById('start-quiz-btn');
        

        
        // Quiz elements
        this.progressBar = document.getElementById('progress-fill');
        this.questionNumber = document.getElementById('question-number');
        this.progressText = document.getElementById('progress-text');
        this.questionTitle = document.getElementById('question-title');
        this.questionContent = document.getElementById('question-content');
        this.optionsContainer = document.getElementById('options-container');
        this.nextQuestionBtn = document.getElementById('next-question-btn');
        
        // Results elements
        this.scoreDisplay = document.getElementById('score-display');
        this.scoreText = document.getElementById('score-text');
        this.resultsList = document.getElementById('results-list');
        this.newQuizBtn = document.getElementById('new-quiz-btn');
        this.backConfigBtn = document.getElementById('back-config-btn');
        
        // State
        this.currentScreen = 'config';
        this.selectedAnswer = null;
        this.selectedAnswers = [];
        this.isMultipleSelection = false;
        this.totalQuestionsAvailable = 0;
        this.saveConfigTimeout = null;
        this.configStatusTimeout = null;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Configuration screen events
        if (this.loadQuestionsBtn) {
            this.loadQuestionsBtn.addEventListener('click', () => this.onLoadQuestions());
        }
        
        if (this.startQuizBtn) {
            this.startQuizBtn.addEventListener('click', () => this.onStartQuiz());
        }
        
        if (this.quizFilenameInput) {
            this.quizFilenameInput.addEventListener('input', () => this.onFilenameChange());
        }
        
        if (this.questionCountInput) {
            this.questionCountInput.addEventListener('input', () => this.onQuestionCountChange());
        }
        
        // Quiz screen events
        if (this.nextQuestionBtn) {
            this.nextQuestionBtn.addEventListener('click', () => this.onNextQuestion());
        }
        
        // Results screen events
        if (this.newQuizBtn) {
            this.newQuizBtn.addEventListener('click', () => this.onNewQuiz());
        }
        
        if (this.backConfigBtn) {
            this.backConfigBtn.addEventListener('click', () => this.onBackToConfig());
        }
        
        // Option selection events (delegated)
        if (this.optionsContainer) {
            this.optionsContainer.addEventListener('click', (e) => {
                const option = e.target.closest('.option');
                if (option) {
                    this.onOptionSelected(option);
                }
            });
        }
    }

    // Screen Navigation Methods
    showScreen(screenName) {
        // Get current active screen
        const currentActiveScreen = document.querySelector('.screen.active');
        
        // If same screen, no need to transition
        if (this.currentScreen === screenName) {
            return;
        }
        
        // Add fade-out class to current screen
        if (currentActiveScreen) {
            currentActiveScreen.classList.add('fade-out');
            
            // Wait for fade-out animation to complete
            setTimeout(() => {
                // Hide all screens
                this.configScreen?.classList.remove('active', 'fade-out');
                this.quizScreen?.classList.remove('active', 'fade-out');
                this.resultsScreen?.classList.remove('active', 'fade-out');
                
                // Show requested screen with animation
                this.activateScreen(screenName);
            }, 300);
        } else {
            // No current screen, show immediately
            this.activateScreen(screenName);
        }
    }

    activateScreen(screenName) {
        switch (screenName) {
            case 'config':
                this.configScreen?.classList.add('active');
                this.currentScreen = 'config';
                break;
            case 'quiz':
                this.quizScreen?.classList.add('active');
                this.currentScreen = 'quiz';
                // Reset option animations
                this.resetOptionAnimations();
                break;
            case 'results':
                this.resultsScreen?.classList.add('active');
                this.currentScreen = 'results';
                break;
            default:
                console.error('Unknown screen:', screenName);
        }
    }

    resetOptionAnimations() {
        // Reset option animations for smooth re-entry
        if (this.optionsContainer) {
            const options = this.optionsContainer.querySelectorAll('.option');
            options.forEach((option, index) => {
                option.style.animation = 'none';
                option.offsetHeight; // Trigger reflow
                option.style.animation = `optionFadeIn 0.5s ease forwards`;
                option.style.animationDelay = `${(index + 1) * 0.1}s`;
            });
        }
    }

    // Configuration Screen Methods
    showConfiguration() {
        this.showScreen('config');
    }

    updateFileStatus(status, message, questionsCount = 0) {
        if (!this.fileStatusDiv) return;
        
        this.fileStatusDiv.className = status; // loading, success, error
        
        switch (status) {
            case 'loading':
                this.fileStatusDiv.innerHTML = `
                    <div class="loading-spinner"></div>
                    <p>${message}</p>
                `;
                this.startQuizBtn.disabled = true;
                break;
                
            case 'success':
                this.totalQuestionsAvailable = questionsCount;
                this.fileStatusDiv.innerHTML = `
                    <div style="color: #27ae60; font-size: 1.2rem; margin-bottom: 0.5rem;">✓</div>
                    <p>${message}</p>
                    <small>${questionsCount} preguntas disponibles</small>
                `;
                this.startQuizBtn.disabled = false;
                
                // Update limits and reload configuration to ensure saved values are within new limits
                this.updateQuestionCountLimits();
                
                // Reload configuration now that we know the total questions available
                this.loadConfiguration();
                break;
                
            case 'error':
                this.fileStatusDiv.innerHTML = `
                    <div style="color: #e74c3c; font-size: 1.2rem; margin-bottom: 0.5rem;">✗</div>
                    <p style="color: #e74c3c;">${message}</p>
                `;
                this.startQuizBtn.disabled = true;
                break;
        }
    }

    updateQuestionCountLimits() {
        if (!this.questionCountInput || this.totalQuestionsAvailable === 0) return;
        
        this.questionCountInput.max = this.totalQuestionsAvailable;
        
        // Update help text
        const helpText = document.getElementById('question-count-help');
        if (helpText) {
            helpText.textContent = `Selecciona entre 1 y ${this.totalQuestionsAvailable} preguntas`;
        }
        
        // Adjust current value if it exceeds available questions
        const currentValue = parseInt(this.questionCountInput.value);
        if (currentValue > this.totalQuestionsAvailable) {
            this.questionCountInput.value = this.totalQuestionsAvailable;
            console.log(`Número de preguntas ajustado de ${currentValue} a ${this.totalQuestionsAvailable} (máximo disponible)`);
            
            // Save the adjusted configuration
            this.saveConfiguration();
        }
        
        // Ensure minimum value
        if (currentValue < 1) {
            this.questionCountInput.value = 1;
            console.log('Número de preguntas ajustado a mínimo: 1');
            this.saveConfiguration();
        }
    }

    getQuizFilename() {
        if (!this.quizFilenameInput) return 'Quiz.md';
        
        const filename = this.quizFilenameInput.value.trim();
        return filename || 'Quiz.md';
    }

    getQuestionCount() {
        if (!this.questionCountInput) return 10;
        
        const value = parseInt(this.questionCountInput.value);
        return Math.min(Math.max(value, 1), this.totalQuestionsAvailable);
    }

    // Quiz Screen Methods
    displayQuestion(questionData) {
        if (!questionData) {
            console.error('No question data provided');
            return;
        }
        
        const { question, questionNumber, totalQuestions, isLast } = questionData;
        
        // Show quiz screen first
        this.showScreen('quiz');
        
        // Add staggered animations to question elements
        setTimeout(() => {
            // Update question header with animation
            if (this.questionNumber) {
                this.questionNumber.textContent = `Pregunta ${questionNumber}`;
                this.questionNumber.classList.add('slide-in-left');
            }
            
            if (this.progressText) {
                this.progressText.textContent = `${questionNumber} de ${totalQuestions}`;
                this.progressText.classList.add('slide-in-right');
            }
        }, 100);
        
        setTimeout(() => {
            // Update question content with animation
            if (this.questionTitle) {
                this.questionTitle.textContent = question.title || `Pregunta ${questionNumber}`;
                this.questionTitle.classList.add('fade-in');
            }
            
            if (this.questionContent) {
                this.questionContent.textContent = question.content || '';
                this.questionContent.classList.add('fade-in');
            }
        }, 200);
        
        setTimeout(() => {
            // Update options with staggered animation
            this.displayOptions(question.options, question.correctAnswers);
        }, 300);
        
        // Update progress bar with smooth animation
        this.updateProgress(questionNumber, totalQuestions);
        
        // Update next button text for last question
        if (this.nextQuestionBtn) {
            this.nextQuestionBtn.textContent = isLast ? 'Ver Resultados' : 'Siguiente Pregunta';
            this.nextQuestionBtn.disabled = true; // Enable when answer is selected
            
            // Remove any previous animation classes
            this.nextQuestionBtn.classList.remove('bounce-in');
        }
        
        // Clear previous selection
        this.selectedAnswer = null;
        this.selectedAnswers = [];
        
        // Clear animation classes after they complete
        setTimeout(() => {
            this.clearAnimationClasses();
        }, 1000);
    }

    clearAnimationClasses() {
        // Remove animation classes to allow re-animation
        const elements = [this.questionNumber, this.progressText, this.questionTitle, this.questionContent];
        elements.forEach(element => {
            if (element) {
                element.classList.remove('slide-in-left', 'slide-in-right', 'fade-in', 'bounce-in');
            }
        });
    }

    displayOptions(options, correctAnswers = []) {
        if (!this.optionsContainer || !options) return;
        
        // Determine if this is a multiple selection question
        this.isMultipleSelection = correctAnswers.length > 1;
        
        // Clear previous selections
        const optionButtons = this.optionsContainer.querySelectorAll('.option');
        optionButtons.forEach(btn => btn.classList.remove('selected'));
        
        // Update option texts and selection mode
        Object.entries(options).forEach(([letter, text]) => {
            const optionButton = this.optionsContainer.querySelector(`[data-option="${letter}"]`);
            if (optionButton) {
                const textSpan = optionButton.querySelector('.option-text');
                if (textSpan) {
                    textSpan.textContent = text;
                }
                optionButton.style.display = 'block';
                
                // Add visual indicator for multiple selection
                if (this.isMultipleSelection) {
                    optionButton.classList.add('multiple-selection');
                } else {
                    optionButton.classList.remove('multiple-selection');
                }
            }
        });
        
        // Hide unused options
        const allOptions = this.optionsContainer.querySelectorAll('.option');
        allOptions.forEach(btn => {
            const letter = btn.dataset.option;
            if (!options[letter]) {
                btn.style.display = 'none';
            }
        });
    }

    updateProgress(current, total) {
        if (!this.progressBar) return;
        
        const percentage = (current / total) * 100;
        this.progressBar.style.width = `${percentage}%`;
    }

    // Results Screen Methods
    displayResults(results) {
        if (!results) {
            console.error('No results data provided');
            return;
        }
        
        // Show results screen first
        this.showScreen('results');
        
        // Animate score display with counting effect
        setTimeout(() => {
            this.animateScoreDisplay(results);
        }, 300);
        
        // Display detailed results with staggered animation
        setTimeout(() => {
            this.displayResultsDetails(results.details);
        }, 800);
    }

    animateScoreDisplay(results) {
        if (this.scoreDisplay) {
            // Color code the score with gradient
            let colorClass = '';
            if (results.score >= 80) {
                this.scoreDisplay.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
                colorClass = 'excellent';
            } else if (results.score >= 60) {
                this.scoreDisplay.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
                colorClass = 'good';
            } else {
                this.scoreDisplay.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
                colorClass = 'needs-improvement';
            }
            
            // Animate counting up to final score
            this.animateCountUp(this.scoreDisplay, 0, results.score, 1500, '%');
            
            // Add celebration effect for high scores
            if (results.score >= 80) {
                this.addCelebrationEffect();
            }
        }
        
        if (this.scoreText) {
            setTimeout(() => {
                this.scoreText.textContent = `${results.correctCount} de ${results.totalQuestions} respuestas correctas`;
                this.scoreText.classList.add('fade-in');
                
                // Add encouraging message based on score
                const encouragement = this.getEncouragementMessage(results.score);
                if (encouragement) {
                    const encouragementEl = document.createElement('p');
                    encouragementEl.textContent = encouragement;
                    encouragementEl.style.cssText = `
                        font-size: 1rem;
                        color: #7f8c8d;
                        margin-top: 0.5rem;
                        font-style: italic;
                        opacity: 0;
                        animation: fadeIn 0.5s ease 0.5s forwards;
                    `;
                    this.scoreText.parentNode.appendChild(encouragementEl);
                }
            }, 800);
        }
    }

    animateCountUp(element, start, end, duration, suffix = '') {
        const startTime = performance.now();
        const range = end - start;
        
        const updateCount = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.round(start + (range * easeOutQuart));
            
            element.textContent = current + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(updateCount);
            }
        };
        
        requestAnimationFrame(updateCount);
    }

    getEncouragementMessage(score) {
        if (score >= 90) {
            return '¡Excelente! Dominas el tema perfectamente.';
        } else if (score >= 80) {
            return '¡Muy bien! Tienes un buen conocimiento del tema.';
        } else if (score >= 70) {
            return 'Buen trabajo. Con un poco más de estudio serás un experto.';
        } else if (score >= 60) {
            return 'No está mal. Revisa los temas que fallaste y vuelve a intentarlo.';
        } else {
            return 'Sigue practicando. Cada intento te acerca más al éxito.';
        }
    }

    addCelebrationEffect() {
        // Create confetti-like celebration effect
        const colors = ['#f39c12', '#e74c3c', '#9b59b6', '#3498db', '#2ecc71'];
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.createConfettiPiece(colors[Math.floor(Math.random() * colors.length)]);
            }, i * 100);
        }
    }

    createConfettiPiece(color) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${color};
            top: 20%;
            left: ${Math.random() * 100}%;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            animation: confettiFall 3s ease-out forwards;
        `;
        
        // Add confetti animation if not exists
        if (!document.getElementById('confetti-animation-styles')) {
            const style = document.createElement('style');
            style.id = 'confetti-animation-styles';
            style.textContent = `
                @keyframes confettiFall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
            }
        }, 3000);
    }

    displayResultsDetails(details) {
        if (!this.resultsList || !details) return;
        
        this.resultsList.innerHTML = '';
        
        details.forEach((detail, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = `result-item ${detail.isCorrect ? 'correct' : 'incorrect'}`;
            
            // Set initial state for animation
            resultItem.style.opacity = '0';
            resultItem.style.transform = 'translateX(-20px)';
            
            const questionText = detail.question.content.length > 100 
                ? detail.question.content.substring(0, 100) + '...'
                : detail.question.content;
            
            let answerInfo = '';
            if (detail.isCorrect) {
                answerInfo = `
                    <div class="result-answer">
                        <span class="answer-label">Tu respuesta:</span> 
                        <span class="answer-value correct">${detail.userAnswer}. ${detail.userAnswerText}</span>
                        <span class="answer-icon">✓</span>
                    </div>
                `;
            } else {
                const correctAnswersText = detail.correctAnswerTexts.join(' o ');
                answerInfo = `
                    <div class="result-answer">
                        <span class="answer-label">Tu respuesta:</span> 
                        <span class="answer-value incorrect">${detail.userAnswer || 'Sin respuesta'}. ${detail.userAnswerText || 'No respondida'}</span>
                        <span class="answer-icon">✗</span>
                    </div>
                    <div class="result-answer correct-answer">
                        <span class="answer-label">Respuesta correcta:</span> 
                        <span class="answer-value">${detail.correctAnswers.join(', ')}. ${correctAnswersText}</span>
                    </div>
                `;
            }
            
            resultItem.innerHTML = `
                <div class="result-question">
                    <span class="question-number-badge">${detail.questionNumber}</span>
                    <span class="question-text">${questionText}</span>
                </div>
                ${answerInfo}
            `;
            
            this.resultsList.appendChild(resultItem);
            
            // Trigger animation with staggered delay
            setTimeout(() => {
                resultItem.style.opacity = '1';
                resultItem.style.transform = 'translateX(0)';
                resultItem.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                
                // Add hover effect after animation
                setTimeout(() => {
                    resultItem.addEventListener('mouseenter', () => {
                        if (!window.matchMedia('(hover: none)').matches) {
                            resultItem.style.transform = 'translateY(-2px)';
                            resultItem.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                        }
                    });
                    
                    resultItem.addEventListener('mouseleave', () => {
                        if (!window.matchMedia('(hover: none)').matches) {
                            resultItem.style.transform = 'translateY(0)';
                            resultItem.style.boxShadow = '';
                        }
                    });
                }, 500);
            }, index * 150 + 200);
        });
        
        // Add enhanced styles for result details
        this.addResultDetailStyles();
    }

    addResultDetailStyles() {
        if (!document.getElementById('result-detail-styles')) {
            const style = document.createElement('style');
            style.id = 'result-detail-styles';
            style.textContent = `
                .question-number-badge {
                    display: inline-block;
                    background: linear-gradient(135deg, #3498db, #2980b9);
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-right: 0.75rem;
                    min-width: 2rem;
                    text-align: center;
                }
                
                .question-text {
                    font-weight: 600;
                    color: #2c3e50;
                }
                
                .answer-label {
                    font-weight: 500;
                    color: #7f8c8d;
                    margin-right: 0.5rem;
                }
                
                .answer-value {
                    font-weight: 500;
                }
                
                .answer-value.correct {
                    color: #27ae60;
                }
                
                .answer-value.incorrect {
                    color: #e74c3c;
                }
                
                .answer-icon {
                    margin-left: 0.5rem;
                    font-weight: bold;
                    font-size: 1.1rem;
                }
                
                .correct-answer {
                    background: rgba(39, 174, 96, 0.1);
                    padding: 0.5rem;
                    border-radius: 6px;
                    margin-top: 0.5rem;
                    border-left: 3px solid #27ae60;
                }
                
                .correct-answer .answer-value {
                    color: #27ae60;
                    font-weight: 600;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Event Handlers
    onStartQuiz() {
        const questionCount = this.getQuestionCount();
        const filename = this.getQuizFilename();
        
        // Dispatch custom event for app to handle
        const event = new CustomEvent('startQuiz', {
            detail: { questionCount, filename }
        });
        document.dispatchEvent(event);
    }

    onQuestionCountChange() {
        const value = parseInt(this.questionCountInput.value);
        let adjustedValue = value;
        
        // Validate range
        if (value < 1) {
            adjustedValue = 1;
            this.questionCountInput.value = adjustedValue;
        } else if (value > this.totalQuestionsAvailable && this.totalQuestionsAvailable > 0) {
            adjustedValue = this.totalQuestionsAvailable;
            this.questionCountInput.value = adjustedValue;
        }
        
        // Save configuration automatically when user changes value
        if (adjustedValue !== value) {
            console.log(`Número de preguntas ajustado de ${value} a ${adjustedValue}`);
        }
        
        // Auto-save configuration with debouncing to avoid excessive saves
        clearTimeout(this.saveConfigTimeout);
        this.saveConfigTimeout = setTimeout(() => {
            this.saveConfiguration();
        }, 500); // Save after 500ms of no changes
    }

    onFilenameChange() {
        // Auto-save configuration with debouncing
        clearTimeout(this.saveConfigTimeout);
        this.saveConfigTimeout = setTimeout(() => {
            this.saveConfiguration();
        }, 500); // Save configuration but don't auto-load
    }

    onLoadQuestions() {
        const filename = this.getQuizFilename();
        
        // Dispatch event to load questions from specified file
        const event = new CustomEvent('loadQuestions', {
            detail: { filename }
        });
        document.dispatchEvent(event);
    }

    onOptionSelected(optionElement) {
        const option = optionElement.dataset.option;
        
        if (this.isMultipleSelection) {
            // Multiple selection mode - toggle selection
            if (optionElement.classList.contains('selected')) {
                optionElement.classList.remove('selected');
                this.selectedAnswers = this.selectedAnswers.filter(ans => ans !== option);
            } else {
                optionElement.classList.add('selected');
                this.selectedAnswers.push(option);
            }
            
            // Update selectedAnswer for compatibility (join multiple answers)
            this.selectedAnswer = this.selectedAnswers.sort().join('');
        } else {
            // Single selection mode - clear others and select this one
            const allOptions = this.optionsContainer.querySelectorAll('.option');
            allOptions.forEach(opt => opt.classList.remove('selected'));
            
            optionElement.classList.add('selected');
            this.selectedAnswer = option;
            this.selectedAnswers = [option];
        }
        
        // Add haptic feedback for mobile devices
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
        
        // Enable next button if at least one option is selected
        if (this.nextQuestionBtn) {
            const hasSelection = this.selectedAnswers.length > 0;
            this.nextQuestionBtn.disabled = !hasSelection;
            
            if (hasSelection) {
                this.nextQuestionBtn.classList.add('bounce-in');
                setTimeout(() => {
                    this.nextQuestionBtn.classList.remove('bounce-in');
                }, 600);
            }
        }
        
        // Add visual feedback to show selection was registered
        this.showSelectionFeedback(optionElement);
    }

    showSelectionFeedback(optionElement) {
        // Create a temporary feedback element
        const feedback = document.createElement('div');
        feedback.textContent = '✓';
        feedback.style.cssText = `
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%) scale(0);
            color: #27ae60;
            font-size: 1.5rem;
            font-weight: bold;
            pointer-events: none;
            animation: checkmarkAppear 0.4s ease forwards;
        `;
        
        // Add CSS for checkmark animation if not exists
        if (!document.getElementById('checkmark-animation-styles')) {
            const style = document.createElement('style');
            style.id = 'checkmark-animation-styles';
            style.textContent = `
                @keyframes checkmarkAppear {
                    0% {
                        transform: translateY(-50%) scale(0) rotate(-180deg);
                        opacity: 0;
                    }
                    50% {
                        transform: translateY(-50%) scale(1.2) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-50%) scale(1) rotate(0deg);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Position relative to option
        optionElement.style.position = 'relative';
        optionElement.appendChild(feedback);
        
        // Remove feedback after animation
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 2000);
    }

    onNextQuestion() {
        if (!this.selectedAnswer) {
            alert('Por favor selecciona una respuesta antes de continuar.');
            return;
        }
        
        // Dispatch custom event with selected answer
        const event = new CustomEvent('answerSubmitted', {
            detail: { answer: this.selectedAnswer }
        });
        document.dispatchEvent(event);
    }

    onNewQuiz() {
        // Dispatch custom event for new quiz
        const event = new CustomEvent('newQuiz');
        document.dispatchEvent(event);
    }

    onBackToConfig() {
        // Solo cambiar a la pantalla de configuración sin recargar el archivo
        this.showScreen('config');
    }

    // Utility Methods
    showError(message, details = null) {
        // Create a more user-friendly error display
        const errorContainer = this.createErrorContainer(message, details);
        document.body.appendChild(errorContainer);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorContainer.parentNode) {
                errorContainer.parentNode.removeChild(errorContainer);
            }
        }, 10000);
        
        // Also log to console for debugging
        console.error('UI Error:', message, details);
    }

    createErrorContainer(message, details) {
        const container = document.createElement('div');
        container.className = 'error-notification';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 400px;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add CSS animation
        if (!document.getElementById('error-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'error-notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .error-notification:hover {
                    transform: scale(1.02);
                    transition: transform 0.2s ease;
                }
            `;
            document.head.appendChild(style);
        }
        
        let content = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div style="font-size: 20px; flex-shrink: 0;">⚠️</div>
                <div style="flex: 1;">
                    <div style="font-weight: bold; margin-bottom: 8px;">Error en la aplicación</div>
                    <div style="margin-bottom: 12px; line-height: 1.4;">${this.sanitizeErrorMessage(message)}</div>
        `;
        
        if (details) {
            content += `
                <details style="margin-top: 8px;">
                    <summary style="cursor: pointer; font-size: 0.9em; opacity: 0.8;">Ver detalles técnicos</summary>
                    <pre style="margin-top: 8px; font-size: 0.8em; opacity: 0.7; white-space: pre-wrap; max-height: 100px; overflow-y: auto;">${this.sanitizeErrorMessage(JSON.stringify(details, null, 2))}</pre>
                </details>
            `;
        }
        
        content += `
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.9em; margin-top: 8px;">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML = content;
        return container;
    }

    sanitizeErrorMessage(message) {
        if (typeof message !== 'string') {
            message = String(message);
        }
        
        // Remove potentially sensitive information
        message = message.replace(/file:\/\/[^\s]*/g, '[archivo local]');
        message = message.replace(/http[s]?:\/\/[^\s]*/g, '[URL]');
        
        // Escape HTML
        const div = document.createElement('div');
        div.textContent = message;
        return div.innerHTML;
    }

    showUserFriendlyError(technicalError, userContext = '') {
        let userMessage = 'Ha ocurrido un error inesperado.';
        let suggestions = [];
        
        // Analyze error and provide user-friendly messages
        if (technicalError.includes('File not found') || technicalError.includes('404')) {
            userMessage = 'No se pudo encontrar el archivo de preguntas.';
            suggestions = [
                'Verifica que el archivo "Quiz.md" existe en la carpeta del proyecto',
                'Asegúrate de que el nombre del archivo es correcto',
                'Recarga la página para intentar nuevamente'
            ];
        } else if (technicalError.includes('Invalid markdown content') || technicalError.includes('parsing')) {
            userMessage = 'El archivo de preguntas tiene un formato incorrecto.';
            suggestions = [
                'Verifica que el archivo contiene preguntas en el formato esperado',
                'Asegúrate de que cada pregunta tiene opciones A, B, C, D',
                'Revisa que los botones de respuesta están correctamente formateados'
            ];
        } else if (technicalError.includes('Network') || technicalError.includes('fetch')) {
            userMessage = 'Problema de conexión al cargar el archivo.';
            suggestions = [
                'Verifica tu conexión a internet',
                'Recarga la página para intentar nuevamente',
                'Si el problema persiste, contacta al administrador'
            ];
        } else if (technicalError.includes('Quiz engine') || technicalError.includes('questions')) {
            userMessage = 'Error en el sistema de preguntas del quiz.';
            suggestions = [
                'Intenta reiniciar el quiz',
                'Verifica que hay preguntas válidas disponibles',
                'Recarga la página si el problema persiste'
            ];
        }
        
        // Add context if provided
        if (userContext) {
            userMessage += ` (${userContext})`;
        }
        
        // Create enhanced error message
        let enhancedMessage = userMessage;
        if (suggestions.length > 0) {
            enhancedMessage += '\n\nSugerencias:\n• ' + suggestions.join('\n• ');
        }
        
        this.showError(enhancedMessage, { technicalError, timestamp: new Date().toISOString() });
    }

    showLoading(message = 'Cargando...') {
        // Could implement a loading overlay here
        console.log('Loading:', message);
    }

    hideLoading() {
        // Hide loading overlay
        console.log('Loading complete');
    }

    // Save/Load configuration from localStorage
    saveConfiguration() {
        try {
            const config = {
                filename: this.getQuizFilename(),
                questionCount: this.getQuestionCount(),
                lastSaved: new Date().toISOString(),
                version: '1.0'
            };
            localStorage.setItem('quiz-config', JSON.stringify(config));
            console.log('Configuración guardada:', config);
            
            // Show visual feedback
            this.showConfigSaveStatus();
        } catch (error) {
            console.warn('No se pudo guardar la configuración:', error);
        }
    }

    loadConfiguration() {
        try {
            const saved = localStorage.getItem('quiz-config');
            if (saved) {
                const config = JSON.parse(saved);
                console.log('Configuración cargada:', config);
                
                // Validate configuration structure
                if (config && typeof config.questionCount === 'number') {
                    if (this.quizFilenameInput && config.filename) {
                        this.quizFilenameInput.value = config.filename;
                        console.log(`Nombre de archivo restaurado: ${config.filename}`);
                    }
                    if (this.questionCountInput) {
                        // Ensure the value is within valid range
                        const questionCount = Math.max(1, Math.min(config.questionCount, 100));
                        this.questionCountInput.value = questionCount;
                        console.log(`Número de preguntas restaurado: ${questionCount}`);
                    }
                } else {
                    console.warn('Configuración guardada inválida, usando valores por defecto');
                    this.setDefaultConfiguration();
                }
            } else {
                console.log('No hay configuración guardada, usando valores por defecto');
                this.setDefaultConfiguration();
            }
        } catch (error) {
            console.warn('Error al cargar configuración guardada:', error);
            this.setDefaultConfiguration();
        }
    }

    setDefaultConfiguration() {
        if (this.quizFilenameInput) {
            this.quizFilenameInput.value = 'Quiz.md';
        }
        if (this.questionCountInput) {
            this.questionCountInput.value = 10;
            console.log('Configuración por defecto aplicada: Quiz.md, 10 preguntas');
        }
    }

    clearConfiguration() {
        try {
            localStorage.removeItem('quiz-config');
            this.setDefaultConfiguration();
            console.log('Configuración eliminada y restaurada a valores por defecto');
        } catch (error) {
            console.warn('Error al eliminar configuración:', error);
        }
    }

    showConfigSaveStatus() {
        const statusElement = document.getElementById('config-save-status');
        if (statusElement) {
            // Clear any existing timeout
            clearTimeout(this.configStatusTimeout);
            
            // Show the status
            statusElement.classList.remove('hidden');
            statusElement.classList.add('show');
            
            // Hide after 2 seconds
            this.configStatusTimeout = setTimeout(() => {
                statusElement.classList.remove('show');
                setTimeout(() => {
                    statusElement.classList.add('hidden');
                }, 300); // Wait for fade out animation
            }, 2000);
        }
    }

    // Get current configuration for debugging
    getConfigurationInfo() {
        try {
            const saved = localStorage.getItem('quiz-config');
            const current = {
                filename: this.getQuizFilename(),
                questionCount: this.getQuestionCount(),
                totalQuestionsAvailable: this.totalQuestionsAvailable,
                currentScreen: this.currentScreen
            };
            
            return {
                current: current,
                saved: saved ? JSON.parse(saved) : null,
                isValid: this.isConfigurationValid()
            };
        } catch (error) {
            return {
                current: null,
                saved: null,
                error: error.message
            };
        }
    }

    isConfigurationValid() {
        const questionCount = this.getQuestionCount();
        return questionCount >= 1 && 
               (this.totalQuestionsAvailable === 0 || questionCount <= this.totalQuestionsAvailable);
    }

    // Initialize the UI
    initialize() {
        this.loadConfiguration();
        this.showConfiguration();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIController;
}