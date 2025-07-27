# RemTool - AI-Powered PDF Accessibility Remediation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)](https://www.ecma-international.org/ecma-262/6.0/)
[![PDF.js](https://img.shields.io/badge/PDF.js-4.0+-blue)](https://mozilla.github.io/pdf.js/)

RemTool is a proof-of-concept web application that helps users remediate PDF accessibility issues using AI-powered suggestions. It combines automated detection with human oversight to make PDFs compliant with accessibility standards 50% faster than manual methods.

## 🚀 Features

### Core Functionality
- **Automated Issue Detection**: Identifies 15+ types of accessibility issues
- **AI-Powered Suggestions**: Uses Grok, Gemini, and Claude APIs for intelligent remediation
- **Interactive Split-Screen UI**: Review issues alongside the PDF with real-time highlighting
- **Progressive Enhancement**: AI suggestions load asynchronously while you work
- **Export Compliant PDFs**: Generate accessible PDFs with compliance reports

### Accessibility Issues Detected
- Missing document title and language
- Images without alternative text
- Improper heading hierarchy
- Non-descriptive link text
- Form fields without labels
- Tables without proper headers
- Reading order problems
- And more...

## 🛠️ Quick Start

### Prerequisites
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Python 3.x (for local server)
- At least one AI API key:
  - **Grok API** (required) - [Get from X.AI](https://x.ai)
  - **Gemini API** (optional) - [Get from Google AI Studio](https://makersuite.google.com/app/apikey)
  - **Claude API** (optional) - [Get from Anthropic](https://console.anthropic.com/)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/redmorestudio/remtool.git
cd remtool
```

2. Start the local server:
```bash
python3 -m http.server 8000
```

3. Open your browser to: http://localhost:8000/index-cdn.html

4. Enter your API key(s) and start remediating!

## 📖 Documentation

- [Full Specification](docs/SPECIFICATION.md) - Complete design and implementation details
- [Architecture Diagrams](docs/ARCHITECTURE.md) - Visual system architecture
- [API Reference](docs/API.md) - Module API documentation
- [User Guide](docs/USER_GUIDE.md) - Step-by-step usage instructions

## 🏗️ Project Structure

```
remtool/
├── index-cdn.html      # Main application (CDN libraries)
├── app.js              # Application controller
├── config.js           # Configuration settings
├── modules/            # Core functionality
│   ├── state-manager.js
│   ├── pdf-analyzer.js
│   ├── ai-services.js
│   ├── remediation-ui.js
│   └── pdf-export.js
├── styles/             # CSS files
│   ├── main.css
│   ├── components.css
│   └── responsive.css
└── docs/               # Documentation
```

## 💡 How It Works

1. **Upload**: Drag and drop a PDF (max 50 pages for PoC)
2. **Analyze**: The system detects all accessibility issues
3. **Enhance**: AI services provide contextual suggestions
4. **Review**: Work through issues with helpful guidance
5. **Export**: Download the remediated PDF with a compliance report

## ⌨️ Keyboard Shortcuts

- `Ctrl/Cmd + Enter` - Accept current suggestion
- `Ctrl/Cmd + →` - Next issue
- `Ctrl/Cmd + ←` - Previous issue
- `Escape` - Close current panel

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repo
git clone https://github.com/redmorestudio/remtool.git

# Install development dependencies (if any)
cd remtool

# Start development server
python3 -m http.server 8000
```

## 🐛 Known Limitations

This is a proof of concept with some limitations:
- Maximum 50 pages per PDF
- Browser memory constraints for large files
- Some complex PDF features may not be preserved
- API rate limits may affect processing speed

## 🚦 Roadmap

### Version 2.0 (Planned)
- Remove page limit restrictions
- Batch processing capabilities
- Undo/redo functionality
- Custom remediation templates
- Progress saving and resuming

### Version 3.0 (Future)
- Team collaboration features
- Cloud storage integration
- Custom AI model training
- Mobile application

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) by Mozilla
- [PDF-lib](https://pdf-lib.js.org/) for PDF manipulation
- AI providers: X.AI (Grok), Google (Gemini), Anthropic (Claude)

## 📞 Support

For questions and support:
- Open an [issue](https://github.com/redmorestudio/remtool/issues)
- Check our [FAQ](docs/FAQ.md)
- Review the [troubleshooting guide](docs/TROUBLESHOOTING.md)

---

Built with ❤️ for accessibility by [Redmore Studio](https://github.com/redmorestudio)