// PDF analysis module
class PDFAnalyzer {
    constructor() {
        this.structuralChecks = [
            'document-title',
            'document-language',
            'tag-structure',
            'reading-order',
            'headings',
            'lists',
            'tables',
            'forms'
        ];
        
        this.contentChecks = [
            'images',
            'links',
            'color-contrast',
            'text-spacing'
        ];
    }
    
    async analyzeStructure(pdf) {
        const issues = [];
        
        // Check document title
        const info = await pdf.getMetadata();
        if (!info.info.Title || info.info.Title.trim() === '') {
            issues.push({
                type: 'missing-document-title',
                severity: 'error',
                page: 0,
                message: 'Document lacks a descriptive title',
                wcag: '2.4.2'
            });
        }
        
        // Check language
        if (!info.info.Lang) {
            issues.push({
                type: 'missing-language',
                severity: 'error',
                page: 0,
                message: 'Document language is not specified',
                wcag: '3.1.1'
            });
        }
        
        // Analyze each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const pageIssues = await this.analyzePage(page, pageNum);
            issues.push(...pageIssues);
        }
        
        return issues;
    }
    
    async analyzePage(page, pageNum) {
        const issues = [];
        const textContent = await page.getTextContent();
        const ops = await page.getOperatorList();
        
        // Check for untagged content
        if (!this.hasProperTags(ops)) {
            issues.push({
                type: 'untagged-content',
                severity: 'error',
                page: pageNum,
                message: 'Page contains untagged content',
                wcag: '1.3.1'
            });
        }
        
        // Check heading hierarchy
        const headings = this.extractHeadings(textContent);
        const headingIssues = this.checkHeadingHierarchy(headings, pageNum);
        issues.push(...headingIssues);
        
        // Check for tables without proper structure
        const tables = this.detectTables(textContent);
        tables.forEach(table => {
            if (!table.hasHeaders) {
                issues.push({
                    type: 'table-structure',
                    severity: 'error',
                    page: pageNum,
                    message: 'Table lacks proper header structure',
                    bounds: table.bounds,
                    wcag: '1.3.1'
                });
            }
        });
        
        return issues;
    }
    
    async analyzeContent(pdf) {
        const issues = [];
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const contentIssues = await this.analyzePageContent(page, pageNum);
            issues.push(...contentIssues);
        }
        
        return issues;
    }
    
    async analyzePageContent(page, pageNum) {
        const issues = [];
        const textContent = await page.getTextContent();
        const annotations = await page.getAnnotations();
        
        // Check images for alt text
        const images = await this.detectImages(page);
        images.forEach(img => {
            if (!img.hasAltText) {
                issues.push({
                    type: 'missing-alt-text',
                    severity: 'error',
                    page: pageNum,
                    message: 'Image missing alternative text',
                    bounds: img.bounds,
                    imageData: img.data,
                    wcag: '1.1.1'
                });
            }
        });
        
        // Check links
        annotations.forEach(annotation => {
            if (annotation.subtype === 'Link') {
                const linkText = this.getLinkText(annotation, textContent);
                if (this.isGenericLinkText(linkText)) {
                    issues.push({
                        type: 'generic-link-text',
                        severity: 'warning',
                        page: pageNum,
                        message: `Link text "${linkText}" is not descriptive`,
                        bounds: annotation.rect,
                        currentText: linkText,
                        url: annotation.url || annotation.dest,
                        wcag: '2.4.4'
                    });
                }
            }
        });
        
        // Check form fields
        const formFields = annotations.filter(a => 
            ['Widget', 'TextField', 'ButtonField', 'ChoiceField'].includes(a.subtype)
        );
        
        formFields.forEach(field => {
            if (!field.fieldName && !field.alternativeText) {
                issues.push({
                    type: 'missing-form-label',
                    severity: 'error',
                    page: pageNum,
                    message: 'Form field missing accessible label',
                    bounds: field.rect,
                    fieldType: field.subtype,
                    wcag: '3.3.2'
                });
            }
        });
        
        return issues;
    }
    
    // Helper methods
    hasProperTags(ops) {
        // Simplified check for tagged PDF
        return ops.fnArray.some(fn => fn === 'beginMarkedContent');
    }
    
    extractHeadings(textContent) {
        // Simplified heading detection based on font size
        const headings = [];
        let currentHeading = null;
        
        textContent.items.forEach(item => {
            if (item.height > 14) { // Assume larger text is heading
                if (currentHeading && Math.abs(currentHeading.y - item.transform[5]) < 5) {
                    currentHeading.text += ' ' + item.str;
                } else {
                    if (currentHeading) {
                        headings.push(currentHeading);
                    }
                    currentHeading = {
                        text: item.str,
                        level: this.guessHeadingLevel(item.height),
                        y: item.transform[5]
                    };
                }
            } else if (currentHeading) {
                headings.push(currentHeading);
                currentHeading = null;
            }
        });
        
        if (currentHeading) {
            headings.push(currentHeading);
        }
        
        return headings;
    }
    
    guessHeadingLevel(fontSize) {
        if (fontSize > 24) return 1;
        if (fontSize > 20) return 2;
        if (fontSize > 16) return 3;
        return 4;
    }
    
    checkHeadingHierarchy(headings, pageNum) {
        const issues = [];
        let lastLevel = 0;
        
        headings.forEach((heading, index) => {
            if (heading.level - lastLevel > 1) {
                issues.push({
                    type: 'heading-hierarchy',
                    severity: 'warning',
                    page: pageNum,
                    message: `Heading level skipped from H${lastLevel} to H${heading.level}`,
                    headingText: heading.text,
                    wcag: '1.3.1'
                });
            }
            lastLevel = heading.level;
        });
        
        return issues;
    }
    
    detectTables(textContent) {
        // Simplified table detection based on text alignment
        const tables = [];
        const rows = {};
        
        // Group text by Y position
        textContent.items.forEach(item => {
            const y = Math.round(item.transform[5]);
            if (!rows[y]) rows[y] = [];
            rows[y].push(item);
        });
        
        // Look for regular column patterns
        const sortedRows = Object.entries(rows).sort((a, b) => b[0] - a[0]);
        let tableStart = null;
        let columnPattern = null;
        
        sortedRows.forEach(([y, items]) => {
            if (items.length >= 2) {
                const pattern = items.map(i => Math.round(i.transform[4])).sort();
                
                if (!columnPattern || this.matchesPattern(pattern, columnPattern)) {
                    if (!tableStart) {
                        tableStart = { y: parseFloat(y), rows: [] };
                        columnPattern = pattern;
                    }
                    tableStart.rows.push(items);
                } else if (tableStart && tableStart.rows.length >= 2) {
                    tables.push({
                        bounds: this.calculateBounds(tableStart.rows.flat()),
                        hasHeaders: false, // Simplified - would need more analysis
                        rowCount: tableStart.rows.length
                    });
                    tableStart = null;
                    columnPattern = null;
                }
            }
        });
        
        return tables;
    }
    
    matchesPattern(pattern1, pattern2) {
        if (pattern1.length !== pattern2.length) return false;
        return pattern1.every((val, i) => Math.abs(val - pattern2[i]) < 10);
    }
    
    async detectImages(page) {
        const images = [];
        const ops = await page.getOperatorList();
        
        // Look for image drawing operations
        for (let i = 0; i < ops.fnArray.length; i++) {
            if (ops.fnArray[i] === 'paintImageXObject') {
                const imgIndex = ops.argsArray[i][0];
                
                // Try to get image data
                let imageData = null;
                try {
                    const img = page.objs.get(imgIndex);
                    if (img) {
                        imageData = {
                            width: img.width,
                            height: img.height
                        };
                    }
                } catch (e) {
                    // Image data not accessible
                }
                
                images.push({
                    bounds: { x: 0, y: 0, width: 100, height: 100 }, // Simplified
                    hasAltText: false, // Simplified check
                    data: imageData
                });
            }
        }
        
        return images;
    }
    
    getLinkText(annotation, textContent) {
        // Find text within link bounds
        const linkTexts = [];
        
        textContent.items.forEach(item => {
            const itemBounds = {
                left: item.transform[4],
                top: item.transform[5],
                right: item.transform[4] + item.width,
                bottom: item.transform[5] - item.height
            };
            
            if (this.boundsOverlap(annotation.rect, itemBounds)) {
                linkTexts.push(item.str);
            }
        });
        
        return linkTexts.join(' ');
    }
    
    boundsOverlap(rect1, rect2) {
        return !(rect2.left > rect1[2] || 
                 rect2.right < rect1[0] || 
                 rect2.top < rect1[1] || 
                 rect2.bottom > rect1[3]);
    }
    
    isGenericLinkText(text) {
        const genericPhrases = [
            'click here', 'here', 'read more', 'more', 'link',
            'download', 'click', 'go', 'visit', 'see'
        ];
        
        return genericPhrases.includes(text.toLowerCase().trim());
    }
    
    calculateBounds(items) {
        if (items.length === 0) return null;
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        items.forEach(item => {
            minX = Math.min(minX, item.transform[4]);
            maxX = Math.max(maxX, item.transform[4] + item.width);
            minY = Math.min(minY, item.transform[5] - item.height);
            maxY = Math.max(maxY, item.transform[5]);
        });
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
}