#!/bin/bash

# Usage: ./run_python_mac.sh <directory> <command> [args...]

DIR="$1"
shift
CMD="$@"

cd "$DIR" || exit 1

echo "📂 Working Directory: $(pwd)"

# Check for Mac-compatible venv
if [ ! -d "venv_mac" ]; then
    echo "⚠️  Mac Python environment not found. Creating 'venv_mac'..."
    python3 -m venv venv_mac
    
    echo "🔌 Activating environment..."
    source venv_mac/bin/activate
    
    echo "📦 Installing dependencies..."
    if [ -f "requirements.txt" ]; then
        # Create a mac-compatible requirements file
        grep -v "tensorflow_intel" requirements.txt > requirements.mac.txt
        pip install -r requirements.mac.txt
    fi
else
    echo "✅ Found 'venv_mac'. Activating..."
    source venv_mac/bin/activate
fi

echo "🚀 Starting: $CMD"
eval "$CMD"
