/**
 * Responsive Tester - Tests and validates responsive behavior across different screen sizes
 * Provides automated testing for mobile, tablet, and desktop viewports
 */
class ResponsiveTester {
    constructor() {
        this.viewports = {
            mobile: [
                { name: 'iPhone SE', width: 375, height: 667 },
                { name: 'iPhone 12', width: 390, height: 844 },
                { name: 'Samsung Galaxy S21', width: 384, height: 854 },
                { name: 'iPhone 12 Pro Max', width: 428, height: 926 }
            ],
            tablet: [
                { name: 'iPad', width: 768, height: 1024 },
                { name: 'iPad Pro', width: 1024, height: 1366 },
                { name: 'Surface Pro', width: 912, height: 1368 },
                { name: 'Galaxy Tab', width: 800, height: 1280 }
            ],
            desktop: [
                { name: 'Small Desktop', width: 1366, height: 768 },
                { name: 'Medium Desktop', width: 1920, height: 1080 },
                { name: 'Large Desktop', width: 2560, height: 1440 },
                { name: 'Ultra Wide', width: 3440, height: 1440 }
            ]
        };
        
        this.testResults = [];
        this.currentTest = null;
        this.originalViewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        this.initializeResponsiveTesting();
    }

    initializeResponsiveTesting() {
        // Add responsive testing styles
        this.addResponsiveTestStyles();
        
        // Monitor viewport changes
        this.monitorViewportChanges();
        
        console.log('📱 Responsive tester initialized');
    }

