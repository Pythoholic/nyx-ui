#!/usr/bin/env node
import { serveStdio } from "@modelcontextprotocol/server/stdio";

import { createNyxMcpServer } from "./server.js";

serveStdio(() => createNyxMcpServer(), {
  onerror(error) {
    console.error(error);
  },
});
