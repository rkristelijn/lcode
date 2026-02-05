# lcode MCP Integration for Kiro CLI

lcode provides native Model Context Protocol (MCP) support, allowing AI assistants like Kiro to discover and interact with your repositories through structured tools.

## Quick Setup

### Global Installation (Recommended)

Install lcode globally and configure the MCP server:

```bash
# Install lcode globally
npm install -g @rkristelijn/lcode

# Add to Kiro CLI MCP configuration
# Create or edit ~/.kiro/settings/mcp.json
{
  "mcpServers": {
    "lcode": {
      "command": "lcode-mcp",
      "args": [],
      "env": {}
    }
  }
}
```

### Local Development Setup

For local development or testing:

```bash
# Clone and install
git clone https://github.com/rkristelijn/lcode.git
cd lcode
npm install

# Configure MCP to use local server
# Edit .kiro/settings/mcp.json in your project
{
  "mcpServers": {
    "lcode": {
      "command": "node",
      "args": ["/path/to/lcode/mcp-server.mjs"],
      "env": {}
    }
  }
}
```

## MCP Tools

The lcode MCP server exposes two tools:

### `list_repos`
Lists all git repositories with language detection and filtering.

**Parameters:**
- `path` (optional) - Directory to search (default: from config)
- `maxDepth` (optional) - Search depth 1-10 (default: from config)
- `language` (optional) - Filter by language(s), comma-separated (e.g., "ts,js")

**Returns:** Array of repositories with index, name, path, languages, and description.

### `select_repo`
Gets detailed information about a specific repository.

**Parameters:**
- `index` (optional) - Repository index from list_repos
- `name` (optional) - Repository name
- `path` (optional) - Search path (default: from config)
- `maxDepth` (optional) - Search depth (default: from config)

**Returns:** Repository details including full path and metadata.

## Usage with Kiro

Once configured, Kiro can use lcode tools naturally:

```
User: "Find me 4 TypeScript repos"
Kiro: [Uses list_repos with language="ts"]

User: "Show all Python projects"
Kiro: [Uses list_repos with language="python"]

User: "List Java or Kotlin projects"
Kiro: [Uses list_repos with language="java,kotlin"]

User: "Get details about the first repo"
Kiro: [Uses select_repo with index=0]
```

## Benefits

- ✅ Native MCP protocol support
- ✅ Structured tool interface for AI assistants
- ✅ Language filtering built-in
- ✅ Fast repository discovery with caching
- ✅ Works with any MCP-compatible AI tool
- ✅ Type-safe tool definitions

## Example Workflows

### Find TypeScript projects
```
User: "Find me TypeScript repositories"
→ Kiro calls: list_repos({ language: "ts" })
→ Returns: Structured list with indices, paths, and descriptions
```

### Multi-language search
```
User: "Show me Java or Kotlin projects"
→ Kiro calls: list_repos({ language: "java,kotlin" })
→ Returns: Filtered list of matching repositories
```

### Get repository details
```
User: "Tell me about repo #5"
→ Kiro calls: select_repo({ index: 5 })
→ Returns: Full details including path and metadata
```

## Configuration

lcode uses `~/.lcodeconfig` for default settings:

```json
{
  "path": "~",
  "maxDepth": 5,
  "execute": "code .",
  "execute2": "zsh"
}
```

The MCP server respects these defaults when parameters are not provided.

## Troubleshooting

### MCP server not loading
```bash
# Test the MCP server directly
node mcp-server.mjs

# Check Kiro MCP status
kiro-cli mcp list
```

### Tools not appearing
- Restart Kiro CLI after updating mcp.json
- Verify lcode-mcp is in your PATH (for global install)
- Check node version (requires Node.js 16+)

### Language filtering not working
- Use lowercase language codes: "ts", "python", "java"
- Multiple languages: "ts,js" (comma-separated, no spaces)
- Check supported languages in README.md
