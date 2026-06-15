# LinkedIn Post — mcp-storybook-bridge launch

---

I got tired of context-switching between my Storybook and my AI assistant.

So I built a bridge. 🔌

**mcp-storybook-bridge** is an open source MCP server that connects Claude directly to your Storybook instance.

From a single chat, you can now ask Claude to:

→ List every component in your design system
→ Read story definitions, args, and argTypes
→ Generate new story variants from a description in plain English
→ Audit accessibility violations with fix suggestions

Real example from my workflow:

> "Generate a Button variant: outline style, icon on the left, loading state"

Claude reads the existing Button story, understands the argTypes, and outputs a complete CSF3 TypeScript story — ready to paste.

No more copying story IDs. No more re-explaining your component API on every prompt.

---

Setup takes 2 minutes:

```bash
npm install -g @jonbai/mcp-storybook-bridge
```

Then add it to your claude_desktop_config.json pointing at localhost:6006.

Full docs + source: github.com/jonbai/mcp-storybook-bridge

---

This is v0.1.0. Planning to add:
- Token diff detection (design system drift alerts)
- Automatic PR creation via GitHub MCP
- Angular Storybook improvements

If you work with design systems day to day — try it and let me know what's missing.

#frontend #designsystems #storybook #claude #mcp #typescript #react #opensource #a11y #aitools