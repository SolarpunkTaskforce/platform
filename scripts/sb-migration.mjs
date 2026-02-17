#!/usr/bin/env node
/**
 * Create a new Supabase migration file with a strictly increasing timestamp.
 * next_ts = (max existing YYYYMMDDHHMMSS) + 1
 *
 * Usage:
 *   pnpm sb:migration "add_entity_contributors"
 */

import fs from "node:fs";
import path from "node:path";

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");

function die(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function parseTs(filename) {
  const base = path.basename(filename);
  const m = base.match(/^(\d{14})_.+\.sql$/);
  if (!m) return null;
  return Number(m[1]);
}

function pad14(n) {
  const s = String(n);
  return s.length >= 14 ? s : "0".repeat(14 - s.length) + s;
}

function utcNowTs14() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return Number(`${yyyy}${mm}${dd}${hh}${mi}${ss}`);
}

function main() {
  const rawName = process.argv.slice(2).join(" ").trim();
  if (!rawName) die('Missing name. Example: pnpm sb:migration "add_entity_contributors"');

  const name = slugify(rawName);
  if (!name) die("Name became empty after slugify. Use letters/numbers.");

  if (!fs.existsSync(MIGRATIONS_DIR)) die(`Missing folder: ${MIGRATIONS_DIR}`);

  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
  const timestamps = files.map(parseTs).filter((x) => typeof x === "number" && !Number.isNaN(x));
  const maxTs = timestamps.length ? Math.max(...timestamps) : 0;

  const nextTs = maxTs > 0 ? maxTs + 1 : utcNowTs14();
  const filename = `${pad14(nextTs)}_${name}.sql`;
  const fullPath = path.join(MIGRATIONS_DIR, filename);

  if (fs.existsSync(fullPath)) die(`File already exists: ${filename}`);

  const content =
`-- Migration: ${name}
-- Created: ${new Date().toISOString()}

begin;

-- Write SQL here

commit;
`;

  fs.writeFileSync(fullPath, content, "utf8");
  console.log(`✅ Created migration: ${path.join("supabase","migrations",filename)}`);
}

main();
