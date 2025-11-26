#!/bin/bash

# Code2Video Web Interface Startup Script

echo "======================================"
echo "  Code2Video Web Interface Launcher  "
echo "======================================"
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Navigate to web-interface directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/web-interface"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client && npm install && cd ..
    echo ""
fi

# Start the server
echo "Starting Code2Video Web Interface..."
echo "Server: http://localhost:3000"
echo "Frontend Dev: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev
