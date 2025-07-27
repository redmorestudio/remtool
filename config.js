// RemTool Configuration
const RemToolConfig = {
    version: '1.0',
    
    // PDF processing limits
    limits: {
        maxPages: 50,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxIssuesPerPage: 100,
        maxProcessingTime: 300000 // 5 minutes
    },
    
    // AI service configuration
    ai: {
        maxRetries: 3,
        timeout: 30000, // 30 seconds
        batchSize: 5,
        defaultConfidence: 85
    },
    
    // UI configuration
    ui: {
        issuesPerPage: 50,
        animationDuration: 300,
        autoSaveInterval: 30000 // 30 seconds
    },
    
    // Accessibility checks configuration
    checks: {
        structural: {
            enabled: true,
            checks: [
                'document-title',
                'document-language',
                'tag-structure',
                'reading-order',
                'headings',
                'lists',
                'tables',
                'forms'
            ]
        },
        content: {
            enabled: true,
            checks: [
                'images',
                'links',
                'color-contrast',
                'text-spacing'
            ]
        }
    },
    
    // WCAG mapping
    wcagCriteria: {
        'missing-alt-text': '1.1.1',
        'missing-document-title': '2.4.2',
        'missing-language': '3.1.1',
        'heading-hierarchy': '1.3.1',
        'generic-link-text': '2.4.4',
        'missing-form-label': '3.3.2',
        'table-structure': '1.3.1',
        'untagged-content': '1.3.1',
        'reading-order': '1.3.2'
    },
    
    // Severity levels
    severityLevels: {
        error: {
            color: '#e74c3c',
            weight: 3,
            description: 'Must fix for accessibility'
        },
        warning: {
            color: '#f39c12',
            weight: 2,
            description: 'Should fix for better accessibility'
        },
        info: {
            color: '#3498db',
            weight: 1,
            description: 'Consider fixing for optimal accessibility'
        }
    },
    
    // Export options
    export: {
        includeMetadata: true,
        includeReport: true,
        reportFormat: 'pdf', // or 'html'
        complianceLevel: 'WCAG 2.1 AA'
    }
};

// Make config available globally
window.RemToolConfig = RemToolConfig;