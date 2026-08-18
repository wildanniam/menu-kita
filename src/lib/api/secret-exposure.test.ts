import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const sourceRoot = join(root, "src");
const forbidden = ["OPENAI_API_KEY", "TAVILY_API_KEY", "tvly-", "sk-proj-"];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx|js|jsx)$/.test(path) ? [path] : [];
  });
}

describe("secret exposure boundaries", () => {
  it("keeps secret identifiers and common key prefixes out of client modules", () => {
    const clientFiles = sourceFiles(sourceRoot).filter((path) => {
      if (path.endsWith(".test.ts") || path.endsWith(".test.tsx")) return false;
      const content = readFileSync(path, "utf8");
      const relativePath = relative(sourceRoot, path);
      const isPublicAppModule =
        relativePath.startsWith(`app${sep}`) &&
        !relativePath.startsWith(join("app", "api"));
      return isPublicAppModule || content.includes('"use client"') || content.includes("'use client'");
    });

    for (const path of clientFiles) {
      const content = readFileSync(path, "utf8");
      for (const value of forbidden) {
        expect(content, `${relative(root, path)} contains ${value}`).not.toContain(
          value,
        );
      }
    }
  });

  it("ignores local environment files in git", () => {
    const gitignore = readFileSync(join(root, ".gitignore"), "utf8");
    expect(gitignore).toMatch(/^\.env\*$/m);
    expect(gitignore).toMatch(/^!\.env\.example$/m);
  });
});
