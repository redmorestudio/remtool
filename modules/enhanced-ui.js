// Enhanced UI Components for RemTool

// Document Score Display Component
class DocumentScoreDisplay {
    constructor() {
        this.container = null;
    }
    
    create() {
        const scoreHtml = `
            <div class="document-score-container">
                <div class="score-circle">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="#e0e0e0" stroke-width="8"/>
                        <circle id="score-circle-fill" cx="60" cy="60" r="54" fill="none" 
                                stroke="#4CAF50" stroke-width="8" 
                                stroke-dasharray="339.292" stroke-dashoffset="339.292"
                                transform="rotate(-90 60 60)"/>
                    </svg>
                    <div class="score-text">
                        <span id="score-number">--</span>
                        <span id="score-grade">-</span>
                    </div>
                </div>
                <div class="score-breakdown">
                    <div class="score-category">
                        <span class="category-label">Structure</span>
                        <div class="category-bar">
                            <div id="structure-bar" class="category-fill"></div>
                        </div>
                        <span id="structure-score" class="category-score">--</span>
                    </div>
                    <div class="score-category">
                        <span class="category-label">Content</span>
                        <div class="category-bar">
                            <div id="content-bar" class="category-fill"></div>
                        </div>
                        <span id="content-score" class="category-score">--</span>
                    </div>
                    <div class="score-category">
                        <span class="category-label">Forms</span>
                        <div class="category-bar">
                            <div id="forms-bar" class="category-fill"></div>
                        </div>
                        <span id="forms-score" class="category-score">--</span>
                    </div>
                </div>
            </div>
        `;
        
        const container = document.createElement('div');
        container.innerHTML = scoreHtml;
        return container.firstElementChild;
    }
    
    update(score, breakdown) {
        // Update overall score
        document.getElementById('score-number').textContent = score;
        document.getElementById('score-grade').textContent = breakdown.grade;
        
        // Update circle
        const circle = document.getElementById('score-circle-fill');
        const circumference = 2 * Math.PI * 54;
        const offset = circumference - (score / 100) * circumference;
        circle.style.strokeDashoffset = offset;
        
        // Update color based on score
        let color = '#4CAF50'; // Green
        if (score < 60) color = '#f44336'; // Red
        else if (score < 80) color = '#ff9800'; // Orange
        circle.style.stroke = color;
        
        // Update category scores
        this.updateCategory('structure', breakdown.structural);
        this.updateCategory('content', breakdown.content);
        this.updateCategory('forms', breakdown.forms);
    }
    
    updateCategory(category, score) {
        const bar = document.getElementById(`${category}-bar`);
        const scoreText = document.getElementById(`${category}-score`);
        
        bar.style.width = `${score}%`;
        scoreText.textContent = score;
        
        // Color based on score
        let color = '#4CAF50';
        if (score < 60) color = '#f44336';
        else if (score < 80) color = '#ff9800';
        bar.style.backgroundColor = color;
    }
}

// Enhanced Save Functionality
class SaveManager {
    constructor() {
        this.saveButton = null;
    }
    
    createSaveButton() {
        const button = document.createElement('button');
        button.className = 'btn-primary save-button';
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2v12h12V4.5L11.5 2H2zm10 12H4v-4h8v4zm0-6H4V4h4v2h4V4.5L11.5 4H10v3H3v7h10V8z"/>
            </svg>
            Save Remediated PDF
        `;
        button.onclick = () => this.saveDocument();
        return button;
    }
    
    async saveDocument() {
        try {
            // Show saving state
            this.showSavingState();
            
            // Get current state
            const state = window.app.state;
            const stats = state.getStatistics();
            
            // Prepare export options
            const options = {
                includeReport: document.getElementById('include-report')?.checked ?? true,
                addMetadata: document.getElementById('add-metadata')?.checked ?? true
            };
            
            // Export the PDF
            const exporter = new PDFExporter();
            const { pdfBlob, reportBlob } = await exporter.export(state, options);
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const originalName = state.fileName.replace('.pdf', '');
            const pdfFileName = `${originalName}_remediated_${timestamp}.pdf`;
            
            // Download the PDF
            this.downloadBlob(pdfBlob, pdfFileName);
            
            // Download report if requested
            if (reportBlob) {
                const reportFileName = `${originalName}_report_${timestamp}.pdf`;
                setTimeout(() => {
                    this.downloadBlob(reportBlob, reportFileName);
                }, 1000);
            }
            
            // Show success message
            this.showSaveSuccess(stats);
            
        } catch (error) {
            console.error('Save error:', error);
            this.showSaveError(error.message);
        }
    }
    
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    showSavingState() {
        const button = document.querySelector('.save-button');
        if (button) {
            button.disabled = true;
            button.innerHTML = `
                <div class="spinner"></div>
                Saving...
            `;
        }
    }
    
    showSaveSuccess(stats) {
        const button = document.querySelector('.save-button');
        if (button) {
            button.disabled = false;
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
                </svg>
                Saved Successfully!
            `;
            
            // Show stats in a toast
            this.showToast(`PDF saved! ${stats.resolved} issues remediated.`, 'success');
            
            // Reset button after 3 seconds
            setTimeout(() => {
                button.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M2 2v12h12V4.5L11.5 2H2zm10 12H4v-4h8v4zm0-6H4V4h4v2h4V4.5L11.5 4H10v3H3v7h10V8z"/>
                    </svg>
                    Save Remediated PDF
                `;
            }, 3000);
        }
    }
    
    showSaveError(message) {
        const button = document.querySelector('.save-button');
        if (button) {
            button.disabled = false;
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 2v12h12V4.5L11.5 2H2zm10 12H4v-4h8v4zm0-6H4V4h4v2h4V4.5L11.5 4H10v3H3v7h10V8z"/>
                </svg>
                Save Remediated PDF
            `;
        }
        
        this.showToast(`Save failed: ${message}`, 'error');
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 4000);
    }
}

