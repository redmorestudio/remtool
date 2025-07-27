// Enhanced RemTool Features - Adding AI detection, forms analysis, and document scoring

// Extend the PDFAnalyzer with AI-powered detection
class EnhancedPDFAnalyzer extends PDFAnalyzer {
    constructor() {
        super();
        this.documentScore = 0;
        this.scoreBreakdown = {};
    }
    
    // Enhanced analysis with AI backup
    async analyzeWithAI(pdf, aiService) {
        const structuralIssues = await this.analyzeStructure(pdf);
        const contentIssues = await this.analyzeContent(pdf);
        const formIssues = await this.analyzeForms(pdf);
        
        // Combine all issues
        let allIssues = [...structuralIssues, ...contentIssues, ...formIssues];
        
        // Use AI to detect additional issues if API key is available
        if (aiService && aiService.hasActiveService()) {
            const aiIssues = await this.detectWithAI(pdf, aiService);
            allIssues = this.mergeIssues(allIssues, aiIssues);
        }
        
        // Calculate document accessibility score
        this.calculateDocumentScore(allIssues, pdf.numPages);
        
        return {
            issues: allIssues,
            score: this.documentScore,
            scoreBreakdown: this.scoreBreakdown
        };
    }
    
    // Analyze forms for JavaScript and accessibility issues
    async analyzeForms(pdf) {
        const issues = [];
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const annotations = await page.getAnnotations();
            
            for (const annotation of annotations) {
                if (annotation.subtype === 'Widget') {
                    // Check form field
                    const fieldIssues = await this.analyzeFormField(annotation, pageNum);
                    issues.push(...fieldIssues);
                    
                    // Check for JavaScript
                    if (annotation.actions) {
                        const jsIssues = this.analyzeFormJavaScript(annotation, pageNum);
                        issues.push(...jsIssues);
                    }
                }
            }
        }
        
        return issues;
    }
    
    analyzeFormField(field, pageNum) {
        const issues = [];
        
        // Check for missing labels
        if (!field.fieldName || field.fieldName.trim() === '') {
            issues.push({
                type: 'missing-form-label',
                severity: 'error',
                page: pageNum,
                message: 'Form field missing accessible label',
                bounds: field.rect,
                wcag: '3.3.2',
                fieldType: field.fieldType,
                recommendation: 'Add a descriptive label to this form field'
            });
        }
        
        // Check for missing instructions
        if (!field.alternativeText && this.needsInstructions(field)) {
            issues.push({
                type: 'missing-form-instructions',
                severity: 'warning',
                page: pageNum,
                message: 'Complex form field missing instructions',
                bounds: field.rect,
                wcag: '3.3.2'
            });
        }
        
        // Check tab order
        if (field.tabOrder === undefined || field.tabOrder < 0) {
            issues.push({
                type: 'form-tab-order',
                severity: 'warning',
                page: pageNum,
                message: 'Form field not in tab order',
                bounds: field.rect,
                wcag: '2.1.1'
            });
        }
        
        return issues;
    }
    
    analyzeFormJavaScript(field, pageNum) {
        const issues = [];
        const actions = field.actions;
        
        // Check for problematic JavaScript patterns
        if (actions) {
            // Mouse-only events
            if ((actions.onMouseDown || actions.onMouseUp) && !actions.onKeyDown) {
                issues.push({
                    type: 'form-javascript-mouse-only',
                    severity: 'error',
                    page: pageNum,
                    message: 'Form uses mouse-only JavaScript events',
                    bounds: field.rect,
                    wcag: '2.1.1',
                    recommendation: 'Add keyboard event handlers (onKeyDown/onKeyUp) to match mouse events'
                });
            }
            
            // Validation that might block screen readers
            if (actions.onBlur && this.hasValidationCode(actions.onBlur)) {
                issues.push({
                    type: 'form-javascript-validation',
                    severity: 'warning',
                    page: pageNum,
                    message: 'Form validation may interfere with assistive technology',
                    bounds: field.rect,
                    wcag: '3.3.1',
                    recommendation: 'Ensure validation messages are announced to screen readers'
                });
            }
            
            // Auto-submit or time limits
            if (this.hasAutoSubmit(actions) || this.hasTimeLimit(actions)) {
                issues.push({
                    type: 'form-javascript-timing',
                    severity: 'error',
                    page: pageNum,
                    message: 'Form has automatic submission or time limits',
                    bounds: field.rect,
                    wcag: '2.2.1',
                    recommendation: 'Remove auto-submit or provide user control over timing'
                });
            }
        }
        
        return issues;
    }
    
    // AI-powered issue detection
    async detectWithAI(pdf, aiService) {
        const aiIssues = [];
        
        try {
            // Sample pages for AI analysis (to manage API costs)
            const pagesToAnalyze = this.selectPagesForAI(pdf.numPages);
            
            for (const pageNum of pagesToAnalyze) {
                const page = await pdf.getPage(pageNum);
                const pageImage = await this.renderPageToImage(page);
                const textContent = await page.getTextContent();
                
                // Send to AI for analysis
                const prompt = this.buildAIPrompt(pageImage, textContent, pageNum);
                const aiResponse = await aiService.analyze(prompt);
                
                // Parse AI response into issues
                const pageIssues = this.parseAIResponse(aiResponse, pageNum);
                aiIssues.push(...pageIssues);
            }
        } catch (error) {
            console.error('AI analysis error:', error);
        }
        
        return aiIssues;
    }
    
    // Calculate accessibility score
    calculateDocumentScore(issues, numPages) {
        const maxScore = 100;
        let deductions = 0;
        
        // Group issues by type and severity
        const issueGroups = {};
        issues.forEach(issue => {
            const key = `${issue.type}-${issue.severity}`;
            issueGroups[key] = (issueGroups[key] || 0) + 1;
        });
        
        // Calculate deductions
        Object.entries(issueGroups).forEach(([key, count]) => {
            const [type, severity] = key.split('-');
            const weight = this.getIssueWeight(type, severity);
            deductions += weight * Math.min(count, 5); // Cap impact per issue type
        });
        
        // Factor in document size
        const sizeFactor = Math.min(numPages / 10, 2); // Larger documents get slight leniency
        deductions = deductions / sizeFactor;
        
        // Calculate final score
        this.documentScore = Math.max(0, Math.round(maxScore - deductions));
        
        // Calculate breakdown
        this.scoreBreakdown = {
            structural: this.calculateCategoryScore(issues, 'structural'),
            content: this.calculateCategoryScore(issues, 'content'),
            forms: this.calculateCategoryScore(issues, 'forms'),
            overall: this.documentScore,
            grade: this.getGrade(this.documentScore)
        };
    }
    
    getIssueWeight(type, severity) {
        const weights = {
            'error': 5,
            'warning': 2,
            'info': 0.5
        };
        
        // Critical issues get extra weight
        const criticalTypes = ['missing-alt-text', 'missing-form-label', 'form-javascript-mouse-only'];
        if (criticalTypes.includes(type)) {
            return weights[severity] * 1.5;
        }
        
        return weights[severity] || 1;
    }
    
    getGrade(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }
    
    // Helper methods
    needsInstructions(field) {
        return ['combobox', 'listbox', 'radiobutton'].includes(field.fieldType);
    }
    
    hasValidationCode(code) {
        return code && (code.includes('alert') || code.includes('error') || code.includes('invalid'));
    }
    
    hasAutoSubmit(actions) {
        return actions && Object.values(actions).some(code => 
            code && code.includes('submit')
        );
    }
    
    hasTimeLimit(actions) {
        return actions && Object.values(actions).some(code => 
            code && (code.includes('setTimeout') || code.includes('setInterval'))
        );
    }
    
    selectPagesForAI(numPages) {
        // Sample up to 5 pages: first, last, and 3 evenly distributed
        if (numPages <= 5) {
            return Array.from({length: numPages}, (_, i) => i + 1);
        }
        
        const pages = [1, numPages];
        const step = Math.floor(numPages / 4);
        for (let i = step; i < numPages; i += step) {
            if (!pages.includes(i)) {
                pages.push(i);
            }
        }
        
        return pages.slice(0, 5).sort((a, b) => a - b);
    }
    
    async renderPageToImage(page) {
        // Render page to canvas for AI analysis
        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        return canvas.toDataURL('image/png');
    }
    
    buildAIPrompt(pageImage, textContent, pageNum) {
        const text = textContent.items.map(item => item.str).join(' ');
        
        return {
            image: pageImage,
            text: text,
            prompt: `Analyze this PDF page (${pageNum}) for accessibility issues. Look for:
            1. Images without alt text
            2. Poor color contrast
            3. Unclear heading structure
            4. Inaccessible tables or charts
            5. Form fields without labels
            6. Text that may be hard to read
            7. Any other WCAG 2.1 AA violations
            
            Return specific issues with locations and recommendations.`
        };
    }
    
    parseAIResponse(response, pageNum) {
        // Parse AI response into structured issues
        const issues = [];
        
        try {
            if (response.issues && Array.isArray(response.issues)) {
                response.issues.forEach(aiIssue => {
                    issues.push({
                        type: aiIssue.type || 'ai-detected-issue',
                        severity: aiIssue.severity || 'warning',
                        page: pageNum,
                        message: aiIssue.description,
                        bounds: aiIssue.location,
                        wcag: aiIssue.wcag || '1.3.1',
                        aiDetected: true,
                        confidence: aiIssue.confidence || 75,
                        recommendation: aiIssue.recommendation
                    });
                });
            }
        } catch (error) {
            console.error('Error parsing AI response:', error);
        }
        
        return issues;
    }
    
    mergeIssues(existingIssues, aiIssues) {
        // Merge AI-detected issues with existing ones, avoiding duplicates
        const merged = [...existingIssues];
        
        aiIssues.forEach(aiIssue => {
            const duplicate = existingIssues.find(existing => 
                existing.page === aiIssue.page &&
                existing.type === aiIssue.type &&
                this.boundsOverlap(existing.bounds, aiIssue.bounds)
            );
            
            if (!duplicate) {
                merged.push(aiIssue);
            }
        });
        
        return merged;
    }
    
    boundsOverlap(bounds1, bounds2) {
        if (!bounds1 || !bounds2) return false;
        
        return !(bounds1.x + bounds1.width < bounds2.x || 
                bounds2.x + bounds2.width < bounds1.x || 
                bounds1.y + bounds1.height < bounds2.y || 
                bounds2.y + bounds2.height < bounds1.y);
    }
    
    calculateCategoryScore(issues, category) {
        const categoryIssues = issues.filter(issue => 
            this.getIssueCategory(issue.type) === category
        );
        
        if (categoryIssues.length === 0) return 100;
        
        let deductions = 0;
        categoryIssues.forEach(issue => {
            deductions += this.getIssueWeight(issue.type, issue.severity);
        });
        
        return Math.max(0, Math.round(100 - deductions));
    }
    
    getIssueCategory(type) {
        const categories = {
            'missing-document-title': 'structural',
            'missing-language': 'structural',
            'untagged-content': 'structural',
            'heading-hierarchy': 'structural',
            'reading-order': 'structural',
            'missing-alt-text': 'content',
            'generic-link-text': 'content',
            'color-contrast': 'content',
            'missing-form-label': 'forms',
            'form-javascript-mouse-only': 'forms',
            'form-javascript-validation': 'forms',
            'form-javascript-timing': 'forms',
            'form-tab-order': 'forms'
        };
        
        return categories[type] || 'other';
    }
}

// Export the enhanced analyzer
window.EnhancedPDFAnalyzer = EnhancedPDFAnalyzer;