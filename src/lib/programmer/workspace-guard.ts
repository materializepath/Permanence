import path from "node:path";

const PROTECTED_EXACT_FILES = new Set([
  ".gitignore",
  ".hermes-manifest.md",
  "eslint.config.mjs",
  "next-env.d.ts",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "postcss.config.mjs",
  "tsconfig.json",
  "src/app/layout.tsx",
  "src/app/api/pearls/route.ts",
  "src/app/api/professor/chat/route.ts",
  "src/app/api/programmer/chat/route.ts",
  "src/app/api/thread/route.ts",
  "src/lib/hermes/client.ts",
  "src/lib/programmer/hermes-env.ts",
  "src/lib/programmer/system-prompt.ts",
  "src/lib/programmer/workspace-guard.ts",
  "scripts/generate-hermes-manifest.mjs",
]);

const PROTECTED_PREFIXES = [
  ".cursor/",
  ".data/",
  ".git/",
  "node_modules/",
  "src/app/api/pearls/",
  "src/app/api/professor/",
  "src/app/api/programmer/",
  "src/app/api/thread/",
  "src/lib/pearls/",
  "src/lib/programmer/",
];

export function getWorkspaceRoot() {
  return process.cwd();
}

export function toRelativeWorkspacePath(filePath: string) {
  return normalizePath(path.relative(getWorkspaceRoot(), filePath));
}

export function toAbsoluteWorkspacePath(relativePath: string) {
  return path.join(getWorkspaceRoot(), relativePath);
}

export function isProtectedPath(relativePath: string) {
  return Boolean(getProtectedPathReason(relativePath));
}

export function getProtectedPathReason(relativePath: string) {
  const normalizedPath = normalizePath(relativePath);

  if (
    normalizedPath.startsWith("..") ||
    normalizedPath.startsWith("/") ||
    path.isAbsolute(normalizedPath)
  ) {
    return "paths must be relative to the workspace root.";
  }

  if (normalizedPath.startsWith(".env")) {
    return "environment and secret files are protected.";
  }

  if (PROTECTED_EXACT_FILES.has(normalizedPath)) {
    return "this file is part of the protected application foundation.";
  }

  if (PROTECTED_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix))) {
    return "this path is part of the protected data or project core.";
  }

  return null;
}

export function findFirstProtectedPath(paths: string[]) {
  for (const candidate of paths) {
    const reason = getProtectedPathReason(candidate);

    if (reason) {
      return { path: candidate, reason };
    }
  }

  return null;
}

function normalizePath(filePath: string) {
  return filePath.split(path.sep).join("/");
}
