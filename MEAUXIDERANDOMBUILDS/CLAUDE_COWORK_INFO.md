# Claude Cowork & Claude Code - Installation Guide

## 📋 Overview

There are **two different things** from Anthropic:

### 1. **Claude Cowork** (Desktop App Feature)
- **What it is**: Research preview feature in Claude Desktop app
- **Released**: January 12, 2026
- **Requirements**: 
  - macOS only
  - Claude Desktop app installed
  - Max plan subscription
- **Installation**: Download Claude Desktop app from https://claude.com/download
- **Usage**: Open Claude Desktop app → Go to "Cowork" tab
- **Features**:
  - Direct file access (read/write to local folders)
  - Sub-agent coordination (break down complex tasks)
  - Professional outputs (Excel, PowerPoint, documents)
  - Long-running tasks (no conversation timeouts)

### 2. **Claude Code** (CLI Tool)
- **What it is**: Command-line tool for code assistance
- **Requirements**:
  - macOS 10.15+, Ubuntu 20.04+, or Windows 10+ (with WSL)
  - Node.js 18+ (you have v20.19.6 ✅)
  - 4GB RAM minimum
- **Installation**: `npm install -g @anthropic-ai/claude-code`
- **Usage**: Run `claude` in your project directory
- **Features**:
  - Interactive coding sessions
  - File manipulation
  - Code generation and review
  - Terminal-based workflow

## 🚀 Installation

### Claude Code (CLI Tool) - Recommended for Development

```bash
# Install globally
npm install -g @anthropic-ai/claude-code

# Verify installation
claude --version

# Setup authentication
claude setup

# Use in your project
cd /path/to/your/project
claude
```

### Alternative: Native Installer (Beta)

For macOS/Linux/WSL:
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

For Windows PowerShell:
```powershell
irm https://claude.ai/install.ps1 | iex
```

### Claude Cowork (Desktop App)

1. Download Claude Desktop app: https://claude.com/download
2. Install the .dmg file (drag to Applications)
3. Sign in with Max plan account
4. Open app → Navigate to "Cowork" tab
5. Start using!

## 🔐 Authentication

### Claude Code CLI
- Requires Anthropic API key
- Run `claude setup` to configure
- Can use Claude.ai account or Anthropic Console account

### Claude Cowork (Desktop)
- Uses your Claude.ai account
- Requires Max plan subscription
- Authenticates through Desktop app

## 📝 Notes

- **Claude Cowork** = Desktop app feature (GUI-based, macOS only, Max plan)
- **Claude Code** = CLI tool (terminal-based, cross-platform, API-based)
- Both are different tools for different use cases
- Claude Code is better for development workflows
- Claude Cowork is better for general file management tasks

## 🔗 Resources

- Claude Desktop Download: https://claude.com/download
- Claude Code Docs: https://docs.anthropic.com/en/docs/claude-code/setup
- Claude Code Quickstart: https://docs.anthropic.com/en/docs/claude-code/quickstart
- Cowork Getting Started: https://support.claude.com/en/articles/13345190-getting-started-with-cowork
