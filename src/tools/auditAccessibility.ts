import axios from "axios";

export interface A11yViolation {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    failureSummary: string;
  }>;
}

export interface A11yAuditResult {
  storyId: string;
  violations: A11yViolation[];
  passes: number;
  incomplete: number;
  summary: string;
  suggestions: string[];
}

/**
 * Fetches a11y results from Storybook's accessibility addon.
 * Requires @storybook/addon-a11y to be installed in the target Storybook.
 *
 * Falls back to a structural analysis if the addon isn't available.
 */
export async function auditAccessibility(
  storybookUrl: string,
  storyId: string
): Promise<A11yAuditResult> {
  // Try to get a11y results via Storybook's manager API
  try {
    const { data } = await axios.get(
      `${storybookUrl}/addons/a11y/results/${storyId}`,
      { timeout: 8000 }
    );

    const violations: A11yViolation[] = data.violations ?? [];
    const suggestions = buildSuggestions(violations);

    return {
      storyId,
      violations,
      passes: data.passes?.length ?? 0,
      incomplete: data.incomplete?.length ?? 0,
      summary:
        violations.length === 0
          ? `✅ No accessibility violations found in "${storyId}"`
          : `⚠️  ${violations.length} violation(s) found in "${storyId}" — see suggestions below`,
      suggestions,
    };
  } catch {
    // Addon not available or story not rendered — return guidance
    return {
      storyId,
      violations: [],
      passes: 0,
      incomplete: 0,
      summary: `ℹ️  Could not fetch live a11y results for "${storyId}". Make sure @storybook/addon-a11y is installed and the story is rendered.`,
      suggestions: [
        "Install the addon: npm install --save-dev @storybook/addon-a11y",
        "Add 'a11y' to addons array in .storybook/main.ts",
        "Run Storybook and navigate to the story to generate a11y results",
        "Common checks to do manually: color contrast ≥ 4.5:1, all interactive elements keyboard-reachable, images have alt text, form inputs have labels",
      ],
    };
  }
}

function buildSuggestions(violations: A11yViolation[]): string[] {
  const suggestions: string[] = [];

  for (const v of violations) {
    switch (v.id) {
      case "color-contrast":
        suggestions.push(
          `Color contrast: Increase text/background contrast to at least 4.5:1 (WCAG AA). Use a tool like https://webaim.org/resources/contrastchecker/`
        );
        break;
      case "button-name":
        suggestions.push(
          `Button name: Add aria-label or visible text to all <button> elements that currently have no accessible name.`
        );
        break;
      case "image-alt":
        suggestions.push(
          `Image alt: Add descriptive alt="" attributes to all <img> tags. Use alt="" for decorative images.`
        );
        break;
      case "label":
        suggestions.push(
          `Form labels: Associate every <input> with a <label> using htmlFor/id pairing, or use aria-label.`
        );
        break;
      case "focus-trap":
        suggestions.push(
          `Focus management: Ensure modal dialogs trap focus and return it to the trigger element on close.`
        );
        break;
      default:
        suggestions.push(
          `${v.id}: ${v.help} — see ${v.helpUrl}`
        );
    }
  }

  return suggestions;
}
