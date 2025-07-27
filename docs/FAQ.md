# Frequently Asked Questions

## General Questions

### What is RemTool?
RemTool is a web-based application that helps you make PDF documents accessible by detecting issues and providing AI-powered suggestions for remediation.

### Do I need to install anything?
No! RemTool runs entirely in your web browser. You just need a modern browser and Python to run a local web server.

### Is my PDF data secure?
Yes! All PDF processing happens in your browser. Only the text content needed for AI suggestions is sent to the AI services you configure. PDFs are never uploaded to our servers.

### What accessibility standards does RemTool support?
- WCAG 2.2 Level AA
- Section 508 (Revised 2018)
- PDF/UA (ISO 14289-1:2014)

## API Keys

### Which API key do I need?
You need at least one:
- **Grok API** (recommended) - Best for most use cases
- **Gemini API** - Good alternative
- **Claude API** - For complex technical content

### Where do I get API keys?
- **Grok**: Visit [X.AI](https://x.ai) and sign up for API access
- **Gemini**: Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Claude**: Visit [Anthropic Console](https://console.anthropic.com/)

### Are API keys stored securely?
API keys are stored in your browser's localStorage and never sent to any server except the AI providers.

## Usage Questions

### What's the maximum PDF size?
The proof of concept supports PDFs up to 50 pages. Larger PDFs may work but could experience performance issues.

### Can I process multiple PDFs?
Currently, RemTool processes one PDF at a time. Batch processing is planned for version 2.0.

### How long does processing take?
- Initial analysis: 10-30 seconds for a 50-page PDF
- AI suggestions: 2-5 seconds per issue
- Export: 30-60 seconds

### Can I save my progress?
Not in the current version. We recommend completing remediation in one session. Progress saving is planned for version 2.0.

## Troubleshooting

### "Cannot find PDF libraries" error
Make sure you're using `index-cdn.html` instead of `index.html`, or run the setup script to download local libraries.

### AI suggestions aren't appearing
1. Check that you've entered valid API keys
2. Verify you have internet connection
3. Check browser console for errors
4. Try refreshing the page

### PDF won't upload
- Ensure the PDF is under 50 pages
- Check that it's a valid PDF file
- Try a different browser
- Make sure JavaScript is enabled

### Export is taking too long
Large or complex PDFs may take longer to export. If it takes more than 2 minutes:
1. Check browser console for errors
2. Try with a smaller PDF
3. Ensure you have enough RAM available

## Technical Questions

### Which browsers are supported?
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Can I use RemTool offline?
Partially. The PDF analysis works offline, but AI suggestions require internet connection.

### How accurate are the AI suggestions?
AI suggestions are about 70-80% accurate for common issues. Always review and modify suggestions as needed.

### Can I customize the AI prompts?
Not in the UI, but developers can modify prompts in `modules/ai-services.js`.

## Future Features

### Will you support other file formats?
Word and HTML document support is being considered for future versions.

### Can I integrate RemTool with my CMS?
API access is planned for version 3.0, which will enable CMS integration.

### Will there be a desktop app?
We're focusing on the web version, but may consider Electron-based desktop apps in the future.

## More Questions?

If your question isn't answered here:
1. Check the [documentation](https://github.com/redmorestudio/remtool/tree/main/docs)
2. Search [existing issues](https://github.com/redmorestudio/remtool/issues)
3. Open a new issue with your question