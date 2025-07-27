#!/bin/bash
# RemTool Start Script

echo "Starting RemTool local server..."
echo "Navigate to http://localhost:8000/index-cdn.html"
echo "Press Ctrl+C to stop the server"
echo ""

cd "$(dirname "$0")"
python3 -m http.server 8000