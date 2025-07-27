# RemTool Troubleshooting Guide

## Common Issues and Solutions

### Installation Issues

#### Python Server Won't Start
**Problem**: `python3 -m http.server 8000` fails

**Solutions**:
1. Check Python installation:
   ```bash
   python3 --version
   ```
2. Try alternative Python commands:
   ```bash
   python -m http.server 8000
   py -m http.server 8000
   ```
3. Check if port 8000 is in use:
   ```bash
   lsof -i :8000  # Mac/Linux
   netstat -ano | findstr :8000  # Windows
   ```
4. Use a different port:
   ```bash
   python3 -m http.server 8080
   ```

#### "Cannot find PDF libraries" Error
**Problem**: Libraries fail to load

**Solutions**:
1. Use CDN version: `index-cdn.html` instead of `index.html`
2. Check internet connection for CDN access
3. Clear browser cache and reload
4. Try a different browser

### API Key Issues

#### "Invalid API Key" Error
**Problem**: API key not accepted

**Solutions**:
1. Verify key is copied completely (no spaces)
2. Check key hasn't expired
3. Ensure you're using the correct API:
   - Grok: Starts with `xai-`
   - Gemini: 39 characters long
   - Claude: Starts with `sk-ant-`
4. Try generating a new key
5. Check API service status

#### API Rate Limit Errors
**Problem**: "Rate limit exceeded" messages

**Solutions**:
1. Wait 60 seconds before retrying
2. Use different AI service temporarily
3. Process fewer issues at once
4. Check API usage dashboard
5. Upgrade API plan if needed

### PDF Upload Problems

#### PDF Won't Upload
**Problem**: File rejected or upload fails

**Solutions**:
1. Check file size (< 50MB recommended)
2. Verify it's a valid PDF:
   ```bash
   file document.pdf  # Should show "PDF document"
   ```
3. Try a different PDF to isolate issue
4. Check browser console for errors (F12)
5. Ensure JavaScript is enabled

#### "PDF Too Complex" Error
**Problem**: Analysis fails on certain PDFs

**Solutions**:
1. Reduce page count to under 50
2. Try flattening the PDF first
3. Remove complex graphics/forms
4. Use a PDF optimizer tool
5. Split into smaller PDFs

### Performance Issues

#### Slow Processing
**Problem**: Analysis takes too long

**Solutions**:
1. Close unnecessary browser tabs
2. Check system resources:
   - RAM usage
   - CPU usage
3. Try different browser:
   - Chrome (recommended)
   - Firefox
   - Safari
4. Disable browser extensions
5. Process smaller PDFs first

#### Browser Freezing
**Problem**: Interface becomes unresponsive

**Solutions**:
1. Wait 30 seconds for processing
2. Check browser console for errors
3. Refresh page (F5)
4. Clear browser cache:
   - Chrome: Ctrl+Shift+Delete
   - Firefox: Ctrl+Shift+Delete
   - Safari: Cmd+Option+E
5. Restart browser

### AI Suggestion Issues

#### No Suggestions Appearing
**Problem**: AI suggestions not loading

**Solutions**:
1. Check API key configuration
2. Verify internet connection
3. Look for errors in console (F12)
4. Try different AI service
5. Check if issue type supports AI

#### Poor Quality Suggestions
**Problem**: Suggestions not helpful

**Solutions**:
1. Provide more context in PDF
2. Try different AI service:
   - Grok: Basic content
   - Gemini: Complex content
   - Claude: Technical content
3. Edit suggestion manually
4. Report issue for improvement

### Export Problems

#### Export Fails
**Problem**: Can't generate output PDF

**Solutions**:
1. Ensure critical issues resolved
2. Check browser console for errors
3. Try with fewer modifications
4. Export without compliance report
5. Save state and retry

#### Corrupted Export
**Problem**: Downloaded PDF won't open

**Solutions**:
1. Check download completed fully
2. Try different PDF viewer
3. Verify file size > 0 bytes
4. Re-export with minimal changes
5. Use PDF repair tool

### Browser-Specific Issues

#### Chrome
- Enable JavaScript in settings
- Disable aggressive ad blockers
- Update to version 90+
- Clear site data if needed

#### Firefox
- Check enhanced tracking protection
- Disable strict mode temporarily
- Update to version 88+
- Try private browsing mode

#### Safari
- Enable JavaScript
- Check Intelligent Tracking Prevention
- Update to version 14+
- Allow pop-ups for downloads

#### Edge
- Similar to Chrome solutions
- Check Windows Defender settings
- Update to version 90+
- Reset Edge settings if needed

## Diagnostic Steps

### 1. Browser Console Check
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for red error messages
4. Take screenshot of errors
5. Include in bug report

### 2. Network Inspection
1. Open Developer Tools (F12)
2. Go to Network tab
3. Reload RemTool
4. Look for failed requests (red)
5. Check API calls specifically

### 3. System Information
Gather for bug reports:
- Browser name and version
- Operating system
- RAM available
- PDF page count
- Error messages
- Console logs

## Getting Help

If these solutions don't work:

1. **Search existing issues**: 
   https://github.com/redmorestudio/remtool/issues

2. **Create detailed bug report** with:
   - Steps to reproduce
   - Expected vs actual behavior
   - System information
   - Screenshots
   - Console logs

3. **Community support**:
   - GitHub Discussions
   - Stack Overflow tag: `remtool`

## Prevention Tips

1. **Regular maintenance**:
   - Clear cache monthly
   - Update browser regularly
   - Check API key validity

2. **Best practices**:
   - Start with small PDFs
   - Save work frequently
   - Process in batches
   - Monitor API usage

3. **Optimal setup**:
   - Use Chrome browser
   - Ensure 4GB+ free RAM
   - Stable internet connection
   - Latest RemTool version

---

*Can't find your issue? Please [report it](https://github.com/redmorestudio/remtool/issues/new) so we can help and improve this guide.*