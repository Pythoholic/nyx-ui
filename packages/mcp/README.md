# @nyx-ui/mcp

Read-only Model Context Protocol server for the Nyx UI registry. It lets AI coding tools discover components, search usage guidance, inspect component contracts, and retrieve canonical source without guessing Nyx APIs.

## Run locally

```sh
pnpm --filter @nyx-ui/mcp build
node packages/mcp/dist/cli.js
```

The server communicates over standard input/output. Point a compatible MCP client at the `nyx-mcp` binary after publication, or at the built file while developing locally.

## Tools

- `list_components`
- `search_components`
- `get_component_contract`
- `get_component_source`

Set `NYX_REGISTRY_ROOT` to use a different registry directory containing `registry.json` and its referenced files.
