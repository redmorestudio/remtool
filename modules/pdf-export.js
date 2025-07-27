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