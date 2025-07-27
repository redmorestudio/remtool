// State management for RemTool
class StateManager {
    constructor() {
        this.pdf = null;
        this.fileName = '';
        this.issues = [];
        this.remediations = [];
        this.currentIssueId = null;
        this.filters = {
            type: 'all',
            status: 'all',
            severity: 'all'
        };
    }
    
    setPDF(pdf, fileName) {
        this.pdf = pdf;
        this.fileName = fileName;
    }
    
    setIssues(issues) {
        this.issues = issues.map((issue, index) => ({
            ...issue,
            id: `issue-${index}`,
            status: 'pending'
        }));
    }
    
    getIssues() {
        return this.issues;
    }
    
    getIssue(id) {
        return this.issues.find(issue => issue.id === id);
    }
    
    getFilteredIssues() {
        return this.issues.filter(issue => {
            if (this.filters.type !== 'all' && issue.type !== this.filters.type) {
                return false;
            }
            if (this.filters.status !== 'all' && issue.status !== this.filters.status) {
                return false;
            }
            if (this.filters.severity !== 'all' && issue.severity !== this.filters.severity) {
                return false;
            }
            return true;
        });
    }
    
    setCurrentIssue(id) {
        this.currentIssueId = id;
    }
    
    addRemediation(remediation) {
        this.remediations.push({
            ...remediation,
            timestamp: new Date().toISOString()
        });
    }
    
    getRemediations() {
        return this.remediations;
    }
    
    setFilter(filterType, value) {
        this.filters[filterType] = value;
    }
    
    getStatistics() {
        const total = this.issues.length;
        const resolved = this.issues.filter(i => 
            ['accepted', 'modified', 'skipped'].includes(i.status)
        ).length;
        const pending = this.issues.filter(i => i.status === 'pending').length;
        const flagged = this.issues.filter(i => i.status === 'flagged').length;
        
        const byType = {};
        const bySeverity = {};
        
        this.issues.forEach(issue => {
            byType[issue.type] = (byType[issue.type] || 0) + 1;
            bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
        });
        
        return {
            total,
            resolved,
            pending,
            flagged,
            byType,
            bySeverity,
            completionPercentage: total > 0 ? (resolved / total * 100) : 0
        };
    }
}