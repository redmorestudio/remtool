// Main application controller
class RemTool {
    constructor() {
        this.state = new StateManager();
        this.analyzer = window.EnhancedPDFAnalyzer ? new EnhancedPDFAnalyzer() : new PDFAnalyzer();
        this.aiService = new AIServiceManager();
        this.exporter = new PDFExporter();
        this.currentPage = 1;
        this.zoom = 1.0;
        this.highlightsEnabled = true;
        
        // Enhanced components
        this.scoreDisplay = new DocumentScoreDisplay();
        this.saveManager = new SaveManager();
        this.filterManager = new FilterManager();
        this.comparisonView = new ComparisonView();
        
        this.init();
    }
    
    async init() {
        // Configure PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // Load saved API keys
        this.loadSavedKeys();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize enhanced components
        this.filterManager.init();
        this.comparisonView.init();
        
        // Setup save button
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.onclick = () => this.saveManager.saveDocument();
        }
        
        // Show upload modal
        this.showUploadModal();
    }
    
    setupEventListeners() {
        // File upload
        const pdfInput = document.getElementById('pdf-input');
        pdfInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        const uploadArea = document.getElementById('upload-area');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'application/pdf') {
                this.processPDF(files[0]);
            }
        });
        
        // API key inputs
        ['grok', 'gemini', 'sonnet'].forEach(service => {
            const input = document.getElementById(`${service}-key`);
            input.addEventListener('change', () => {
                const key = input.value.trim();
                if (key) {
                    localStorage.setItem(`${service}_api_key`, key);
                    this.aiService.setAPIKey(service, key);
                }
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.acceptCurrentIssue();
            } else if (e.key === 'ArrowRight' && e.ctrlKey) {
                this.nextIssue();
            } else if (e.key === 'ArrowLeft' && e.ctrlKey) {
                this.previousIssue();
            }
        });
    }
    
    loadSavedKeys() {
        ['grok', 'gemini', 'sonnet'].forEach(service => {
            const savedKey = localStorage.getItem(`${service}_api_key`);
            if (savedKey) {
                document.getElementById(`${service}-key`).value = savedKey;
                this.aiService.setAPIKey(service, savedKey);
            }
        });
        
        // Auto-save any API key from Basic Memory if available
        const grokKey = null; // Remove any hardcoded API keys
        if (grokKey && !localStorage.getItem('grok_api_key')) {
            localStorage.setItem('grok_api_key', grokKey);
            document.getElementById('grok-key').value = grokKey;
            this.aiService.setAPIKey('grok', grokKey);
        }
    }
    
    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            await this.processPDF(file);
        }
    }
    
    async processPDF(file) {
        try {
            this.showLoading('Loading PDF...');
            
            // Validate file size
            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                throw new Error('PDF file is too large. Maximum size is 50MB.');
            }
            
            // Load PDF
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({
                data: arrayBuffer,
                cMapUrl: 'lib/cmaps/',
                cMapPacked: true
            }).promise;
            
            // Check page count
            if (pdf.numPages > 50) {
                throw new Error(`PDF has ${pdf.numPages} pages. Maximum is 50 pages for PoC.`);
            }
            
            // Store PDF
            this.state.setPDF(pdf, file.name);
            
            // Hide upload modal
            document.getElementById('upload-modal').style.display = 'none';
            
            // Update UI
            document.getElementById('page-count').textContent = pdf.numPages;
            
            // Start analysis
            await this.analyzePDF();
            
        } catch (error) {
            this.hideLoading();
            alert(`Error processing PDF: ${error.message}`);
            console.error(error);
        }
    }
    
    async analyzePDF() {
        try {
            this.showLoading('Analyzing PDF structure...');
            
            let result;
            
            // Use enhanced analyzer if available
            if (this.analyzer.analyzeWithAI) {
                result = await this.analyzer.analyzeWithAI(this.state.pdf, this.aiService);
                
                // Display document score
                this.displayDocumentScore(result.score, result.scoreBreakdown);
                
                // Store issues with enhanced data
                this.state.setIssues(result.issues);
            } else {
                // Fallback to basic analysis
                const structuralIssues = await this.analyzer.analyzeStructure(this.state.pdf);
                this.showLoading('Analyzing content...');
                const contentIssues = await this.analyzer.analyzeContent(this.state.pdf);
                
                const allIssues = [...structuralIssues, ...contentIssues];
                allIssues.sort((a, b) => {
                    if (a.page !== b.page) return a.page - b.page;
                    return this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity);
                });
                
                this.state.setIssues(allIssues);
            }
            
            // Show save button and score
            document.getElementById('save-btn').style.display = 'inline-flex';
            document.getElementById('header-score').style.display = 'flex';
            
            // Enhance with AI
            this.enhanceIssuesWithAI();
            
            // Display issues
            this.displayIssues();
            
            // Show first page
            await this.renderPage(1);
            
            // Select first issue
            const issues = this.state.getIssues();
            if (issues.length > 0) {
                this.selectIssue(0);
            }
            
            this.hideLoading();
            
        } catch (error) {
            this.hideLoading();
            alert(`Error analyzing PDF: ${error.message}`);
            console.error(error);
        }
    }
    
    displayDocumentScore(score, breakdown) {
        // Update header mini score
        document.getElementById('score-mini-number').textContent = score;
        
        // Create and display detailed score
        const scoreContainer = document.getElementById('score-display-container');
        if (scoreContainer) {
            const scoreDisplay = this.scoreDisplay.create();
            scoreContainer.innerHTML = '';
            scoreContainer.appendChild(scoreDisplay);
            
            // Animate the score
            setTimeout(() => {
                this.scoreDisplay.update(score, breakdown);
            }, 100);
        }
    }
    
    displayFilteredIssues(filtered) {
        const container = document.getElementById('issues-list');
        container.innerHTML = '';
        
        filtered.forEach((issue, index) => {
            const card = this.createIssueCard(issue, index);
            container.appendChild(card);
        });
        
        // Update progress for filtered issues
        this.updateProgress();
    }
    
    async enhanceIssuesWithAI() {
        const issues = this.state.getIssues();
        const needsAI = issues.filter(issue => 
            issue.type === 'missing-alt-text' || 
            issue.type === 'complex-table' ||
            issue.type === 'generic-link-text'
        );
        
        if (needsAI.length === 0) return;
        
        this.showLoading(`Generating AI suggestions for ${needsAI.length} issues...`);
        
        // Process in batches
        const batchSize = 5;
        for (let i = 0; i < needsAI.length; i += batchSize) {
            const batch = needsAI.slice(i, i + batchSize);
            
            await Promise.all(batch.map(async (issue) => {
                try {
                    const enhanced = await this.aiService.enhanceIssue(issue);
                    Object.assign(issue, enhanced);
                    
                    // Update UI for this issue
                    this.updateIssueCard(issue.id);
                    
                } catch (error) {
                    console.error(`Failed to enhance issue ${issue.id}:`, error);
                    issue.aiError = true;
                }
            }));
            
            // Update progress
            const progress = Math.min((i + batchSize) / needsAI.length * 100, 100);
            this.updateProgress();
        }
        
        this.hideLoading();
    }
    
    displayIssues() {
        const issues = this.state.getFilteredIssues();
        const container = document.getElementById('issues-list');
        container.innerHTML = '';
        
        issues.forEach((issue, index) => {
            const card = this.createIssueCard(issue, index);
            container.appendChild(card);
        });
        
        document.getElementById('issue-count').textContent = `${issues.length} issues`;
        this.updateProgress();
    }
    
    createIssueCard(issue, index) {
        const card = document.createElement('div');
        card.className = `issue-card severity-${issue.severity} status-${issue.status}`;
        card.dataset.issueId = issue.id;
        
        // Add classes for enhanced issue types
        if (issue.aiDetected) {
            card.classList.add('ai-detected');
        }
        if (issue.type.includes('form')) {
            card.classList.add('form-issue');
            if (issue.type.includes('javascript')) {
                card.classList.add('javascript-issue');
            }
        }
        
        // Icon based on type
        const icons = {
            'missing-alt-text': '🖼️',
            'heading-hierarchy': '📝',
            'reading-order': '🔢',
            'table-structure': '📊',
            'generic-link-text': '🔗',
            'missing-form-label': '📋',
            'form-javascript-mouse-only': '🖱️',
            'form-javascript-validation': '⚠️',
            'form-javascript-timing': '⏱️',
            'form-tab-order': '⌨️',
            'untagged-content': '🏷️',
            'missing-document-title': '📄',
            'missing-language': '🌐'
        };
        
        card.innerHTML = `
            <div class="issue-header">
                <span class="issue-icon">${icons[issue.type] || '❓'}</span>
                <span class="issue-type">${this.formatIssueType(issue.type)}</span>
                <span class="issue-location">Page ${issue.page}</span>
            </div>
            
            <div class="issue-description">${issue.message}</div>
            
            ${issue.suggestion ? `
                <div class="issue-suggestion">
                    <div class="suggestion-text">${this.truncate(issue.suggestion, 100)}</div>
                    ${issue.confidence ? `
                        <div class="confidence-indicator">
                            <div class="confidence-bar">
                                <div class="confidence-fill" style="width: ${issue.confidence}%"></div>
                            </div>
                            <span class="confidence-text">${issue.confidence}% confidence</span>
                        </div>
                    ` : ''}
                    ${issue.aiService ? `
                        <span class="ai-service-badge">${issue.aiService}</span>
                    ` : ''}
                </div>
            ` : ''}
            
            <div class="issue-actions">
                ${issue.suggestion ? `
                    <button class="btn-accept" onclick="app.acceptIssue('${issue.id}')">
                        Accept
                    </button>
                ` : ''}
                <button class="btn-edit" onclick="app.editIssue('${issue.id}')">
                    ${issue.suggestion ? 'Edit' : 'Fix'}
                </button>
                <button class="btn-skip" onclick="app.skipIssue('${issue.id}')">
                    Skip
                </button>
                <button class="btn-flag" onclick="app.flagIssue('${issue.id}')">
                    Flag
                </button>
            </div>
            
            ${issue.status !== 'pending' ? `
                <div class="issue-status-badge">
                    ${this.getStatusIcon(issue.status)} ${issue.status}
                </div>
            ` : ''}
        `;
        
        card.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                this.selectIssue(index);
            }
        });
        
        return card;
    }
    
    async selectIssue(index) {
        const issues = this.state.getFilteredIssues();
        if (index < 0 || index >= issues.length) return;
        
        const issue = issues[index];
        this.state.setCurrentIssue(issue.id);
        
        // Update UI
        document.querySelectorAll('.issue-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-issue-id="${issue.id}"]`).classList.add('selected');
        
        // Show page if different
        if (issue.page !== this.currentPage) {
            await this.renderPage(issue.page);
        }
        
        // Highlight element
        this.highlightIssue(issue);
        
        // Show remediation UI
        this.showRemediationUI(issue);
        
        // Scroll issue into view
        const card = document.querySelector(`[data-issue-id="${issue.id}"]`);
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    highlightIssue(issue) {
        const layer = document.getElementById('highlight-layer');
        layer.innerHTML = '';
        
        if (!this.highlightsEnabled || !issue.bounds) return;
        
        const highlight = document.createElement('div');
        highlight.className = 'issue-highlight';
        
        // Adjust for zoom
        highlight.style.left = (issue.bounds.x * this.zoom) + 'px';
        highlight.style.top = (issue.bounds.y * this.zoom) + 'px';
        highlight.style.width = (issue.bounds.width * this.zoom) + 'px';
        highlight.style.height = (issue.bounds.height * this.zoom) + 'px';
        
        layer.appendChild(highlight);
    }
    
    showRemediationUI(issue) {
        const container = document.getElementById('remediation-controls');
        const ui = RemediationUI.create(issue, this);
        container.innerHTML = '';
        container.appendChild(ui);
    }
    
    async renderPage(pageNum) {
        const page = await this.state.pdf.getPage(pageNum);
        const canvas = document.getElementById('pdf-canvas');
        const context = canvas.getContext('2d');
        
        // Calculate scale
        const viewport = page.getViewport({ scale: this.zoom });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render PDF page
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // Render text layer
        await this.renderTextLayer(page, viewport);
        
        this.currentPage = pageNum;
        document.getElementById('page-num').value = pageNum;
    }
    
    async renderTextLayer(page, viewport) {
        const textContent = await page.getTextContent();
        const textLayer = document.getElementById('text-layer');
        textLayer.innerHTML = '';
        
        textContent.items.forEach(item => {
            const div = document.createElement('div');
            div.textContent = item.str;
            div.className = 'text-layer-item';
            
            // Position text
            const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
            div.style.left = tx[4] + 'px';
            div.style.top = tx[5] + 'px';
            div.style.fontSize = Math.abs(tx[0]) + 'px';
            
            textLayer.appendChild(div);
        });
    }
    
    async acceptIssue(issueId) {
        const issue = this.state.getIssue(issueId);
        if (!issue || !issue.suggestion) return;
        
        issue.status = 'accepted';
        issue.finalValue = issue.suggestion;
        
        this.state.addRemediation({
            issueId: issueId,
            type: issue.type,
            value: issue.suggestion,
            action: 'accepted'
        });
        
        this.updateIssueCard(issueId);
        this.updateProgress();
        this.nextIssue();
    }
    
    async editIssue(issueId) {
        const issue = this.state.getIssue(issueId);
        if (!issue) return;
        
        // The remediation UI should already be showing
        // Focus on the input field
        const input = document.querySelector('.remediation-input');
        if (input) {
            input.focus();
            input.select();
        }
    }
    
    async skipIssue(issueId) {
        const issue = this.state.getIssue(issueId);
        if (!issue) return;
        
        issue.status = 'skipped';
        
        this.state.addRemediation({
            issueId: issueId,
            type: issue.type,
            action: 'skipped'
        });
        
        this.updateIssueCard(issueId);
        this.updateProgress();
        this.nextIssue();
    }
    
    async flagIssue(issueId) {
        const issue = this.state.getIssue(issueId);
        if (!issue) return;
        
        issue.status = 'flagged';
        
        const note = prompt('Add a note for this flagged issue (optional):');
        
        this.state.addRemediation({
            issueId: issueId,
            type: issue.type,
            action: 'flagged',
            note: note
        });
        
        this.updateIssueCard(issueId);
        this.updateProgress();
    }
    
    updateIssueCard(issueId) {
        const card = document.querySelector(`[data-issue-id="${issueId}"]`);
        if (!card) return;
        
        const issue = this.state.getIssue(issueId);
        
        // Update status class
        card.className = `issue-card severity-${issue.severity} status-${issue.status}`;
        
        // Update status badge
        const existingBadge = card.querySelector('.issue-status-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        if (issue.status !== 'pending') {
            const badge = document.createElement('div');
            badge.className = 'issue-status-badge';
            badge.innerHTML = `${this.getStatusIcon(issue.status)} ${issue.status}`;
            card.appendChild(badge);
        }
        
        // Update suggestion if AI enhanced
        if (issue.suggestion && !card.querySelector('.issue-suggestion')) {
            const suggestionDiv = document.createElement('div');
            suggestionDiv.className = 'issue-suggestion';
            suggestionDiv.innerHTML = `
                <div class="suggestion-text">${this.truncate(issue.suggestion, 100)}</div>
                ${issue.confidence ? `
                    <div class="confidence-indicator">
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${issue.confidence}%"></div>
                        </div>
                        <span class="confidence-text">${issue.confidence}% confidence</span>
                    </div>
                ` : ''}
                ${issue.aiService ? `
                    <span class="ai-service-badge">${issue.aiService}</span>
                ` : ''}
            `;
            
            const actions = card.querySelector('.issue-actions');
            card.insertBefore(suggestionDiv, actions);
            
            // Update actions to include Accept button
            const acceptBtn = document.createElement('button');
            acceptBtn.className = 'btn-accept';
            acceptBtn.textContent = 'Accept';
            acceptBtn.onclick = () => this.acceptIssue(issue.id);
            actions.insertBefore(acceptBtn, actions.firstChild);
        }
    }
    
    updateProgress() {
        const issues = this.state.getIssues();
        const resolved = issues.filter(i => 
            ['accepted', 'modified', 'skipped'].includes(i.status)
        ).length;
        
        const percentage = issues.length > 0 ? (resolved / issues.length * 100) : 0;
        
        document.getElementById('progress-fill').style.width = percentage + '%';
        document.getElementById('progress-text').textContent = 
            `${resolved} of ${issues.length} issues resolved`;
        
        // Enable export if all issues resolved
        if (resolved === issues.length && issues.length > 0) {
            this.enableExport();
        }
    }
    
    nextIssue() {
        const issues = this.state.getFilteredIssues();
        const currentIndex = issues.findIndex(i => i.id === this.state.currentIssueId);
        
        // Find next pending issue
        for (let i = currentIndex + 1; i < issues.length; i++) {
            if (issues[i].status === 'pending') {
                this.selectIssue(i);
                return;
            }
        }
        
        // No more pending issues
        if (this.state.getIssues().every(i => i.status !== 'pending')) {
            this.showExportModal();
        }
    }
    
    previousIssue() {
        const issues = this.state.getFilteredIssues();
        const currentIndex = issues.findIndex(i => i.id === this.state.currentIssueId);
        
        if (currentIndex > 0) {
            this.selectIssue(currentIndex - 1);
        }
    }
    
    showExportModal() {
        const modal = document.getElementById('export-modal');
        const issues = this.state.getIssues();
        
        const resolved = issues.filter(i => 
            ['accepted', 'modified'].includes(i.status)
        ).length;
        const skipped = issues.filter(i => i.status === 'skipped').length;
        
        document.getElementById('total-issues').textContent = issues.length;
        document.getElementById('resolved-issues').textContent = resolved;
        document.getElementById('skipped-issues').textContent = skipped;
        
        modal.style.display = 'flex';
    }
    
    async exportPDF() {
        try {
            // Delegate to SaveManager for enhanced functionality
            await this.saveManager.saveDocument();
            
            // Close export modal
            document.getElementById('export-modal').style.display = 'none';
            
        } catch (error) {
            console.error('Export error:', error);
            alert(`Export failed: ${error.message}`);
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
    
    // UI Helper Methods
    showLoading(message) {
        document.getElementById('loading-overlay').style.display = 'flex';
        document.getElementById('loading-message').textContent = message;
    }
    
    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }
    
    showUploadModal() {
        document.getElementById('upload-modal').style.display = 'flex';
    }
    
    formatIssueType(type) {
        return type.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    truncate(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }
    
    getSeverityWeight(severity) {
        const weights = { error: 3, warning: 2, info: 1 };
        return weights[severity] || 0;
    }
    
    getStatusIcon(status) {
        const icons = {
            accepted: '✓',
            modified: '✏️',
            skipped: '⏭️',
            flagged: '🚩'
        };
        return icons[status] || '';
    }
    
    enableExport() {
        // Add export button to header
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn-primary';
        exportBtn.textContent = 'Export PDF';
        exportBtn.onclick = () => this.showExportModal();
        document.querySelector('.header-actions').appendChild(exportBtn);
    }
    
    showSuccess() {
        alert('PDF exported successfully! The document has been remediated according to accessibility standards.');
    }
}

// Global functions for onclick handlers
function filterIssues() {
    if (window.app && window.app.filterManager) {
        window.app.filterManager.applyFilters();
    } else {
        window.app.displayIssues();
    }
}

function previousPage() {
    if (window.app.currentPage > 1) {
        window.app.renderPage(window.app.currentPage - 1);
    }
}

function nextPage() {
    if (window.app.currentPage < window.app.state.pdf.numPages) {
        window.app.renderPage(window.app.currentPage + 1);
    }
}

function goToPage() {
    const pageNum = parseInt(document.getElementById('page-num').value);
    if (pageNum >= 1 && pageNum <= window.app.state.pdf.numPages) {
        window.app.renderPage(pageNum);
    }
}

function zoomIn() {
    window.app.zoom = Math.min(window.app.zoom * 1.2, 3);
    document.getElementById('zoom-level').textContent = Math.round(window.app.zoom * 100) + '%';
    window.app.renderPage(window.app.currentPage);
}

function zoomOut() {
    window.app.zoom = Math.max(window.app.zoom / 1.2, 0.5);
    document.getElementById('zoom-level').textContent = Math.round(window.app.zoom * 100) + '%';
    window.app.renderPage(window.app.currentPage);
}

function fitToWidth() {
    const viewer = document.getElementById('pdf-viewer');
    const canvas = document.getElementById('pdf-canvas');
    window.app.zoom = viewer.clientWidth / canvas.width;
    document.getElementById('zoom-level').textContent = Math.round(window.app.zoom * 100) + '%';
    window.app.renderPage(window.app.currentPage);
}

function toggleHighlights() {
    window.app.highlightsEnabled = !window.app.highlightsEnabled;
    const btn = document.getElementById('highlight-toggle');
    btn.textContent = window.app.highlightsEnabled ? 'Highlights ON' : 'Highlights OFF';
    
    if (window.app.state.currentIssueId) {
        const issue = window.app.state.getIssue(window.app.state.currentIssueId);
        window.app.highlightIssue(issue);
    }
}

function toggleReadingOrder() {
    // TODO: Implement reading order visualization
    alert('Reading order visualization coming soon!');
}

function skipAllVisible() {
    if (confirm('Skip all currently visible issues?')) {
        const issues = window.app.state.getFilteredIssues();
        issues.forEach(issue => {
            if (issue.status === 'pending') {
                window.app.skipIssue(issue.id);
            }
        });
    }
}

function acceptAllSuggestions() {
    if (confirm('Accept all AI suggestions for visible issues?')) {
        const issues = window.app.state.getFilteredIssues();
        issues.forEach(issue => {
            if (issue.status === 'pending' && issue.suggestion) {
                window.app.acceptIssue(issue.id);
            }
        });
    }
}

function testAPIKeys() {
    window.app.aiService.testAllKeys();
}

function closeExportModal() {
    document.getElementById('export-modal').style.display = 'none';
}

function exportPDF() {
    window.app.exportPDF();
}

function toggleSettings() {
    alert('Settings panel coming soon!');
}

function showHelp() {
    alert('Help documentation coming soon! Use Ctrl+Enter to accept, Ctrl+Arrow keys to navigate.');
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RemTool();
});