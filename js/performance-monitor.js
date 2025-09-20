/**
 * Performance Monitor - Tracks and optimizes application performance
 * Monitors parsing times, memory usage, and user interactions
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            parsing: [],
            rendering: [],
            interactions: [],
            memory: [],
            errors: []
        };
        
        this.thresholds = {
            parsingTime: 2000, // 2 seconds
            renderingTime: 100, // 100ms
            interactionTime: 50, // 50ms
            memoryUsage: 100 * 1024 * 1024 // 100MB
        };
        
        this.isMonitoring = false;
        this.startTime = null;
        
        this.initializeMonitoring();
    }

    initializeMonitoring() {
        // Monitor performance API if available
        if ('performance' in window) {
            this.observePerformanceEntries();
        }
        
        // Monitor memory usage if available
        if ('memory' in performance) {
            this.startMemoryMonitoring();
        }
        
        // Monitor user interactions
        this.monitorUserInteractions();
        
        console.log('🔍 Performance monitoring initialized');
    }

    observePerformanceEntries() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordPerformanceEntry(entry);
                }
            });
            
            observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
        }
    }

    recordPerformanceEntry(entry) {
        const metric = {
            name: entry.name,
            type: entry.entryType,
            duration: entry.duration,
            startTime: entry.startTime,
            timestamp: Date.now()
        };
        
        if (entry.entryType === 'measure') {
            this.metrics.rendering.push(metric);
        } else if (entry.entryType === 'resource') {
            this.metrics.parsing.push(metric);
        }
        
        this.checkThresholds(metric);
    }

    startMemoryMonitoring() {
        setInterval(() => {
            if ('memory' in performance) {
                const memoryInfo = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                };
                
                this.metrics.memory.push(memoryInfo);
                
                // Keep only last 100 memory readings
                if (this.metrics.memory.length > 100) {
                    this.metrics.memory.shift();
                }
                
                // Check memory threshold
                if (memoryInfo.used > this.thresholds.memoryUsage) {
                    this.recordWarning('High memory usage detected', {
                        used: this.formatBytes(memoryInfo.used),
                        threshold: this.formatBytes(this.thresholds.memoryUsage)
                    });
                }
            }
        }, 5000); // Check every 5 seconds
    }

    monitorUserInteractions() {
        const interactionEvents = ['click', 'keydown', 'scroll', 'resize'];
        
        interactionEvents.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                const startTime = performance.now();
                
                // Use requestAnimationFrame to measure interaction response time
                requestAnimationFrame(() => {
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    const interaction = {
                        type: eventType,
                        target: event.target.tagName || 'unknown',
                        duration: duration,
                        timestamp: Date.now()
                    };
                    
                    this.metrics.interactions.push(interaction);
                    
                    // Keep only last 50 interactions
                    if (this.metrics.interactions.length > 50) {
                        this.metrics.interactions.shift();
                    }
                    
                    if (duration > this.thresholds.interactionTime) {
                        this.recordWarning('Slow interaction detected', interaction);
                    }
                });
            }, { passive: true });
        });
    }

    // Specific monitoring methods for quiz components
    startParsingMeasurement(label = 'parsing') {
        if ('performance' in window && 'mark' in performance) {
            performance.mark(`${label}-start`);
        }
        return performance.now();
    }

    endParsingMeasurement(label = 'parsing', startTime = null) {
        const endTime = performance.now();
        
        if ('performance' in window && 'mark' in performance && 'measure' in performance) {
            performance.mark(`${label}-end`);
            performance.measure(label, `${label}-start`, `${label}-end`);
        }
        
        const duration = startTime ? endTime - startTime : 0;
        
        const metric = {
            label,
            duration,
            timestamp: Date.now()
        };
        
        this.metrics.parsing.push(metric);
        
        if (duration > this.thresholds.parsingTime) {
            this.recordWarning('Slow parsing detected', metric);
        }
        
        return metric;
    }

    measureQuestionRendering(questionNumber, renderFunction) {
        const startTime = performance.now();
        
        const result = renderFunction();
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        const metric = {
            type: 'question-rendering',
            questionNumber,
            duration,
            timestamp: Date.now()
        };
        
        this.metrics.rendering.push(metric);
        
        if (duration > this.thresholds.renderingTime) {
            this.recordWarning('Slow question rendering', metric);
        }
        
        return result;
    }

    measureFileLoading(filePath, loadFunction) {
        const startTime = performance.now();
        
        return loadFunction().then(result => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            const metric = {
                type: 'file-loading',
                filePath,
                duration,
                size: result ? result.length : 0,
                timestamp: Date.now()
            };
            
            this.metrics.parsing.push(metric);
            
            if (duration > this.thresholds.parsingTime) {
                this.recordWarning('Slow file loading', metric);
            }
            
            return result;
        }).catch(error => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.recordError('File loading failed', {
                filePath,
                duration,
                error: error.message
            });
            
            throw error;
        });
    }

    checkThresholds(metric) {
        const thresholdKey = this.getThresholdKey(metric.type);
        if (thresholdKey && metric.duration > this.thresholds[thresholdKey]) {
            this.recordWarning(`Performance threshold exceeded: ${metric.type}`, metric);
        }
    }

    getThresholdKey(metricType) {
        const mapping = {
            'parsing': 'parsingTime',
            'rendering': 'renderingTime',
            'interaction': 'interactionTime'
        };
        return mapping[metricType];
    }

    recordWarning(message, data = null) {
        const warning = {
            type: 'warning',
            message,
            data,
            timestamp: Date.now()
        };
        
        this.metrics.errors.push(warning);
        console.warn('⚠️ Performance Warning:', message, data);
        
        // Emit custom event for UI to handle
        document.dispatchEvent(new CustomEvent('performanceWarning', {
            detail: warning
        }));
    }

    recordError(message, data = null) {
        const error = {
            type: 'error',
            message,
            data,
            timestamp: Date.now()
        };
        
        this.metrics.errors.push(error);
        console.error('❌ Performance Error:', message, data);
        
        // Emit custom event for UI to handle
        document.dispatchEvent(new CustomEvent('performanceError', {
            detail: error
        }));
    }

    // Analysis and reporting methods
    getPerformanceReport() {
        const report = {
            summary: this.getSummaryStats(),
            parsing: this.getParsingStats(),
            rendering: this.getRenderingStats(),
            interactions: this.getInteractionStats(),
            memory: this.getMemoryStats(),
            recommendations: this.getRecommendations()
        };
        
        return report;
    }

    getSummaryStats() {
        const totalMetrics = Object.values(this.metrics).reduce((sum, arr) => sum + arr.length, 0);
        const errors = this.metrics.errors.filter(e => e.type === 'error').length;
        const warnings = this.metrics.errors.filter(e => e.type === 'warning').length;
        
        return {
            totalMetrics,
            errors,
            warnings,
            monitoringDuration: this.startTime ? Date.now() - this.startTime : 0
        };
    }

    getParsingStats() {
        const parsingMetrics = this.metrics.parsing;
        if (parsingMetrics.length === 0) return null;
        
        const durations = parsingMetrics.map(m => m.duration);
        return {
            count: parsingMetrics.length,
            averageDuration: this.average(durations),
            maxDuration: Math.max(...durations),
            minDuration: Math.min(...durations),
            slowOperations: parsingMetrics.filter(m => m.duration > this.thresholds.parsingTime)
        };
    }

    getRenderingStats() {
        const renderingMetrics = this.metrics.rendering;
        if (renderingMetrics.length === 0) return null;
        
        const durations = renderingMetrics.map(m => m.duration);
        return {
            count: renderingMetrics.length,
            averageDuration: this.average(durations),
            maxDuration: Math.max(...durations),
            minDuration: Math.min(...durations),
            slowRenders: renderingMetrics.filter(m => m.duration > this.thresholds.renderingTime)
        };
    }

    getInteractionStats() {
        const interactionMetrics = this.metrics.interactions;
        if (interactionMetrics.length === 0) return null;
        
        const durations = interactionMetrics.map(m => m.duration);
        const typeGroups = this.groupBy(interactionMetrics, 'type');
        
        return {
            count: interactionMetrics.length,
            averageDuration: this.average(durations),
            maxDuration: Math.max(...durations),
            byType: Object.keys(typeGroups).map(type => ({
                type,
                count: typeGroups[type].length,
                averageDuration: this.average(typeGroups[type].map(m => m.duration))
            })),
            slowInteractions: interactionMetrics.filter(m => m.duration > this.thresholds.interactionTime)
        };
    }

    getMemoryStats() {
        const memoryMetrics = this.metrics.memory;
        if (memoryMetrics.length === 0) return null;
        
        const latest = memoryMetrics[memoryMetrics.length - 1];
        const usedValues = memoryMetrics.map(m => m.used);
        
        return {
            current: {
                used: this.formatBytes(latest.used),
                total: this.formatBytes(latest.total),
                limit: this.formatBytes(latest.limit)
            },
            peak: this.formatBytes(Math.max(...usedValues)),
            average: this.formatBytes(this.average(usedValues)),
            trend: this.calculateMemoryTrend(memoryMetrics)
        };
    }

    getRecommendations() {
        const recommendations = [];
        
        // Parsing recommendations
        const parsingStats = this.getParsingStats();
        if (parsingStats && parsingStats.averageDuration > this.thresholds.parsingTime / 2) {
            recommendations.push({
                category: 'parsing',
                priority: 'high',
                message: 'Consider optimizing markdown parsing for large files',
                suggestion: 'Implement lazy loading or chunked parsing for better performance'
            });
        }
        
        // Memory recommendations
        const memoryStats = this.getMemoryStats();
        if (memoryStats && memoryStats.trend === 'increasing') {
            recommendations.push({
                category: 'memory',
                priority: 'medium',
                message: 'Memory usage is trending upward',
                suggestion: 'Check for memory leaks and implement cleanup routines'
            });
        }
        
        // Interaction recommendations
        const interactionStats = this.getInteractionStats();
        if (interactionStats && interactionStats.slowInteractions.length > 0) {
            recommendations.push({
                category: 'interactions',
                priority: 'medium',
                message: 'Some user interactions are slow',
                suggestion: 'Optimize event handlers and consider debouncing frequent events'
            });
        }
        
        return recommendations;
    }

    calculateMemoryTrend(memoryMetrics) {
        if (memoryMetrics.length < 10) return 'insufficient-data';
        
        const recent = memoryMetrics.slice(-10);
        const older = memoryMetrics.slice(-20, -10);
        
        const recentAvg = this.average(recent.map(m => m.used));
        const olderAvg = this.average(older.map(m => m.used));
        
        const change = (recentAvg - olderAvg) / olderAvg;
        
        if (change > 0.1) return 'increasing';
        if (change < -0.1) return 'decreasing';
        return 'stable';
    }

    // Utility methods
    average(numbers) {
        return numbers.length > 0 ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : 0;
    }

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Public API methods
    startMonitoring() {
        this.isMonitoring = true;
        this.startTime = Date.now();
        console.log('📊 Performance monitoring started');
    }

    stopMonitoring() {
        this.isMonitoring = false;
        console.log('📊 Performance monitoring stopped');
    }

    clearMetrics() {
        this.metrics = {
            parsing: [],
            rendering: [],
            interactions: [],
            memory: [],
            errors: []
        };
        console.log('🧹 Performance metrics cleared');
    }

    exportMetrics() {
        const report = this.getPerformanceReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-report-${new Date().toISOString().slice(0, 19)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('📄 Performance report exported');
    }
}

// Global performance monitor instance
window.performanceMonitor = new PerformanceMonitor();