# RemTool User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Setting Up API Keys](#setting-up-api-keys)
3. [Uploading PDFs](#uploading-pdfs)
4. [Understanding the Interface](#understanding-the-interface)
5. [Working with Issues](#working-with-issues)
6. [Using AI Suggestions](#using-ai-suggestions)
7. [Exporting Results](#exporting-results)
8. [Tips and Best Practices](#tips-and-best-practices)

## Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- At least 4GB RAM
- Stable internet connection for AI features
- Python 3.x for running local server

### First Time Setup

1. **Start the Server**
   ```bash
   cd remtool
   python3 -m http.server 8000
   ```

2. **Open RemTool**
   Navigate to: http://localhost:8000/index-cdn.html

3. **Initial Configuration**
   You'll be prompted to enter at least one API key before you can start.

## Setting Up API Keys

### Getting API Keys

#### Grok API (Recommended)
1. Visit [X.AI](https://x.ai)
2. Sign up or log in
3. Navigate to API section
4. Generate an API key
5. Copy the key

#### Gemini API (Optional)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Get API Key"
4. Copy the generated key

#### Claude API (Optional)
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create account or sign in
3. Go to API Keys section
4. Create new key
5. Copy the key

### Entering API Keys

1. Click the "Settings" button in the top right
2. Enter your API key(s) in the respective fields
3. Click "Save Configuration"
4. Keys are stored locally in your browser

## Uploading PDFs

### Methods
1. **Drag and Drop**: Drag PDF file onto the upload area
2. **Browse**: Click "Choose File" button to browse

### Requirements
- PDF format only
- Maximum 50 pages (PoC limitation)
- File size under 50MB recommended

### What Happens Next
1. File validation
2. Automatic accessibility analysis
3. Progressive AI enhancement
4. Issues displayed in priority order

## Understanding the Interface

### Layout Overview

```
┌─────────────────────────────────────┐
│          Header & Controls          │
├──────────────┬──────────────────────┤
│              │                      │
│  Issue List  │    PDF Viewer        │
│    (Left)    │     (Right)          │
│              │                      │
├──────────────┴──────────────────────┤
│         Action Buttons              │
└─────────────────────────────────────┘
```

### Issue List Panel (Left)
- **Filter Controls**: Filter by type, page, or status
- **Issue Cards**: Each card shows:
  - Issue type and icon
  - Severity (Error/Warning/Info)
  - Location (page number)
  - Brief description
  - Action buttons
  - AI suggestion preview

### PDF Viewer Panel (Right)
- **PDF Display**: Shows current page
- **Navigation**: Previous/Next page buttons
- **Zoom Controls**: Adjust view size
- **Highlighting**: Current issue highlighted
- **Visual Indicators**: 
  - Red outline: Current issue
  - Green checkmark: Resolved
  - Gray overlay: Skipped

## Working with Issues

### Issue Types

#### Critical Issues (Red)
- Missing document title
- Images without alt text
- Form fields without labels
- Untagged content

#### Important Issues (Yellow)
- Generic link text
- Missing table summaries
- Heading hierarchy problems
- Reading order issues

#### Minor Issues (Blue)
- Suboptimal alt text length
- Best practice violations
- Formatting inconsistencies

### Reviewing Issues

1. **Select an Issue**: Click on issue card
2. **View Context**: Issue highlighted in PDF
3. **Review Suggestion**: AI suggestion displayed
4. **Take Action**:
   - **Accept**: Use AI suggestion as-is
   - **Edit**: Modify the suggestion
   - **Skip**: Mark for manual review later

### Remediation Interfaces

#### Alt Text Editor
- Image preview
- Character counter (125 limit)
- Surrounding text context
- "Mark as decorative" option

#### Heading Structure
- Current text display
- Level selector (H1-H6)
- Document outline view
- Hierarchy validation

#### Table Structure
- Visual grid representation
- Click cells to mark headers
- Scope selection
- Summary text field

## Using AI Suggestions

### How AI Suggestions Work
1. **Context Analysis**: AI reviews surrounding content
2. **Service Selection**: Appropriate AI chosen automatically
3. **Suggestion Generation**: Context-aware suggestion created
4. **Confidence Score**: Indicates suggestion quality

### AI Service Indicators
- 🟦 **Grok**: Basic suggestions, fast
- 🟩 **Gemini**: Complex content, balanced
- 🟪 **Claude**: Technical content, detailed

### Best Practices
- Always review AI suggestions
- Edit for accuracy and context
- Use confidence scores as guidance
- Provide specific, descriptive text

## Exporting Results

### Pre-Export Checklist
1. Review all issues
2. Resolve critical issues
3. Check statistics in header
4. Preview resolved issues

### Export Process
1. Click "Export PDF" button
2. Wait for processing (30-60 seconds)
3. Downloads include:
   - Remediated PDF
   - Compliance report
   - Issue summary

### Compliance Report Contents
- Document metadata
- Issues found/resolved
- Remaining warnings
- Processing statistics
- Compliance statement draft

## Tips and Best Practices

### Efficiency Tips
1. **Use Filters**: Focus on one issue type at a time
2. **Keyboard Shortcuts**: 
   - `Ctrl+Enter`: Accept suggestion
   - `Ctrl+→/←`: Navigate issues
3. **Bulk Actions**: Use "Accept All" for similar issues
4. **Progressive Work**: Start with critical issues

### Quality Guidelines
1. **Alt Text**:
   - Be concise but descriptive
   - Include essential information
   - Avoid "image of" or "picture of"
   - 125 characters or less

2. **Headings**:
   - Maintain logical hierarchy
   - Don't skip levels
   - Use for structure, not formatting

3. **Links**:
   - Describe destination
   - Avoid "click here"
   - Include context

4. **Tables**:
   - Mark all header cells
   - Provide summaries for complex tables
   - Use proper scope attributes

### Common Workflows

#### Quick Remediation
1. Upload PDF
2. Filter to "Errors" only
3. Use "Accept All" for simple issues
4. Manually review complex issues
5. Export when ready

#### Thorough Review
1. Upload PDF
2. Work through issues by page
3. Review each suggestion carefully
4. Edit as needed
5. Document decisions
6. Export with full report

#### Partial Remediation
1. Upload PDF
2. Focus on specific issue types
3. Skip non-critical issues
4. Export partially remediated PDF
5. Continue later if needed

### Troubleshooting

#### Slow Performance
- Close other browser tabs
- Try smaller PDFs first
- Disable browser extensions
- Use Chrome for best performance

#### AI Suggestions Not Loading
- Check API key validity
- Verify internet connection
- Look for error messages
- Try different AI service

#### Export Failures
- Ensure all critical issues addressed
- Check browser console for errors
- Try with fewer modifications
- Save work and retry

## Need More Help?

- Check the [FAQ](FAQ.md)
- Review [Troubleshooting Guide](TROUBLESHOOTING.md)
- Open an [issue](https://github.com/redmorestudio/remtool/issues)
- Contact support

---

*Remember: RemTool assists with remediation but human review ensures quality. Always verify suggestions meet your specific accessibility requirements.*