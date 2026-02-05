# lcode MCP Integration for Kiro CLI

## Quick Setup

Add lcode as an MCP tool to Kiro CLI:

```bash
kiro-cli mcp add \
  --name "lcode" \
  --scope global \
  --command "npx" \
  --args "@rkristelijn/lcode"
```

Or manually add to `~/.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "lcode": {
      "command": "npx",
      "args": ["@rkristelijn/lcode"],
      "disabled": false
    }
  }
}
```

## Usage with Kiro

Once configured, you can use lcode directly in Kiro chat:

```
"List all TypeScript repositories in ~/git/hub"
→ Uses: npx @rkristelijn/lcode ~/git/hub 2 --list --lang ts

"Show me all Python projects"
→ Uses: npx @rkristelijn/lcode ~ 3 --list --lang python

"Find Java or Kotlin projects"
→ Uses: npx @rkristelijn/lcode ~ 3 --list --lang java,kotlin

"Open the first TypeScript project in VS Code"
→ Uses: npx @rkristelijn/lcode ~ 3 --lang ts --select 0 "code ."
```

## Available Commands

All lcode commands work through npx:

```bash
# List repositories
npx @rkristelijn/lcode ~/git/hub 2 --list

# Filter by language
npx @rkristelijn/lcode ~/git/hub 2 --list --lang ts

# Multiple languages
npx @rkristelijn/lcode ~/git/hub 2 --list --lang ts,js

# Select and open
npx @rkristelijn/lcode ~/git/hub 2 --select 0 "code ."

# Help
npx @rkristelijn/lcode --help
```

## Benefits

- ✅ No installation required (uses npx)
- ✅ Always uses latest version
- ✅ Works with all lcode features
- ✅ Language filtering built-in
- ✅ Fast repository discovery

## Example Workflows

### Find and open a project
```
User: "Show me all my TypeScript projects"
Kiro: [Lists TypeScript repos with indices]
User: "Open the second one"
Kiro: [Executes: npx @rkristelijn/lcode --select 1 --lang ts]
```

### Language-specific search
```
User: "Find all Python projects in my home directory"
Kiro: [Executes: npx @rkristelijn/lcode ~ 3 --list --lang python]
```

### Multi-language filtering
```
User: "Show me Java or Kotlin projects"
Kiro: [Executes: npx @rkristelijn/lcode ~ 3 --list --lang java,kotlin]
```
