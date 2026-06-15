import axios from "axios";
import { getComponentStory } from "./getComponentStory.js";

const FRAMEWORK_IMPORTS: Record<string, string> = {
  react: `import type { Meta, StoryObj } from '@storybook/react';`,
  vue: `import type { Meta, StoryObj } from '@storybook/vue3';`,
  angular: `import type { Meta, StoryObj } from '@storybook/angular';`,
  svelte: `import type { Meta, StoryObj } from '@storybook/svelte';`,
};

export async function generateVariant(
  storybookUrl: string,
  storyId: string,
  description: string,
  framework: string
): Promise<string> {
  // 1. Fetch the base story details to give Claude context
  let baseStory: Record<string, unknown> = {};
  try {
    const details = await getComponentStory(storybookUrl, storyId);
    baseStory = details as unknown as Record<string, unknown>;
  } catch {
    // If we can't fetch, generate without context
    baseStory = { id: storyId, note: "Could not fetch base story details" };
  }

  const frameworkImport =
    FRAMEWORK_IMPORTS[framework] ?? FRAMEWORK_IMPORTS.react;

  // 2. Build the prompt for Claude
  const prompt = `You are a senior frontend developer expert in Storybook CSF3 format.

Base story context:
${JSON.stringify(baseStory, null, 2)}

Framework: ${framework}
Framework import: ${frameworkImport}

Task: Generate a new Storybook story variant with this description:
"${description}"

Rules:
- Use CSF3 format (export const VariantName: StoryObj<typeof Component> = { ... })
- Keep args minimal and realistic
- Add a meaningful play() function if interaction testing makes sense
- Include JSDoc comment explaining the variant
- Output ONLY the TypeScript code, no explanation

Output the complete story variant code:`;

  // 3. Call Claude API (uses the injected key from the MCP host environment)
  // When running as an MCP server inside Claude Desktop, the ANTHROPIC_API_KEY
  // env var is set automatically. For standalone use, set it manually.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return `// ⚠️  ANTHROPIC_API_KEY not set.\n// Set it in your environment to enable AI variant generation.\n// \n// Manual variant template based on story "${storyId}":\n\n${frameworkImport}\n\n/** ${description} */\nexport const NewVariant: StoryObj = {\n  args: {\n    // Add your args based on the base story\n    ...${JSON.stringify(baseStory.args ?? {}, null, 4)}\n  },\n};`;
  }

  const { data } = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      timeout: 30000,
    }
  );

  const text =
    data.content
      ?.filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("") ?? "// No output generated";

  // Strip markdown fences if Claude wrapped it
  return text
    .replace(/^```(?:typescript|tsx|ts)?\n/m, "")
    .replace(/\n```$/m, "")
    .trim();
}