// Enhanced Filter Manager
class FilterManager {
    constructor() {
        this.currentFilter = 'all';
        this.currentStatus = 'all';
        this.currentSeverity = 'all';
    }
    
    init() {
        // Add event listeners to filter controls
        const typeFilter = document.getElementById('filter-type');
        const statusFilter = document.getElementById('filter-status');
        const severityFilter = document.getElementById('filter-severity');
        
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.applyFilters();
            });
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentStatus = e.target.value;
                this.applyFilters();
            });
        }
        
        if (severityFilter) {
            severityFilter.addEventListener('change', (e) => {
                this.currentSeverity = e.target.value;
                this.applyFilters();
            });
        }
    }
    
    applyFilters() {
        const state = window.app.state;
        const issues = state.getIssues();
        
        const filtered = issues.filter(issue => {
            // Type filter
            if (this.currentFilter !== 'all') {
                // Handle special filters
                if (this.currentFilter === 'forms') {
                    // Show all form-related issues
                    if (!issue.type.includes('form') && 
                        issue.type !== 'missing-form-label' &&
                        !issue.type.includes('javascript')) {
                        return false;
                    }
                } else if (this.currentFilter === 'form-javascript') {
                    // Show only JavaScript form issues
                    if (!issue.type.includes('form-javascript')) {
                        return false;
                    }
                } else if (issue.type !== this.currentFilter) {
                    return false;
                }
            }
            
            // Status filter
            if (this.currentStatus !== 'all' && issue.status !== this.currentStatus) {
                return false;
            }
            
            // Severity filter
            if (this.currentSeverity !== 'all' && issue.severity !== this.currentSeverity) {
                return false;
            }
            
            return true;
        });
        
        // Update the UI
        window.app.displayFilteredIssues(filtered);
        
        // Update count
        const countElement = document.getElementById('issue-count');
        if (countElement) {
            countElement.textContent = `${filtered.length} issues`;
        }
    }
}

// Side-by-side comparison view explanation
class ComparisonView {
    constructor() {
        this.tooltip = null;
    }
    
    init() {
        // Add help tooltip to explain the side-by-side view
        const viewer = document.querySelector('.pdf-viewer-container');
        if (viewer) {
            const helpButton = document.createElement('button');
            helpButton.className = 'help-button-inline';
            helpButton.innerHTML = '?';
            helpButton.title = 'About this view';
            helpButton.onclick = () => this.showExplanation();
            
            viewer.appendChild(helpButton);
        }
    }
    
    showExplanation() {
        const explanation = `
            <div class="explanation-modal">
                <h3>Understanding the Split View</h3>
                <div class="explanation-content">
                    <div class="view-section">
                        <h4>Left Panel - PDF View</h4>
                        <p>Shows your PDF document with accessibility issues highlighted. 
                        Click on any highlighted area to see details about the issue.</p>
                    </div>
                    <div class="view-section">
                        <h4>Right Panel - Issue Details</h4>
                        <p>Displays the current issue's information, AI-suggested remediation, 
                        and allows you to edit or accept the suggestion.</p>
                    </div>
                    <div class="view-section">
                        <h4>How to Use</h4>
                        <ul>
                            <li>Click issues in the left sidebar or PDF to select them</li>
                            <li>Review and edit the suggested fix in the right panel</li>
                            <li>Click "Accept" or press Ctrl+Enter to apply the fix</li>
                            <li>Use "Skip" if you want to handle an issue manually</li>
                            <li>Save your remediated PDF when finished</li>
                        </ul>
                    </div>
                </div>
                <button onclick="this.parentElement.remove()" class="btn-primary">Got it!</button>
            </div>
        `;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = explanation;
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        document.body.appendChild(modal);
    }
}

// Export all enhanced components
window.DocumentScoreDisplay = DocumentScoreDisplay;
window.SaveManager = SaveManager;
window.FilterManager = FilterManager;
window.ComparisonView = ComparisonView;