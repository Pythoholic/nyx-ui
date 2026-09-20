# AI integration

Nyx treats `registry/registry.json` as the machine-readable source of truth for component selection. The `@nyx-ui/mcp` package exposes that registry through a local, read-only Model Context Protocol server so an AI coding tool can discover Nyx instead of guessing its APIs from training data.

The portable `skills/nyx-ui` Agent Skill supplies the complementary workflow: inspect the consumer project, discover components before composing, preserve the selected contract, and verify the completed integration.

```shell
npx skills add Pythoholic/nyx-stealth --skill nyx-ui
```

## Current scope

The first server deliberately exposes only four read operations:

- `list_components` enumerates registry items with optional type and status filters.
- `search_components` searches names plus declared usage guidance.
- `get_component_contract` returns the authoritative dependencies, initializer, accessibility requirements, and related patterns for one item.
- `get_component_source` returns only files declared by a known registry item.

The server cannot edit an application, install packages, execute registry code, or read arbitrary paths. An agent remains responsible for applying a selected component to the user's project through its normal, reviewable file tools.

## Build and verify locally

```shell
pnpm install
pnpm mcp:build
pnpm --filter @nyx-ui/mcp test
```

The built entry is `packages/mcp/dist/cli.js`. Its bundled registry snapshot is generated from the root registry on every build.

## Connect Codex

Codex supports project-scoped MCP configuration in `.codex/config.toml` for trusted projects. Use an absolute working directory in your local configuration:

```toml
[mcp_servers.nyx]
command = "node"
args = ["packages/mcp/dist/cli.js"]
cwd = "/absolute/path/to/nyx-stealth"
enabled_tools = [
  "list_components",
  "search_components",
  "get_component_contract",
  "get_component_source",
]
default_tools_approval_mode = "auto"
```

Restart Codex after changing the configuration, then use `/mcp` to confirm that `nyx` and its four tools are available.

## Connect Claude Code

Claude Code can load a project-scoped `.mcp.json`. Build the package first, then add:

```json
{
  "mcpServers": {
    "nyx": {
      "type": "stdio",
      "command": "node",
      "args": ["packages/mcp/dist/cli.js"]
    }
  }
}
```

Run Claude Code from the repository root so the relative entry path resolves correctly. Keep the configuration local until the package is published; after publication both clients can launch the package binary directly instead of depending on a repository checkout.

## Expected agent workflow

1. Search the registry using the user's intent.
2. Read the selected component contract.
3. Compare related components when the contract suggests alternatives.
4. Fetch canonical source only after selection.
5. Adapt the source while preserving dependencies, initialization, and accessibility requirements.

This sequence keeps discovery responses compact and makes the final source retrieval an explicit decision.
