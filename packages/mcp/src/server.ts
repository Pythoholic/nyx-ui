import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

import { NyxRegistryStore } from "./registry.js";
import type { NyxRegistryItem } from "./types.js";

function summary(item: NyxRegistryItem): Record<string, unknown> {
  return {
    name: item.name,
    type: item.type,
    status: item.status,
    description: item.description,
    requires: item.requires,
  };
}

function textResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

function errorResult(error: unknown) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: error instanceof Error ? error.message : String(error) }],
  };
}

export async function createNyxMcpServer(options: { registryRoot?: string } = {}): Promise<McpServer> {
  const store = await NyxRegistryStore.load(options.registryRoot);
  const server = new McpServer(
    { name: "nyx-ui", version: store.manifest.version },
    {
      instructions:
        "Search the Nyx registry before choosing a component. Read its contract before requesting source. Preserve the declared dependencies, initializer, and accessibility requirements.",
    },
  );

  server.registerTool(
    "list_components",
    {
      title: "List Nyx components",
      description: "List Nyx registry items, optionally filtered by exact type or stability status.",
      inputSchema: z.object({
        type: z.string().min(1).optional(),
        status: z.string().min(1).optional(),
        limit: z.number().int().min(1).max(200).default(50),
      }),
    },
    async (input) => textResult(store.list(input).map(summary)),
  );

  server.registerTool(
    "search_components",
    {
      title: "Search Nyx components",
      description: "Search component names and AI-readable usage guidance in the Nyx registry.",
      inputSchema: z.object({
        query: z.string().min(1),
        limit: z.number().int().min(1).max(50).default(10),
      }),
    },
    async ({ query, limit }) => textResult(store.search(query, limit).map(summary)),
  );

  server.registerTool(
    "get_component_contract",
    {
      title: "Get a Nyx component contract",
      description: "Get authoritative usage, dependency, initialization, accessibility, and relationship metadata for one registry item.",
      inputSchema: z.object({ name: z.string().min(1) }),
    },
    async ({ name }) => {
      try {
        return textResult(store.get(name));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "get_component_source",
    {
      title: "Get canonical Nyx component source",
      description: "Read the canonical source files for a known registry item after inspecting its contract.",
      inputSchema: z.object({ name: z.string().min(1) }),
    },
    async ({ name }) => {
      try {
        return textResult({ name, files: await store.source(name) });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  return server;
}
