#!/bin/bash
# Setup Claude Code CLI for MeauxIDE, Agent_Sam, and MeauxCLI
# This script installs and configures Claude Code CLI with multiple profiles

set -e

echo "🚀 Setting up Claude Code CLI for MeauxIDE, Agent_Sam, and MeauxCLI..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Install Claude Code CLI globally
echo "📦 Installing Claude Code CLI..."
npm install -g @anthropic-ai/claude-code

# Verify installation
if command -v claude &> /dev/null; then
    CLAUDE_VERSION=$(claude --version)
    echo "✅ Claude Code CLI installed: $CLAUDE_VERSION"
else
    echo "❌ Claude Code CLI installation failed"
    exit 1
fi

# Create profiles directory
PROFILES_DIR="$HOME/.claude-code/profiles"
mkdir -p "$PROFILES_DIR"
echo "📁 Created profiles directory: $PROFILES_DIR"

# Create setup script for multiple accounts
cat > "$PROFILES_DIR/setup-profile.sh" << 'EOF'
#!/bin/bash
# Setup a Claude Code CLI profile
# Usage: ./setup-profile.sh <profile-name> <api-key>

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <profile-name> <api-key>"
    exit 1
fi

PROFILE_NAME="$1"
API_KEY="$2"
PROFILE_DIR="$HOME/.claude-code/profiles/$PROFILE_NAME"

mkdir -p "$PROFILE_DIR"
echo "$API_KEY" > "$PROFILE_DIR/api_key"
echo "✅ Profile '$PROFILE_NAME' created"
EOF

chmod +x "$PROFILES_DIR/setup-profile.sh"

# Create wrapper scripts
BIN_DIR="$HOME/.local/bin"
mkdir -p "$BIN_DIR"

# MeauxCLI wrapper (uses default profile)
cat > "$BIN_DIR/meauxcli" << 'EOF'
#!/bin/bash
# MeauxCLI - Claude Code CLI wrapper for InnerAnimal Media
export CLAUDE_PROFILE="${CLAUDE_PROFILE:-default}"
exec claude "$@"
EOF

# MeauxIDE wrapper (uses ide profile)
cat > "$BIN_DIR/meauxide-claude" << 'EOF'
#!/bin/bash
# MeauxIDE Claude Code CLI wrapper
export CLAUDE_PROFILE="${CLAUDE_PROFILE:-ide}"
exec claude "$@"
EOF

# Agent_Sam wrapper (uses agent profile)
cat > "$BIN_DIR/agent-sam-claude" << 'EOF'
#!/bin/bash
# Agent_Sam Claude Code CLI wrapper
export CLAUDE_PROFILE="${CLAUDE_PROFILE:-agent}"
exec claude "$@"
EOF

chmod +x "$BIN_DIR/meauxcli"
chmod +x "$BIN_DIR/meauxide-claude"
chmod +x "$BIN_DIR/agent-sam-claude"

# Add to PATH if not already there
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
    echo "" >> "$HOME/.zshrc"
    echo "# Claude Code CLI wrappers" >> "$HOME/.zshrc"
    echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> "$HOME/.zshrc"
    echo "✅ Added $BIN_DIR to PATH in ~/.zshrc"
fi

echo ""
echo "✅ Claude Code CLI setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run 'claude setup' to configure your first account"
echo "2. For multiple accounts, use:"
echo "   ~/.claude-code/profiles/setup-profile.sh <name> <api-key>"
echo ""
echo "🔧 Available commands:"
echo "  - meauxcli          - Claude Code CLI (default profile)"
echo "  - meauxide-claude   - Claude Code CLI (IDE profile)"
echo "  - agent-sam-claude  - Claude Code CLI (Agent profile)"
echo ""
echo "💡 Usage examples:"
echo "  meauxcli 'generate a React component'"
echo "  meauxide-claude 'refactor this code'"
echo "  agent-sam-claude 'analyze this error log'"
echo ""
