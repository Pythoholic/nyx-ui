# @nyx-ui/mcp

Read-only Model Context Protocol server for the Nyx UI registry. It lets AI coding tools discover components, search usage guidance, inspect component contracts, and retrieve canonical source without guessing Nyx APIs.

## Run

```sh
npx -y @nyx-ui/mcp
```

The server communicates over standard input/output. Configure a compatible MCP client to run `npx` with the arguments `-y` and `@nyx-ui/mcp`.

## Tools

- `list_components`
- `search_components`
- `get_component_contract`
- `get_component_source`
