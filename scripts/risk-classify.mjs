#!/usr/bin/env node
/**
 * Classify a change as low / medium / high risk using risk-policy.json.
 *
 *   node scripts/risk-classify.mjs [baseRef]          # diff against baseRef (default origin/main)
 *   node scripts/risk-classify.mjs --files a.ts b.md  # classify an explicit file list (for learning/tests)
 *
 * Prints JSON: { risk, reasons[], files, changedLines }.
 * In GitHub Actions it also writes `risk=<level>` to $GITHUB_OUTPUT.
 * Unknown files default to medium: anything the policy doesn't know about is not "low".
 */
import { execSync } from "node:child_process";
import { readFileSync, appendFileSync } from "node:fs";

const policy = JSON.parse(readFileSync(new URL("../risk-policy.json", import.meta.url), "utf8"));
const ORDER = { low: 0, medium: 1, high: 2 };

// Minimal glob → RegExp (supports **, *, and literal paths).
function toRegex(glob) {
  const re = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*\//g, "§DS§")
    .replace(/\*\*/g, "§D§")
    .replace(/\*/g, "[^/]*")
    .replace(/§DS§/g, "(?:.*/)?")
    .replace(/§D§/g, ".*");
  return new RegExp(`^${re}$`);
}
const match = (file, globs) => globs.some((g) => toRegex(g).test(file));

function changes() {
  const args = process.argv.slice(2);
  if (args[0] === "--files") return { files: args.slice(1), changedLines: 0 };
  const base = args[0] ?? "origin/main";
  const files = execSync(`git diff --name-only ${base}...HEAD`, { encoding: "utf8" }).split("\n").filter(Boolean);
  const stat = execSync(`git diff --numstat ${base}...HEAD`, { encoding: "utf8" });
  const changedLines = stat
    .split("\n")
    .filter(Boolean)
    .reduce((n, line) => {
      const [a, d] = line.split("\t");
      return n + (Number(a) || 0) + (Number(d) || 0);
    }, 0);
  return { files, changedLines };
}

const { files, changedLines } = changes();
let risk = "low";
const reasons = [];
const bump = (level, why) => {
  if (ORDER[level] > ORDER[risk]) risk = level;
  if (level !== "low") reasons.push(`${level}: ${why}`);
};

for (const f of files) {
  if (match(f, policy.high)) bump("high", `${f} is a protected path`);
  else if (match(f, policy.medium)) bump("medium", `${f} touches server/config code`);
  else if (!match(f, policy.low)) bump("medium", `${f} is not covered by the policy`);
}

const { low, medium } = policy.limits;
if (files.length > medium.maxFiles || changedLines > medium.maxChangedLines)
  bump("high", `large change (${files.length} files, ${changedLines} lines)`);
else if (files.length > low.maxFiles || changedLines > low.maxChangedLines)
  bump("medium", `moderate size (${files.length} files, ${changedLines} lines)`);

if (policy.requireTestsWithCodeChange) {
  const code = files.some((f) => /^(server\/src|web\/src)\//.test(f) && !/\.test\.ts$/.test(f));
  const tests = files.some((f) => /^(e2e\/|server\/test\/)|\.test\.ts$/.test(f));
  if (code && !tests) bump("medium", "code changed without any test changes");
}

const result = { risk, reasons, files, changedLines };
console.log(JSON.stringify(result, null, 2));
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `risk=${risk}\n`);
