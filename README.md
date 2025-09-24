# lcode

A lightning-fast CLI tool to search your git repositories and open them in your favorite editor or command.

[![CI](https://github.com/rkristelijn/lcode/actions/workflows/ci.yml/badge.svg)](https://github.com/rkristelijn/lcode/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/@rkristelijn%2Flcode.svg)](https://www.npmjs.com/package/@rkristelijn/lcode)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## ✨ Features

- 🚀 **Lightning Fast**: Smart caching system with 5-minute TTL
- 🎯 **Interactive Mode**: Fuzzy search with autocomplete
- 🤖 **Automation Ready**: Non-interactive CLI for Amazon Q, CI/CD
- ⚙️ **Highly Configurable**: Custom paths, commands, and depth settings
- 🔧 **Node Version Management**: Built-in NVM and Nix support
- 📊 **Progress Indicators**: Visual feedback during repository scanning
- 🧪 **Production Ready**: 100% test coverage, comprehensive error handling

## 🚀 Quick Start

### Installation

```bash
# Global installation (recommended)
npm install -g @rkristelijn/lcode

# Or use with npx (no installation)
npx @rkristelijn/lcode
```

### Basic Usage

```bash
# Interactive mode - search and select
lcode

# Search specific directory with custom depth
lcode ~/projects 3

# Non-interactive mode - list all repositories
lcode --list

# Select repository by index
lcode --select 0
```

## 📖 Usage Guide

### Interactive Mode (Default)

Perfect for daily development workflow:

```bash
lcode                    # Search current directory
lcode ~/projects         # Search specific directory  
lcode ~ 5               # Search home directory, depth 5
```

### Non-Interactive Mode

Ideal for automation, Amazon Q, and CI/CD:

```bash
# List all repositories with indices
lcode --list
# Output:
# 0: my-awesome-project
# 1: another-project
# 2: third-project

# Select repository by index
lcode --select 0                    # Open first repo with default command
lcode --select 2 "code ."          # Open third repo in VS Code
lcode ~/projects 3 --select 1 zsh  # Custom path, depth, and command
```

### Command Line Arguments

```bash
lcode [path] [maxDepth] [command] [options]
```

**Arguments:**
- `path` - Starting directory (default: current directory)
- `maxDepth` - Search depth 1-10 (default: 3)  
- `command` - Command to execute (default: "code .")

**Options:**
- `--init` - Create configuration file
- `--cleanup` - Remove configuration file
- `--list` - List repositories (non-interactive)
- `--select N` - Select repository by index
- `--help` - Show help information

## ⚙️ Configuration

### Create Configuration File

```bash
lcode --init
```

This creates `~/.lcodeconfig` with these defaults:

```json
{
  "path": "~",
  "maxDepth": 5,
  "execute": "code .",
  "execute2": "zsh", 
  "execute3": "[ -f .nvmrc ] && . ~/.nvm/nvm.sh && nvm use; code ."
}
```

**Advanced users** might prefer this intelligent pattern that auto-detects environments:

```json
{
  "path": "~",
  "maxDepth": 5,
  "execute": "bash -c 'if [ -f flake.nix ]; then nix develop; elif [ -f .nvmrc ]; then . ~/.nvm/nvm.sh && nvm use; fi; zsh'"
}
```

### Configuration Options

| Option | Description | Example |
|--------|-------------|---------|
| `path` | Default search directory | `"~/projects"` |
| `maxDepth` | Maximum search depth (1-10) | `3` |
| `execute` | Primary command | `"code ."` |
| `execute2` | Alternative command | `"zsh"` |
| `execute3` | Advanced command with NVM | `"nvm use && code ."` |

## 🔧 Node Version Management

### NVM (Node Version Manager)

For projects with `.nvmrc` files:

```json
{
  "execute": "[ -f .nvmrc ] && . ~/.nvm/nvm.sh && nvm use; code .",
  "execute2": ". ~/.nvm/nvm.sh && nvm use && npm start",
  "execute3": "nvm use && yarn dev"
}
```

**Common NVM patterns:**
```bash
# Load NVM and use project version, then open VS Code
"[ -f .nvmrc ] && . ~/.nvm/nvm.sh && nvm use; code ."

# Always load NVM, use version, then run command  
". ~/.nvm/nvm.sh && nvm use && your-command"

# Check for .nvmrc first, fallback to default
"[ -f .nvmrc ] && nvm use || nvm use default; code ."
```

### Nix Integration

For Nix-based development environments:

```json
{
  "execute": "nix develop -c code .",
  "execute2": "nix-shell --run 'code .'",
  "execute3": "direnv allow && code ."
}
```

**Nix patterns:**
```bash
# Enter Nix development shell and open editor
"nix develop -c code ."

# Use nix-shell with specific command
"nix-shell --run 'your-command'"

# Use direnv for automatic environment loading
"direnv allow && code ."

# Combine with shell.nix
"nix-shell shell.nix --run 'code .'"
```

### Mixed Environments

For teams using different tools, here's an advanced pattern that automatically detects and uses the right environment:

```json
{
  "path": "~",
  "maxDepth": 5,
  "execute": "bash -c 'if [ -f flake.nix ]; then nix develop; elif [ -f .nvmrc ]; then . ~/.nvm/nvm.sh && nvm use; fi; zsh'"
}
```

This intelligent command:
1. **Checks for `flake.nix`** → enters Nix development shell
2. **Falls back to `.nvmrc`** → loads correct Node.js version with NVM  
3. **Defaults to `zsh`** → opens terminal in project directory

**Other mixed environment patterns:**
```json
{
  "execute": "code .",
  "execute2": "[ -f .nvmrc ] && nvm use; [ -f shell.nix ] && nix develop -c code . || code .",
  "execute3": "direnv allow && code ."
}
```

## 🎯 Real-World Examples

### Development Workflows

```bash
# Quick project switching
lcode --list | grep -i "api"        # Find API projects
lcode --select 2                    # Open the third API project

# Batch operations
for i in {0..5}; do lcode --select $i "git pull"; done
```

### Amazon Q Integration

```bash
# "Open the second repository in VS Code"
lcode --select 1 "code ."

# "List all my projects"  
lcode --list

# "Open the project called 'api' in terminal"
lcode --list | grep -n api          # Find index
lcode --select <index> zsh          # Open in terminal
```

### CI/CD Integration

```bash
# GitHub Actions example
- name: Test all repositories
  run: |
    for i in $(seq 0 $(lcode --list | wc -l)); do
      lcode --select $i "npm test" || exit 1
    done
```

## 🚀 Performance Tips

- **Caching**: Subsequent searches in the same directory are instant (5-minute cache)
- **Depth Optimization**: Use lower `maxDepth` for faster scans in large directories
- **Ignore Patterns**: Automatically ignores `node_modules`, `build`, `dist`, `.git`, etc.
- **Smart Scanning**: Progress indicators show real-time scanning status

## 🧪 Development

### Prerequisites

- Node.js 16+ (tested on 16, 18, 20, 22, 24)
- npm or yarn

### Setup

```bash
git clone https://github.com/rkristelijn/lcode.git
cd lcode
npm install
```

### Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run lint          # Code linting
```

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📊 Comparison

| Feature | lcode | Other Tools |
|---------|-------|-------------|
| **Speed** | ⚡ Cached + Fast | 🐌 Slow scans |
| **Automation** | 🤖 CLI + Interactive | 🚫 Interactive only |
| **Node Management** | ✅ NVM + Nix built-in | ❌ Manual setup |
| **Testing** | ✅ 100% coverage | ❓ Varies |
| **AI Integration** | ✅ Amazon Q ready | ❌ Not supported |

## 🔗 Links

- [npm Package](https://www.npmjs.com/package/@rkristelijn/lcode)
- [GitHub Repository](https://github.com/rkristelijn/lcode)
- [Issues & Feature Requests](https://github.com/rkristelijn/lcode/issues)
- [Contributing Guide](CONTRIBUTING.md)

## 📄 License

ISC License - see [LICENSE](LICENSE) file for details.

## 💖 Support

If lcode saves you time, consider:
- ⭐ [Starring the repository](https://github.com/rkristelijn/lcode)
- 🐛 [Reporting issues](https://github.com/rkristelijn/lcode/issues)
- 💡 [Suggesting features](https://github.com/rkristelijn/lcode/issues/new)
- 💰 [Sponsoring development](https://github.com/sponsors/rkristelijn)

---

**Made with ❤️ by developers, for developers.**