    addResponsiveTestStyles() {
        if (!document.getElementById('responsive-test-styles')) {
            const style = document.createElement('style');
            style.id = 'responsive-test-styles';
            style.textContent = `
                .responsive-test-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .responsive-test-info {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    backdrop-filter: blur(10px);
                }
                
                .responsive-test-device {
                    font-size: 1.5em;
                    margin-bottom: 10px;
                }
                
                .responsive-test-dimensions {
                    font-size: 1.2em;
                    color: #3498db;
                }
                
                .responsive-test-progress {
                    margin-top: 15px;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 2px;
                    overflow: hidden;
                }
                
                .responsive-test-progress-bar {
                    height: 100%;
                    background: #3498db;
                    transition: width 0.3s ease;
                }
                
                .responsive-warning {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #f39c12;
                    color: white;
                    padding: 10px 15px;
                    border-radius: 4px;
                    z-index: 9999;
                    font-size: 0.9em;
                    max-width: 300px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }
                
                .responsive-success {
                    background: #27ae60;
                }
                
                .responsive-error {
                    background: #e74c3c;
                }
                
                @media (max-width: 768px) {
                    .responsive-warning {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    monitorViewportChanges() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.checkResponsiveBreakpoints();
            }, 250);
        });
        
        // Initial check
        this.checkResponsiveBreakpoints();
    }

    checkResponsiveBreakpoints() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        let deviceType = 'desktop';
        if (width <= 768) {
            deviceType = 'mobile';
        } else if (width <= 1024) {
            deviceType = 'tablet';
        }
        
        // Check for common responsive issues
        this.validateResponsiveLayout(deviceType, width, height);
    }

    validateResponsiveLayout(deviceType, width, height) {
        const issues = [];
        
        // Check for horizontal scrolling
        if (document.body.scrollWidth > width) {
            issues.push({
                type: 'horizontal-scroll',
                message: 'Horizontal scrolling detected',
                severity: 'warning'
            });
        }
        
        // Check for elements that might be too small on mobile
        if (deviceType === 'mobile') {
            const clickableElements = document.querySelectorAll('button, a, input, select');
            clickableElements.forEach(element => {
                const rect = element.getBoundingClientRect();
                if (rect.width < 44 || rect.height < 44) {
                    issues.push({
                        type: 'small-touch-target',
                        message: `Touch target too small: ${element.tagName}`,
                        element: element,
                        size: { width: rect.width, height: rect.height },
                        severity: 'warning'
                    });
                }
            });
        }
        
        // Check for text that might be too small
        const textElements = document.querySelectorAll('p, span, div, li');
        textElements.forEach(element => {
            const style = window.getComputedStyle(element);
            const fontSize = parseFloat(style.fontSize);
            
            if (deviceType === 'mobile' && fontSize < 14) {
                issues.push({
                    type: 'small-text',
                    message: 'Text might be too small on mobile',
                    element: element,
                    fontSize: fontSize,
                    severity: 'info'
                });
            }
        });
        
        // Log issues if any
        if (issues.length > 0) {
            console.warn(`📱 Responsive issues detected on ${deviceType} (${width}x${height}):`, issues);
        }
        
        return issues;
    }

    async runResponsiveTests() {
        this.testResults = [];
        const allViewports = [
            ...this.viewports.mobile,
            ...this.viewports.tablet,
            ...this.viewports.desktop
        ];
        
        console.log('🧪 Starting responsive tests across all viewports...');
        
        for (let i = 0; i < allViewports.length; i++) {
            const viewport = allViewports[i];
            await this.testViewport(viewport, i, allViewports.length);
        }
        
        // Restore original viewport
        this.restoreViewport();
        
        // Generate report
        const report = this.generateResponsiveReport();
        console.log('📊 Responsive testing complete:', report);
        
        return report;
    }

    async testViewport(viewport, index, total) {
        return new Promise((resolve) => {
            // Show test overlay
            this.showTestOverlay(viewport, index, total);
            
            // Simulate viewport change
            this.simulateViewport(viewport);
            
            // Wait for layout to settle
            setTimeout(() => {
                // Run tests for this viewport
                const testResult = this.runViewportTests(viewport);
                this.testResults.push(testResult);
                
                // Hide overlay and continue
                this.hideTestOverlay();
                
                setTimeout(resolve, 500); // Brief pause between tests
            }, 1000);
        });
    }

    simulateViewport(viewport) {
        // For testing purposes, we'll modify the viewport meta tag
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) {
            viewportMeta = document.createElement('meta');
            viewportMeta.name = 'viewport';
            document.head.appendChild(viewportMeta);
        }
        
        // Set viewport content to simulate device
        viewportMeta.content = `width=${viewport.width}, initial-scale=1.0`;
        
        // Trigger resize event
        window.dispatchEvent(new Event('resize'));
        
        console.log(`📱 Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
    }

    runViewportTests(viewport) {
        const startTime = performance.now();
        
        const testResult = {
            viewport: viewport,
            timestamp: Date.now(),
            tests: {}
        };
        
        // Test 1: Layout integrity
        testResult.tests.layoutIntegrity = this.testLayoutIntegrity();
        
        // Test 2: Navigation usability
        testResult.tests.navigationUsability = this.testNavigationUsability(viewport);
        
        // Test 3: Content readability
        testResult.tests.contentReadability = this.testContentReadability(viewport);
        
        // Test 4: Interactive elements
        testResult.tests.interactiveElements = this.testInteractiveElements(viewport);
        
        // Test 5: Performance on viewport
        testResult.tests.performance = this.testViewportPerformance();
        
        const endTime = performance.now();
        testResult.duration = endTime - startTime;
        
        return testResult;
    }

    testLayoutIntegrity() {
        const issues = [];
        
        // Check for overflow
        const body = document.body;
        if (body.scrollWidth > window.innerWidth) {
            issues.push('Horizontal overflow detected');
        }
        
        // Check for overlapping elements
        const elements = document.querySelectorAll('.screen.active *');
        const positions = [];
        
        elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                positions.push({ element, rect });
            }
        });
        
        // Simple overlap detection (could be more sophisticated)
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                if (this.rectsOverlap(positions[i].rect, positions[j].rect)) {
                    issues.push(`Potential element overlap detected`);
                    break;
                }
            }
        }
        
        return {
            passed: issues.length === 0,
            issues: issues
        };
    }

    testNavigationUsability(viewport) {
        const issues = [];
        const deviceType = this.getDeviceType(viewport.width);
        
        // Check navigation elements
        const navElements = document.querySelectorAll('nav, .navigation, button, a');
        
        navElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            
            // Check if element is visible
            if (rect.width === 0 || rect.height === 0) {
                issues.push(`Navigation element not visible: ${element.tagName}`);
                return;
            }
            
            // Check touch target size on mobile
            if (deviceType === 'mobile') {
                if (rect.width < 44 || rect.height < 44) {
                    issues.push(`Touch target too small: ${element.tagName} (${rect.width}x${rect.height})`);
                }
            }
            
            // Check if element is accessible
            if (rect.top < 0 || rect.left < 0 || rect.right > viewport.width || rect.bottom > viewport.height) {
                issues.push(`Navigation element outside viewport: ${element.tagName}`);
            }
        });
        
        return {
            passed: issues.length === 0,
            issues: issues
        };
    }

    testContentReadability(viewport) {
        const issues = [];
        const deviceType = this.getDeviceType(viewport.width);
        
        // Check text elements
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
        
        textElements.forEach(element => {
            const style = window.getComputedStyle(element);
            const fontSize = parseFloat(style.fontSize);
            const lineHeight = parseFloat(style.lineHeight);
            
            // Check minimum font size
            const minFontSize = deviceType === 'mobile' ? 14 : 12;
            if (fontSize < minFontSize) {
                issues.push(`Text too small: ${fontSize}px (minimum: ${minFontSize}px)`);
            }
            
            // Check line height
            if (lineHeight && lineHeight < fontSize * 1.2) {
                issues.push(`Line height too small: ${lineHeight}px for ${fontSize}px text`);
            }
            
            // Check text contrast (simplified)
            const color = style.color;
            const backgroundColor = style.backgroundColor;
            if (color === backgroundColor) {
                issues.push('Poor text contrast detected');
            }
        });
        
        return {
            passed: issues.length === 0,
            issues: issues
        };
    }

    testInteractiveElements(viewport) {
        const issues = [];
        const deviceType = this.getDeviceType(viewport.width);
        
        // Test form elements
        const formElements = document.querySelectorAll('input, select, textarea, button');
        
        formElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            
            // Check visibility
            if (rect.width === 0 || rect.height === 0) {
                issues.push(`Interactive element not visible: ${element.tagName}`);
                return;
            }
            
            // Check size on mobile
            if (deviceType === 'mobile') {
                if (rect.height < 44) {
                    issues.push(`Interactive element too small for touch: ${element.tagName}`);
                }
            }
            
            // Check spacing between interactive elements
            const nearbyElements = this.findNearbyInteractiveElements(element, formElements);
            nearbyElements.forEach(nearby => {
                const distance = this.calculateDistance(rect, nearby.getBoundingClientRect());
                if (deviceType === 'mobile' && distance < 8) {
                    issues.push('Interactive elements too close together');
                }
            });
        });
        
        return {
            passed: issues.length === 0,
            issues: issues
        };
    }

    testViewportPerformance() {
        const startTime = performance.now();
        
        // Trigger a layout recalculation
        document.body.offsetHeight;
        
        // Measure rendering time
        const renderTime = performance.now() - startTime;
        
        // Check for performance issues
        const issues = [];
        if (renderTime > 16) { // 60fps threshold
            issues.push(`Slow rendering: ${renderTime.toFixed(2)}ms`);
        }
        
        return {
            passed: renderTime <= 16,
            renderTime: renderTime,
            issues: issues
        };
    }

    showTestOverlay(viewport, index, total) {
        const overlay = document.createElement('div');
        overlay.className = 'responsive-test-overlay';
        overlay.id = 'responsive-test-overlay';
        
        const progress = ((index + 1) / total) * 100;
        
        overlay.innerHTML = `
            <div class="responsive-test-info">
                <div class="responsive-test-device">${viewport.name}</div>
                <div class="responsive-test-dimensions">${viewport.width} × ${viewport.height}</div>
                <div class="responsive-test-progress">
                    <div class="responsive-test-progress-bar" style="width: ${progress}%"></div>
                </div>
                <div style="margin-top: 10px; font-size: 0.9em;">
                    Testing ${index + 1} of ${total}
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    hideTestOverlay() {
        const overlay = document.getElementById('responsive-test-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    restoreViewport() {
        // Restore original viewport
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
            viewportMeta.content = 'width=device-width, initial-scale=1.0';
        }
        
        window.dispatchEvent(new Event('resize'));
    }

    generateResponsiveReport() {
        const report = {
            summary: {
                totalTests: this.testResults.length,
                passedViewports: 0,
                failedViewports: 0,
                totalIssues: 0
            },
            byDeviceType: {
                mobile: { tests: [], issues: [] },
                tablet: { tests: [], issues: [] },
                desktop: { tests: [], issues: [] }
            },
            recommendations: []
        };
        
        // Analyze results
        this.testResults.forEach(result => {
            const deviceType = this.getDeviceType(result.viewport.width);
            const viewportPassed = Object.values(result.tests).every(test => test.passed);
            
            if (viewportPassed) {
                report.summary.passedViewports++;
            } else {
                report.summary.failedViewports++;
            }
            
            // Collect issues by device type
            Object.values(result.tests).forEach(test => {
                if (test.issues) {
                    report.summary.totalIssues += test.issues.length;
                    report.byDeviceType[deviceType].issues.push(...test.issues);
                }
            });
            
            report.byDeviceType[deviceType].tests.push(result);
        });
        
        // Generate recommendations
        report.recommendations = this.generateRecommendations(report);
        
        return report;
    }

    generateRecommendations(report) {
        const recommendations = [];
        
        // Check for common mobile issues
        const mobileIssues = report.byDeviceType.mobile.issues;
        if (mobileIssues.some(issue => issue.includes('Touch target too small'))) {
            recommendations.push({
                priority: 'high',
                category: 'mobile',
                issue: 'Small touch targets',
                solution: 'Increase button and link sizes to at least 44x44px for better mobile usability'
            });
        }
        
        if (mobileIssues.some(issue => issue.includes('Text too small'))) {
            recommendations.push({
                priority: 'medium',
                category: 'mobile',
                issue: 'Small text',
                solution: 'Increase font sizes to at least 14px on mobile devices'
            });
        }
        
        // Check for layout issues
        const layoutIssues = Object.values(report.byDeviceType).flatMap(device => device.issues);
        if (layoutIssues.some(issue => issue.includes('overflow'))) {
            recommendations.push({
                priority: 'high',
                category: 'layout',
                issue: 'Content overflow',
                solution: 'Implement proper responsive design with flexible layouts and media queries'
            });
        }
        
        // Performance recommendations
        if (report.summary.totalIssues > 10) {
            recommendations.push({
                priority: 'medium',
                category: 'performance',
                issue: 'Multiple responsive issues',
                solution: 'Consider a comprehensive responsive design review and testing strategy'
            });
        }
        
        return recommendations;
    }

    // Utility methods
    getDeviceType(width) {
        if (width <= 768) return 'mobile';
        if (width <= 1024) return 'tablet';
        return 'desktop';
    }

    rectsOverlap(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect2.right < rect1.left || 
                rect1.bottom < rect2.top || 
                rect2.bottom < rect1.top);
    }

    findNearbyInteractiveElements(element, allElements) {
        const rect = element.getBoundingClientRect();
        const nearby = [];
        
        allElements.forEach(other => {
            if (other !== element) {
                const otherRect = other.getBoundingClientRect();
                const distance = this.calculateDistance(rect, otherRect);
                if (distance < 50) { // Within 50px
                    nearby.push(other);
                }
            }
        });
        
        return nearby;
    }

    calculateDistance(rect1, rect2) {
        const centerX1 = rect1.left + rect1.width / 2;
        const centerY1 = rect1.top + rect1.height / 2;
        const centerX2 = rect2.left + rect2.width / 2;
        const centerY2 = rect2.top + rect2.height / 2;
        
        return Math.sqrt(Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2));
    }

    // Public API
    showResponsiveWarning(message, type = 'warning') {
        const warning = document.createElement('div');
        warning.className = `responsive-warning responsive-${type}`;
        warning.textContent = message;
        
        document.body.appendChild(warning);
        
        setTimeout(() => {
            if (warning.parentNode) {
                warning.parentNode.removeChild(warning);
            }
        }, 5000);
    }

    exportResponsiveReport() {
        const report = this.generateResponsiveReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `responsive-report-${new Date().toISOString().slice(0, 19)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('📱 Responsive report exported');
    }
}

// Global responsive tester instance
window.responsiveTester = new ResponsiveTester();