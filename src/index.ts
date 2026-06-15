#!/usr/bin/env node
/**
 * mcp-storybook-bridge
 * MCP server that connects Claude to your Storybook instance.
 *
 * Tools exposed:
 *  - list_components      → lists all stories from the Storybook index
 *  - get_component_story  → returns the raw story source/args for a component
 *  - generate_variant     → asks Claude to generate a new variant based on an existing story
 *  - audit_accessibility  → returns a11y violations from Storybook's a11y addon results
 *  - search_components    → fuzzy-searches components by name or tag
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { listComponents } from "./tools/listComponents.js";
import { getComponentStory } from "./tools/getComponentStory.js";
import { generateVariant } from "./tools/generateVariant.js";
import { auditAccessibility } from "./tools/auditAccessibility.js";
import { searchComponents } from "./tools/searchComponents.js";

const STORYBOOK_URL = process.env.STORYBOOK_URL ?? "http://localhost:6006";

const server = new McpServer({
  name: "mcp-storybook-bridge",
  version: "0.1.0",
});

// ─── Tool: list_components ──────────────────────────────────────────────────
server.tool(
  "list_components",
  "List all components and stories available in the connected Storybook instance",
  {
    filter: z
      .string()
      .optional()
      .describe("Optional keyword to filter component names"),
  },
  async ({ filter }) => {
    const result = await listComponents(STORYBOOK_URL, filter);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ─── Tool: get_component_story ──────────────────────────────────────────────
server.tool(
  "get_component_story",
  "Get the full story definition (args, argTypes, source) for a specific component story",
  {
    storyId: z
      .string()
      .describe(
        "The story ID in kebab-case, e.g. 'components-button--primary'"
      ),
  },
  async ({ storyId }) => {
    const result = await getComponentStory(STORYBOOK_URL, storyId);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ─── Tool: generate_variant ─────────────────────────────────────────────────
server.tool(
  "generate_variant",
  "Generate a new story variant for a component based on a natural language description. Returns ready-to-paste TypeScript code.",
  {
    storyId: z
      .string()
      .describe("Base story ID to use as template, e.g. 'components-button--primary'"),
    description: z
      .string()
      .describe(
        "Natural language description of the new variant, e.g. 'a destructive button with loading spinner, disabled state'"
      ),
    framework: z
      .enum(["react", "vue", "angular", "svelte"])
      .default("react")
      .describe("Frontend framework used in this Storybook"),
  },
  async ({ storyId, description, framework }) => {
    const result = await generateVariant(STORYBOOK_URL, storyId, description, framework);
    return {
      content: [{ type: "text", text: result }],
    };
  }
);

// ─── Tool: audit_accessibility ──────────────────────────────────────────────
server.tool(
  "audit_accessibility",
  "Run an accessibility audit on a component story using Storybook's a11y addon and return violations with fix suggestions",
  {
    storyId: z
      .string()
      .describe("Story ID to audit, e.g. 'components-button--primary'"),
  },
  async ({ storyId }) => {
    const result = await auditAccessibility(STORYBOOK_URL, storyId);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ─── Tool: search_components ────────────────────────────────────────────────
server.tool(
  "search_components",
  "Search for components by name, tag, or description across the Storybook index",
  {
    query: z.string().describe("Search query, e.g. 'form input validation'"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .default(10)
      .describe("Max number of results to return"),
  },
  async ({ query, limit }) => {
    const result = await searchComponents(STORYBOOK_URL, query, limit);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ─── Start ──────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `[mcp-storybook-bridge] Connected to Storybook at ${STORYBOOK_URL}`
  );
}

main().catch((err) => {
  console.error("[mcp-storybook-bridge] Fatal error:", err);
  process.exit(1);
});
