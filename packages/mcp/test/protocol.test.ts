import { resolve } from "node:path";

import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { afterEach, describe, expect, it } from "vitest";

const packageRoot = resolve(import.meta.dirname, "..");
const clients: Client[] = [];

function textOf(result: Awaited<ReturnType<Client["callTool"]>>): string {
  const block = result.content.find((entry) => entry.type === "text");
  if (!block || block.type !== "text") throw new Error("Expected an MCP text response.");
  return block.text;
}

async function connect(): Promise<Client> {
  const client = new Client({ name: "nyx-mcp-tests", version: "0.1.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [resolve(packageRoot, "dist", "cli.js")],
    cwd: packageRoot,
    stderr: "pipe",
  });
  await client.connect(transport);
  clients.push(client);
  return client;
}

afterEach(async () => {
  await Promise.all(clients.splice(0).map((client) => client.close()));
});

describe("Nyx MCP stdio protocol", () => {
  it("advertises the read-only registry tools", async () => {
    const client = await connect();

    const { tools } = await client.listTools();

    expect(tools.map(({ name }) => name)).toEqual([
      "list_components",
      "search_components",
      "get_component_contract",
      "get_component_source",
    ]);
  });

  it("searches and reads an enriched component contract", async () => {
    const client = await connect();

    const search = await client.callTool({
      name: "search_components",
      arguments: { query: "short clarification keyboard focus" },
    });
    const contract = await client.callTool({
      name: "get_component_contract",
      arguments: { name: "tooltip" },
    });

    expect(JSON.parse(textOf(search))[0].name).toBe("tooltip");
    expect(JSON.parse(textOf(contract))).toMatchObject({
      name: "tooltip",
      initializer: { function: "initTooltips" },
    });
  });

  it("returns a tool error instead of reading an arbitrary path", async () => {
    const client = await connect();

    const result = await client.callTool({
      name: "get_component_source",
      arguments: { name: "../package.json" },
    });

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain("Unknown Nyx registry item");
  });
});
