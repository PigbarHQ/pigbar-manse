import { readFileSync } from "node:fs";
import { join } from "node:path";

type BlueprintPromptName =
  | "blueprint-system"
  | "blueprint-philosophy"
  | "blind-classical"
  | "editorial-style"
  | "classical-analysis-user"
  | "portrait-book-user";

type LoadedBlueprintPrompt = {
  content: string;
  version: string;
};

const promptCache = new Map<BlueprintPromptName, LoadedBlueprintPrompt>();

function parseMarkdownPrompt(raw: string): LoadedBlueprintPrompt {
  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  const frontmatter = frontmatterMatch?.[1] ?? "";
  const content = frontmatterMatch ? raw.slice(frontmatterMatch[0].length) : raw;
  const version = frontmatter.match(/^version:\s*(.+)$/m)?.[1]?.trim() ?? "0.0.0";

  return {
    content: content.trim(),
    version,
  };
}

export function loadBlueprintPrompt(name: BlueprintPromptName): LoadedBlueprintPrompt {
  const cached = promptCache.get(name);

  if (cached) {
    return cached;
  }

  const filePath = join(process.cwd(), "src", "lib", "blueprint", "prompts", `${name}.md`);
  const loaded = parseMarkdownPrompt(readFileSync(filePath, "utf8"));

  promptCache.set(name, loaded);
  return loaded;
}

export function renderBlueprintPrompt(name: BlueprintPromptName, values: Record<string, string> = {}) {
  let content = loadBlueprintPrompt(name).content;

  Object.entries(values).forEach(([key, value]) => {
    content = content.split(`{{${key}}}`).join(value);
  });

  return content;
}
