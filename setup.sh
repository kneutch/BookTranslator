#!/bin/bash
# Setup verification and installation script for BookTranslator

set -e

echo "🔍 BookTranslator Setup Verification"
echo "===================================="
echo ""

# Check Python
echo "Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✅ $PYTHON_VERSION found"
else
    echo "❌ Python 3 not found. Please install Python 3.10 or higher."
    exit 1
fi

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js $NODE_VERSION found"
else
    echo "❌ Node.js not found. Please install Node.js 18 or higher."
    exit 1
fi

# Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm $NPM_VERSION found"
else
    echo "❌ npm not found. Please install npm."
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install Python dependencies
echo "Installing Python packages..."
cd aligner
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    echo "✅ Python packages installed"
else
    echo "❌ requirements.txt not found in aligner/"
    exit 1
fi

# Try to install a-studio
echo ""
echo "Installing a-studio from GitHub..."
echo "(This may take a few minutes...)"
if pip install git+https://github.com/averkij/a-studio.git; then
    echo "✅ a-studio installed"
else
    echo "⚠️  Warning: a-studio installation failed or not available"
    echo "   You may need to install it manually or adapt the alignment code"
fi

cd ..

# Install Node.js dependencies
echo ""
echo "Installing Node.js packages..."
cd node
if [ -f "package.json" ]; then
    npm install
    echo "✅ Node.js packages installed"
else
    echo "❌ package.json not found in node/"
    exit 1
fi

cd ..

# Check .env file
echo ""
echo "Checking configuration..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    if grep -q "your_openai_api_key_here" .env; then
        echo "⚠️  Warning: Please update your OpenAI API key in .env"
    else
        echo "✅ OpenAI API key appears to be set"
    fi
else
    echo "❌ .env file not found"
    exit 1
fi

# Check for input PDFs
echo ""
echo "Checking input files..."
if [ -f "data/english.pdf" ]; then
    echo "✅ data/english.pdf found"
else
    echo "⚠️  data/english.pdf not found - you need to add this file"
fi

if [ -f "data/german.pdf" ]; then
    echo "✅ data/german.pdf found"
else
    echo "⚠️  data/german.pdf not found - you need to add this file"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your PDF files to the data/ directory"
echo "2. Update your OpenAI API key in .env (if not done)"
echo "3. Start the alignment service: cd aligner && uvicorn app:app --port 8000"
echo "4. In another terminal, run: cd node && npm start"
echo ""
