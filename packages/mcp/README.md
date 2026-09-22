# @nyx-ui/mcp

Read-only Model Context Protocol server for the Nyx UI registry. It lets compatible coding tools discover components, search usage guidance, inspect contracts, and retrieve canonical source without granting project write access.

## Requirements and beta execution

Node.js 22 or newer is required. Run the beta package over standard input/output:

```shell
npx -y @nyx-ui/mcp@beta
```

## Client configuration

Configure an MCP client to launch `npx` with the beta-qualified package. For a JSON-based client configuration:

```json
{
  "mcpServers": {
    "nyx": {
      "command": "npx",
      "args": ["-y", "@nyx-ui/mcp@beta"]
    }
  }
}
```

Restart the client after adding the server and confirm that the four tools below are available.

## Read-only tools

- `list_components` browses registry items by type or status.
- `search_components` finds patterns from names and usage guidance.
- `get_component_contract` returns dependencies, initialization, accessibility requirements, and alternatives.
- `get_component_source` returns canonical files for one known registry item.

The server reads its packaged registry snapshot. It cannot edit a consumer project or execute component source.

## Project links

- [Repository and registry](https://github.com/Pythoholic/nyx-ui)
- [Contributing](https://github.com/Pythoholic/nyx-ui/blob/main/CONTRIBUTING.md)
- [Security policy](https://github.com/Pythoholic/nyx-ui/blob/main/SECURITY.md)
- [Code of Conduct](https://github.com/Pythoholic/nyx-ui/blob/main/CODE_OF_CONDUCT.md)
- [Apache-2.0 license](https://github.com/Pythoholic/nyx-ui/blob/main/LICENSE)
