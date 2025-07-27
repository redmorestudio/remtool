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