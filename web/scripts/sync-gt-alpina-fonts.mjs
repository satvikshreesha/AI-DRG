#!/usr/bin/env node
/**
 * Copy GT Alpina Standard trial OTFs into public/fonts/gt-alpina/.
 * Download from https://www.grillitype.com/typeface/gt-alpina (trial fonts).
 */
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const destDir = resolve(__dirname, "../public/fonts/gt-alpina");

const WANTED = [
  "GT-Alpina-Standard-Regular.otf",
  "GT-Alpina-Standard-Regular-Italic.otf",
  "GT-Alpina-Standard-Medium.otf",
  "GT-Alpina-Standard-Medium-Italic.otf",
];

const SEARCH_ROOTS = [
  join(homedir(), "Downloads"),
  join(homedir(), "Desktop"),
  destDir,
];

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    let st;
    try {
      st = statSync(path);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (/node_modules|\.git/.test(name)) continue;
      walk(path, files);
    } else if (/\.otf$/i.test(name) && /alpina/i.test(name)) {
      files.push(path);
    }
  }
  return files;
}

function normalizeName(filePath) {
  const base = basename(filePath);
  for (const wanted of WANTED) {
    if (base.toLowerCase() === wanted.toLowerCase()) return wanted;
    if (base.toLowerCase().replace(/-trial/i, "") === wanted.toLowerCase()) {
      return wanted;
    }
  }
  const match = base.match(
    /GT[- ]?Alpina[- ]?Standard[- ](Regular|Medium)(?:[- ](Italic))?/i
  );
  if (!match) return null;
  const weight = match[1][0].toUpperCase() + match[1].slice(1).toLowerCase();
  const italic = match[2] ? "-Italic" : "";
  return `GT-Alpina-Standard-${weight}${italic}.otf`;
}

mkdirSync(destDir, { recursive: true });

const found = new Map();
for (const root of SEARCH_ROOTS) {
  for (const file of walk(root)) {
    const destName = normalizeName(file);
    if (destName && !found.has(destName)) found.set(destName, file);
  }
}

if (found.size === 0) {
  console.error(
    "No GT Alpina OTF files found. Download trial fonts from:\n" +
      "  https://www.grillitype.com/typeface/gt-alpina\n" +
      "Then run: npm run sync-fonts"
  );
  process.exit(1);
}

for (const [destName, src] of found) {
  const dest = join(destDir, destName);
  cpSync(src, dest);
  console.log(`Copied ${basename(src)} → ${destName}`);
}

const missing = WANTED.filter((name) => !found.has(name));
if (missing.length) {
  console.warn("Optional cuts not found:", missing.join(", "));
}

console.log("\nDone. Restart dev server if fonts do not appear.");
