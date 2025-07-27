// AI service integration module
class AIServiceManager {
    constructor() {
        this.services = {
            grok: {
                key: null,
                endpoint: 'https://api.x.ai/v1',
                model: 'grok-beta',
                available: false
            },
            gemini: {
                key: null,
                endpoint: 'https://generativelanguage.googleapis.com/v1beta',
                model: 'gemini-pro-vision',
                available: false
            },
            sonnet: {
                key: null,
                endpoint: 'https://api.anthropic.com/v1',
                model: 'claude-3-sonnet-20240229',
                available: false
            }
        };
    }
    
    setAPIKey(service, key) {
        if (this.services[service]) {
            this.services[service].key = key;
            this.services[service].available = !!key;
        }
    }
    
    hasActiveService() {
        return Object.values(this.services).some(service => service.available && service.key);
    }
    
    getActiveService() {
        // Prioritize services: Grok > Gemini > Sonnet
        const priority = ['grok', 'gemini', 'sonnet'];
        for (const service of priority) {
            if (this.services[service].available && this.services[service].key) {
                return service;
            }
        }
        return null;
    }
    
    async testAllKeys() {
        for (const [service, config] of Object.entries(this.services)) {
            if (config.key) {
                const status = await this.testAPIKey(service);
                const statusEl = document.getElementById(`${service}-status`);
                if (statusEl) {
                    statusEl.textContent = status ? '✓ Valid' : '✗ Invalid';
                    statusEl.className = `api-status ${status ? 'valid' : 'invalid'}`;
                }
            }
        }
    }
    
    async testAPIKey(service) {
        try {
            switch (service) {
                case 'grok':
                    return await this.testGrokKey();
                case 'gemini':
                    return await this.testGeminiKey();
                case 'sonnet':
                    return await this.testSonnetKey();
                default:
                    return false;
            }
        } catch (error) {
            console.error(`Error testing ${service} API key:`, error);
            return false;
        }
    }
    
    async testGrokKey() {
        const response = await fetch(`${this.services.grok.endpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.services.grok.key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.services.grok.model,
                messages: [{ role: 'user', content: 'Test' }],
                max_tokens: 10
            })
        });
        
        return response.ok;
    }
    
    async testGeminiKey() {
        const response = await fetch(
            `${this.services.gemini.endpoint}/models/${this.services.gemini.model}:generateContent?key=${this.services.gemini.key}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Test' }] }]
                })
            }
        );
        
        return response.ok;
    }
    
    async testSonnetKey() {
        const response = await fetch(`${this.services.sonnet.endpoint}/messages`, {
            method: 'POST',
            headers: {
                'x-api-key': this.services.sonnet.key,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.services.sonnet.model,
                messages: [{ role: 'user', content: 'Test' }],
                max_tokens: 10
            })
        });
        
        return response.ok;
    }
    
    async enhanceIssue(issue) {
        // Try services in order of preference
        const serviceOrder = ['grok', 'gemini', 'sonnet'];
        
        for (const service of serviceOrder) {
            if (this.services[service].available) {
                try {
                    const result = await this.callService(service, issue);
                    if (result) {
                        return {
                            suggestion: result.suggestion,
                            confidence: result.confidence || 85,
                            aiService: service,
                            reasoning: result.reasoning
                        };
                    }
                } catch (error) {
                    console.error(`Error calling ${service}:`, error);
                }
            }
        }
        
        // Fallback to rule-based suggestions
        return this.getRuleBasedSuggestion(issue);
    }
    
    async callService(service, issue) {
        switch (service) {
            case 'grok':
                return await this.callGrok(issue);
            case 'gemini':
                return await this.callGemini(issue);
            case 'sonnet':
                return await this.callSonnet(issue);
            default:
                return null;
        }
    }
    
    async callGrok(issue) {
        const prompt = this.buildPrompt(issue);
        
        const response = await fetch(`${this.services.grok.endpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.services.grok.key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.services.grok.model,
                messages: [
                    {
                        role: 'system',
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