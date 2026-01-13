#!/bin/bash
# GitHub Repo Setup Script - Safe & Secure

set -e  # Exit on error

echo "🚀 Setting up GitHub repo..."
echo ""

# Check if already a git repo
if [ -d .git ]; then
    echo "✅ Git repo already initialized"
else
    echo "📦 Initializing git repo..."
    git init
fi

# Configure git
echo "⚙️  Configuring git..."
git config user.name "SamPrimeaux" || true
git config user.email "ceosamprimeaux@gmail.com" || true

# Use macOS Keychain for secure token storage
echo "🔐 Setting up secure credential storage..."
git config --global credential.helper osxkeychain

# Add remote (will prompt for token)
echo "🔗 Adding GitHub remote..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/SamPrimeaux/InnerAnimalMedia-Platform.git

# Add .gitignore first (protects you)
echo "📝 Adding .gitignore..."
git add .gitignore
git commit -m "Add .gitignore for security" 2>/dev/null || echo "  (already committed)"

# Add safe files
echo "📦 Adding safe files..."
git add .env.example 2>/dev/null || true
git add src/ dashboard/ shared/ 2>/dev/null || true
git add *.md wrangler.toml 2>/dev/null || true

# Show what will be committed
echo ""
echo "📋 Files to be committed:"
git status --short

echo ""
echo "✅ Ready to commit!"
echo ""
echo "Next steps:"
echo "  1. Review files above"
echo "  2. Run: git commit -m 'Initial commit - InnerAnimalMedia Platform'"
echo "  3. Run: git branch -M main"
echo "  4. Run: git push -u origin main"
echo "     (When prompted, use your GitHub token as password)"
echo ""
