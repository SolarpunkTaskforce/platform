import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const migrationsDir = "supabase/migrations";

function getMigrationFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

function getMaxTimestamp(files) {
  if (!files.length) return 0;
  return Math.max(
    ...files.map((f) => {
      const prefix = f.split("_")[0];
      return Number(prefix);
    })
  );
}

function getRemoteMainMigrations() {
  execSync("git fetch origin main", { stdio: "ignore" });

  const output = execSync(
    "git ls-tree -r origin/main --name-only",
    { encoding: "utf8" }
  );

  return output
    .split("\n")
    .filter((p) => p.startsWith("supabase/migrations/") && p.endsWith(".sql"))
    .map((p) => path.basename(p));
}

const localFiles = getMigrationFiles(migrationsDir);
const remoteFiles = getRemoteMainMigrations();

const maxRemote = getMaxTimestamp(remoteFiles);

const newFiles = localFiles.filter((f) => !remoteFiles.includes(f));

if (newFiles.length === 0) {
  console.log("✅ No new migrations to validate.");
  process.exit(0);
}

for (const file of newFiles) {
  const prefix = Number(file.split("_")[0]);

  if (prefix <= maxRemote) {
    console.error(`❌ Migration ${file} is out of order.`);
    console.error(
      `It must be greater than ${maxRemote}.`
    );
    process.exit(1);
  }
}

console.log("✅ Migration order valid.");
