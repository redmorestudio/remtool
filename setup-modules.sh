#!/bin/bash

# Continue creating module files

cd ~/remtool

# Continue ai-services.js
cat >> modules/ai-services.js << 'EOF'
                        content: 'You are an expert in PDF accessibility and WCAG compliance. Provide specific, actionable suggestions for accessibility issues.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 150,
                temperature: 0.3
            })
        });
        
        if (!response.ok) {
            throw new Error(`Grok API error: ${response.status}`);
        }
        
        const data = await response.json();
        return this.parseAIResponse(data.choices[0].message.content);
    }
    
    async callGemini(issue) {
        const prompt = this.buildPrompt(issue);
        
        const requestBody = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 150
            }
        };
        
        // Add image if available for alt text issues
        if (issue.type === 'missing-alt-text' && issue.imageData) {
            requestBody.contents[0].parts.push({
                inlineData: {
                    mimeType: 'image/png',
                    data: issue.imageData
                }
            });
        }
        
        const response = await fetch(
            `${this.services.gemini.endpoint}/models/${this.services.gemini.model}:generateContent?key=${this.services.gemini.key}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            }
        );
        
        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }
        
        const data = await response.json();
        return this.parseAIResponse(data.candidates[0].content.parts[0].text);
    }
    
    async callSonnet(issue) {
        const prompt = this.buildPrompt(issue);
        
        const response = await fetch(`${this.services.sonnet.endpoint}/messages`, {
            method: 'POST',
            headers: {
                'x-api-key': this.services.sonnet.key,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.services.sonnet.model,
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                max_tokens: 150,
                temperature: 0.3
            })
        });
        
        if (!response.ok) {
            throw new Error(`Sonnet API error: ${response.status}`);
        }
        
        const data = await response.json();
        return this.parseAIResponse(data.content[0].text);
    }
    
    buildPrompt(issue) {
        const prompts = {
            'missing-alt-text': `Provide a concise, descriptive alternative text for an image in a PDF document. The alt text should convey the essential information or function of the image. Context: ${issue.context || 'General document'}. Keep it under 125 characters.`,
            
            'generic-link-text': `The link text "${issue.currentText}" is not descriptive. The link points to: ${issue.url || 'unknown destination'}. Provide better link text that describes the destination or purpose. Keep it concise and meaningful.`,
            
            'table-structure': `A table lacks proper header structure. Suggest appropriate column headers that would make the table accessible. Context: ${issue.context || 'Data table in document'}`,
            
            'missing-form-label': `A ${issue.fieldType || 'form field'} lacks an accessible label. Provide a clear, descriptive label that explains the field's purpose.`,
            
            'heading-hierarchy': `Heading hierarchy issue: ${issue.message}. Current heading: "${issue.headingText}". Suggest how to fix this issue.`
        };
        
        return prompts[issue.type] || `Accessibility issue: ${issue.message}. Provide a specific suggestion to fix this issue according to WCAG guidelines.`;
    }
    
    parseAIResponse(response) {
        // Try to extract structured response
        const lines = response.split('\n').filter(l => l.trim());
        
        let suggestion = response;
        let confidence = 85;
        let reasoning = '';
        
        // Look for structured format
        lines.forEach(line => {
            if (line.toLowerCase().startsWith('suggestion:')) {
                suggestion = line.substring(11).trim();
            } else if (line.toLowerCase().startsWith('confidence:')) {
                const conf = parseInt(line.substring(11));
                if (!isNaN(conf)) confidence = conf;
            } else if (line.toLowerCase().startsWith('reasoning:')) {
                reasoning = line.substring(10).trim();
            }
        });
        
        // Clean up suggestion
        suggestion = suggestion
            .replace(/^["']|["']$/g, '') // Remove quotes
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        
        return {
            suggestion,
            confidence,
            reasoning
        };
    }
    
    getRuleBasedSuggestion(issue) {
        const suggestions = {
            'missing-alt-text': {
                suggestion: 'Descriptive image of [describe main subject and purpose]',
                confidence: 50,
                reasoning: 'Generic template - AI enhancement unavailable'
            },
            'generic-link-text': {
                suggestion: issue.url ? `Visit ${new URL(issue.url).hostname}` : 'Learn more about [topic]',
                confidence: 60,
                reasoning: 'Based on URL structure'
            },
            'missing-form-label': {
                suggestion: 'Enter your [field purpose]',
                confidence: 50,
                reasoning: 'Generic template based on field type'
            },
            'table-structure': {
                suggestion: 'Add descriptive column headers',
                confidence: 40,
                reasoning: 'Requires manual review'
            },
            'heading-hierarchy': {
                suggestion: 'Adjust heading level to maintain proper hierarchy',
                confidence: 70,
                reasoning: 'Standard WCAG requirement'
            }
        };
        
        return suggestions[issue.type] || {
            suggestion: 'Manual review required',
            confidence: 30,
            reasoning: 'No automated suggestion available'
        };
    }
}
EOF

# Create remediation-ui.js
cat > modules/remediation-ui.js << 'EOF'
// Remediation UI components
class RemediationUI {
    static create(issue, app) {
        const container = document.createElement('div');
        container.className = 'remediation-container';
        
        switch (issue.type) {
            case 'missing-alt-text':
                return this.createAltTextUI(issue, app, container);
            case 'generic-link-text':
                return this.createLinkTextUI(issue, app, container);
            case 'missing-form-label':
                return this.createFormLabelUI(issue, app, container);
            case 'heading-hierarchy':
                return this.createHeadingUI(issue, app, container);
            case 'table-structure':
                return this.createTableUI(issue, app, container);
            default:
                return this.createGenericUI(issue, app, container);
        }
    }
    
    static createAltTextUI(issue, app, container) {
        container.innerHTML = `
            <h3>Add Alternative Text</h3>
            <div class="remediation-field">
                <label for="alt-text-input">Alternative text for image:</label>
                <textarea 
                    id="alt-text-input" 
                    class="remediation-input"
                    rows="3"
                    maxlength="125"
                    placeholder="Describe the image content or function"
                >${issue.suggestion || ''}</textarea>
                <div class="char-count">
                    <span id="char-current">0</span>/125 characters
                </div>
            </div>
            
            ${issue.suggestion ? `
                <div class="ai-suggestion-info">
                    <span class="ai-badge">${issue.aiService || 'AI'}</span>
                    <span class="confidence">Confidence: ${issue.confidence}%</span>
                </div>
            ` : ''}
            
            <div class="remediation-tips">
                <h4>Tips for good alt text:</h4>
                <ul>
                    <li>Be concise but descriptive</li>
                    <li>Convey the same information as the image</li>
                    <li>Don't start with "Image of" or "Picture of"</li>
                    <li>Include text that appears in the image</li>
                </ul>
            </div>
            
            <div class="remediation-actions">
                <button class="btn-primary" onclick="app.applyRemediation('${issue.id}')">
                    Apply
                </button>
                <button class="btn-secondary" onclick="app.skipIssue('${issue.id}')">
                    Skip
                </button>
            </div>
        `;
        
        // Add character counter
        const textarea = container.querySelector('#alt-text-input');
        const charCount = container.querySelector('#char-current');
        
        const updateCharCount = () => {
            charCount.textContent = textarea.value.length;
            charCount.style.color = textarea.value.length > 125 ? '#e74c3c' : '#666';
        };
        
        textarea.addEventListener('input', updateCharCount);
        updateCharCount();
        
        // Focus input
        setTimeout(() => textarea.focus(), 100);
        
        return container;
    }
    
    static createLinkTextUI(issue, app, container) {
        container.innerHTML = `
            <h3>Improve Link Text</h3>
            <div class="remediation-field">
                <label>Current link text:</label>
                <div class="current-value">"${issue.currentText}"</div>
            </div>
            
            <div class="remediation-field">
                <label>Link destination:</label>
                <div class="link-destination">${issue.url || 'Unknown'}</div>
            </div>
            
            <div class="remediation-field">
                <label for="link-text-input">New link text:</label>
                <input 
                    type="text" 
                    id="link-text-input" 
                    class="remediation-input"
                    value="${issue.suggestion || ''}"
                    placeholder="Descriptive link text"
                />
            </div>
            
            ${issue.suggestion ? `
                <div class="ai-suggestion-info">
                    <span class="ai-badge">${issue.aiService || 'AI'}</span>
                    <span class="confidence">Confidence: ${issue.confidence}%</span>
                </div>
            ` : ''}
            
            <div class="remediation-tips">
                <h4>Good link text should:</h4>
                <ul>
                    <li>Make sense out of context</li>
                    <li>Describe the link destination</li>
                    <li>Be concise but meaningful</li>
                    <li>Avoid "click here" or "read more"</li>
                </ul>
            </div>
            
            <div class="remediation-actions">
                <button class="btn-primary" onclick="app.applyRemediation('${issue.id}')">
                    Apply
                </button>
                <button class="btn-secondary" onclick="app.skipIssue('${issue.id}')">
                    Skip
                </button>
            </div>
        `;
        
        // Focus input
        setTimeout(() => {
            const input = container.querySelector('#link-text-input');
            input.focus();
            input.select();
        }, 100);
        
        return container;
    }
    
    static createFormLabelUI(issue, app, container) {
        container.innerHTML = `
            <h3>Add Form Field Label</h3>
            <div class="remediation-field">
                <label>Field type:</label>
                <div class="field-type">${issue.fieldType || 'Unknown'}</div>
            </div>
            
            <div class="remediation-field">
                <label for="label-input">Field label:</label>
                <input 
                    type="text" 
                    id="label-input" 
                    class="remediation-input"
                    value="${issue.suggestion || ''}"
                    placeholder="Enter descriptive label"
                />
            </div>
            
            ${issue.suggestion ? `
                <div class="ai-suggestion-info">
                    <span class="ai-badge">${issue.aiService || 'AI'}</span>
                    <span class="confidence">Confidence: ${issue.confidence}%</span>
                </div>
            ` : ''}
            
            <div class="remediation-tips">
                <h4>Label best practices:</h4>
                <ul>
                    <li>Clearly identify the field's purpose</li>
                    <li>Include format hints if needed (e.g., MM/DD/YYYY)</li>
                    <li>Indicate required fields</li>
                    <li>Be concise but complete</li>
                </ul>
            </div>
            
            <div class="remediation-actions">
                <button class="btn-primary" onclick="app.applyRemediation('${issue.id}')">
                    Apply
                </button>
                <button class="btn-secondary" onclick="app.skipIssue('${issue.id}')">
                    Skip
                </button>
            </div>
        `;
        
        setTimeout(() => {
            container.querySelector('#label-input').focus();
        }, 100);
        
        return container;
    }
    
    static createHeadingUI(issue, app, container) {
        container.innerHTML = `
            <h3>Fix Heading Hierarchy</h3>
            <div class="remediation-field">
                <label>Issue:</label>
                <div class="issue-description">${issue.message}</div>
            </div>
            
            <div class="remediation-field">
                <label>Current heading:</label>
                <div class="current-heading">"${issue.headingText}"</div>
            </div>
            
            <div class="remediation-field">
                <label for="heading-level">Correct heading level:</label>
                <select id="heading-level" class="remediation-input">
                    <option value="1">H1 - Main title</option>
                    <option value="2">H2 - Major section</option>
                    <option value="3">H3 - Subsection</option>
                    <option value="4">H4 - Sub-subsection</option>
                    <option value="5">H5 - Minor heading</option>
                    <option value="6">H6 - Least important</option>
                </select>
            </div>
            
            <div class="remediation-tips">
                <h4>Heading hierarchy rules:</h4>
                <ul>
                    <li>Don't skip heading levels</li>
                    <li>Use only one H1 per page</li>
                    <li>Nest headings logically</li>
                    <li>Use headings to create document outline</li>
                </ul>
            </div>
            
            <div class="remediation-actions">
                <button class="btn-primary" onclick="app.applyRemediation('${issue.id}')">
                    Apply
                </button>
                <button class="btn-secondary" onclick="app.skipIssue('${issue.id}')">
                    Skip
                </button>
            </div>
        `;
        
        return container;
    }
    
    static createTableUI(issue, app, container) {
        container.innerHTML = `
            <h3>Add Table Headers</h3>
            <div class="remediation-field">
                <label>Table needs proper header structure</label>
                <div class="table-info">
                    Row count: ${issue.rowCount || 'Unknown'}
                </div>
            </div>
            
            <div class="remediation-field">
                <label>Table headers (comma-separated):</label>
                <input 
                    type="text" 
                    id="headers-input" 
                    class="remediation-input"
                    value="${issue.suggestion || ''}"
                    placeholder="Column 1, Column 2, Column 3"
                />
            </div>
            
            <div class="remediation-field">
                <label for="header-scope">Header scope:</label>
                <select id="header-scope" class="remediation-input">
                    <option value="col">Column headers</option>
                    <option value="row">Row headers</option>
                    <option value="both">Both column and row headers</option>
                </select>
            </div>
            
            <div class="remediation-tips">
                <h4>Table accessibility:</h4>
                <ul>
                    <li>All data tables need headers</li>
                    <li>Use scope to associate headers with data</li>
                    <li>Keep headers concise but descriptive</li>
                    <li>Consider adding a table caption</li>
                </ul>
            </div>
            
            <div class="remediation-actions">
                <button class="btn-primary" onclick="app.applyRemediation('${issue.id}')">
                    Apply
                </button>
                <button class="btn-secondary" onclick="app.skipIssue('${issue.id}')">
                    Skip
                </button>
            </div>
        `;
        
        return container;
    }
    
    static createGenericUI(issue, app, container) {
        container.innerHTML = `
            <h3>Fix Accessibility Issue</h3>
            <div class="remediation-field">
                <label>Issue type:</label>
                <div class="issue-type">${app.formatIssueType(issue.type)}</div>
            </div>
            
            <div class="remediation-field">
                <label>Description:</label>
                <div class="issue-description">${issue.message}</div>
            </div>
            
            <div class="remediation-field">
                <label>WCAG criterion:</label>
                <div class="wcag-ref">${issue.wcag || 'N/A'}</div>
            </div>
            
            <div class="remediation-field">
                <label for="fix-input">Your fix:</label>
                <textarea 
                    id="fix-input" 
                    class="remediation-input"
                    rows="3"
                    placeholder="Describe how you fixed this issue"
                >${issue.suggestion || ''}</textarea>
            </div>
            
            <div class="remediation-actions">
                <button class="btn-primary" onclick="app.applyRemediation('${issue.id}')">
                    Mark as Fixed
                </button>
                <button class="btn-secondary" onclick="app.skipIssue('${issue.id}')">
                    Skip
                </button>
                <button class="btn-secondary" onclick="app.flagIssue('${issue.id}')">
                    Flag for Review
                </button>
            </div>
        `;
        
        return container;
    }
}

// Add applyRemediation method to app
RemTool.prototype.applyRemediation = function(issueId) {
    const issue = this.state.getIssue(issueId);
    if (!issue) return;
    
    let value = '';
    
    switch (issue.type) {
        case 'missing-alt-text':
            value = document.getElementById('alt-text-input').value.trim();
            break;
        case 'generic-link-text':
            value = document.getElementById('link-text-input').value.trim();
            break;
        case 'missing-form-label':
            value = document.getElementById('label-input').value.trim();
            break;
        case 'heading-hierarchy':
            value = document.getElementById('heading-level').value;
            break;
        case 'table-structure':
            value = {
                headers: document.getElementById('headers-input').value.trim(),
                scope: document.getElementById('header-scope').value
            };
            break;
        default:
            value = document.getElementById('fix-input')?.value.trim() || '';
    }
    
    if (!value || (typeof value === 'string' && value.length === 0)) {
        alert('Please provide a value before applying.');
        return;
    }
    
    issue.status = 'modified';
    issue.finalValue = value;
    
    this.state.addRemediation({
        issueId: issueId,
        type: issue.type,
        value: value,
        action: 'modified'
    });
    
    this.updateIssueCard(issueId);
    this.updateProgress();
    this.nextIssue();
};
EOF

# Create pdf-export.js
cat > modules/pdf-export.js << 'EOF'
// PDF export module
class PDFExporter {
    async export(state, options) {
        const { includeReport, addMetadata } = options;
        
        try {
            // Load the original PDF
            const existingPdfBytes = await this.getPDFBytes(state.pdf);
            const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
            
            // Apply remediations
            await this.applyRemediations(pdfDoc, state);
            
            // Add metadata if requested
            if (addMetadata) {
                this.addAccessibilityMetadata(pdfDoc, state);
            }
            
            // Generate the PDF
            const pdfBytes = await pdfDoc.save();
            const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
            
            // Generate report if requested
            let reportBlob = null;
            if (includeReport) {
                reportBlob = await this.generateReport(state);
            }
            
            return { pdfBlob, reportBlob };
            
        } catch (error) {
            console.error('Export error:', error);
            throw new Error('Failed to export PDF: ' + error.message);
        }
    }
    
    async getPDFBytes(pdfDocument) {
        // Get the PDF data from PDF.js document
        const data = await pdfDocument.getData();
        return data;
    }
    
    async applyRemediations(pdfDoc, state) {
        const remediations = state.getRemediations();
        
        for (const remediation of remediations) {
            const issue = state.getIssue(remediation.issueId);
            if (!issue || remediation.action === 'skipped') continue;
            
            try {
                switch (issue.type) {
                    case 'missing-document-title':
                        if (remediation.value) {
                            pdfDoc.setTitle(remediation.value);
                        }
                        break;
                        
                    case 'missing-language':
                        if (remediation.value) {
                            pdfDoc.setLanguage(remediation.value);
                        }
                        break;
                        
                    case 'missing-alt-text':
                        // Note: Adding alt text to existing images requires
                        // modifying the content stream, which is complex
                        // For the PoC, we'll add a comment annotation
                        await this.addAltTextComment(pdfDoc, issue, remediation.value);
                        break;
                        
                    // Other remediations would be applied here
                    // Full implementation would require deep PDF structure modification
                }
            } catch (error) {
                console.error(`Failed to apply remediation for ${issue.type}:`, error);
            }
        }
    }
    
    async addAltTextComment(pdfDoc, issue, altText) {
        if (!issue.page || !issue.bounds) return;
        
        const pages = pdfDoc.getPages();
        const page = pages[issue.page - 1];
        
        if (!page) return;
        
        // Add a text annotation with the alt text
        const { x, y, width, height } = issue.bounds;
        
        page.drawRectangle({
            x: x,
            y: page.getHeight() - y - height,
            width: width,
            height: height,
            borderColor: PDFLib.rgb(0, 0, 1),
            borderWidth: 1,
            opacity: 0.25
        });
        
        // Add alt text as a note
        const textAnnotation = {
            x: x + width,
            y: page.getHeight() - y,
            width: 200,
            height: 50,
            open: false,
            contents: `Alt text: ${altText}`,
            authorName: 'RemTool'
        };
        
        // Note: PDF-lib doesn't directly support annotations
        // This is a simplified representation
    }
    
    addAccessibilityMetadata(pdfDoc, state) {
        const stats = state.getStatistics();
        const now = new Date().toISOString();
        
        // Set document metadata
        pdfDoc.setSubject('Accessibility Remediated Document');
        pdfDoc.setKeywords(['accessible', 'remediated', 'WCAG', 'PDF/UA']);
        pdfDoc.setProducer('RemTool v1.0');
        pdfDoc.setCreator('RemTool Accessibility Software');
        pdfDoc.setModificationDate(new Date());
        
        // Add custom metadata
        const metadata = {
            'RemTool:Version': '1.0',
            'RemTool:RemediationDate': now,
            'RemTool:IssuesFound': stats.total.toString(),
            'RemTool:IssuesResolved': stats.resolved.toString(),
            'RemTool:ComplianceLevel': 'WCAG 2.1 AA',
            'RemTool:CompletionPercentage': Math.round(stats.completionPercentage).toString()
        };
        
        // Note: Adding custom XMP metadata would require additional libraries
    }
    
    async generateReport(state) {
        const stats = state.getStatistics();
        const issues = state.getIssues();
        const remediations = state.getRemediations();
        
        // Create a new PDF document for the report
        const reportDoc = await PDFLib.PDFDocument.create();
        const page = reportDoc.addPage([612, 792]); // Letter size
        
        const { width, height } = page.getSize();
        const fontSize = 12;
        const margin = 50;
        let yPosition = height - margin;
        
        // Title
        page.drawText('Accessibility Remediation Report', {
            x: margin,
            y: yPosition,
            size: 20,
            color: PDFLib.rgb(0, 0, 0)
        });
        yPosition -= 40;
        
        // Date
        page.drawText(`Generated: ${new Date().toLocaleString()}`, {
            x: margin,
            y: yPosition,
            size: fontSize,
            color: PDFLib.rgb(0.3, 0.3, 0.3)
        });
        yPosition -= 30;
        
        // Summary
        page.drawText('Summary', {
            x: margin,
            y: yPosition,
            size: 16,
            color: PDFLib.rgb(0, 0, 0)
        });
        yPosition -= 20;
        
        const summaryText = [
            `Total Issues Found: ${stats.total}`,
            `Issues Resolved: ${stats.resolved}`,
            `Issues Skipped: ${issues.filter(i => i.status === 'skipped').length}`,
            `Issues Flagged: ${stats.flagged}`,
            `Completion: ${Math.round(stats.completionPercentage)}%`
        ];
        
        summaryText.forEach(text => {
            page.drawText(text, {
                x: margin + 20,
                y: yPosition,
                size: fontSize,
                color: PDFLib.rgb(0, 0, 0)
            });
            yPosition -= 18;
        });
        
        yPosition -= 20;
        
        // Issue breakdown
        page.drawText('Issues by Type', {
            x: margin,
            y: yPosition,
            size: 16,
            color: PDFLib.rgb(0, 0, 0)
        });
        yPosition -= 20;
        
        Object.entries(stats.byType).forEach(([type, count]) => {
            page.drawText(`${this.formatIssueType(type)}: ${count}`, {
                x: margin + 20,
                y: yPosition,
                size: fontSize,
                color: PDFLib.rgb(0, 0, 0)
            });
            yPosition -= 18;
        });
        
        // Add more pages for detailed remediation log if needed
        if (yPosition < 100) {
            const newPage = reportDoc.addPage([612, 792]);
            yPosition = height - margin;
        }
        
        // Save report
        const reportBytes = await reportDoc.save();
        return new Blob([reportBytes], { type: 'application/pdf' });
    }
    
    formatIssueType(type) {
        return type.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
}
EOF

# Create config.js
cat > config.js << 'EOF'
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
EOF

echo "Module files created successfully!"
EOF