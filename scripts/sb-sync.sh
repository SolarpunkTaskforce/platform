#!/usr/bin/env bash
set -euo pipefail
echo "==> sb-sync start"

# Ensure deps installed once
if [ ! -d node_modules ]; then
  echo "==> installing deps"
  pnpm install --no-frozen-lockfile
fi

# Supabase CLI via devDependency (pnpm exec)
if ! pnpm exec supabase --version >/dev/null 2>&1; then
  echo "WARN: Supabase CLI devDependency not available; skipping sync."
  exit 0
fi

# Login if token exists (non-fatal)
if [ -n "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "==> supabase login"
  pnpm exec supabase login --token "$SUPABASE_ACCESS_TOKEN" >/dev/null 2>&1 || true
else
  echo "WARN: SUPABASE_ACCESS_TOKEN not set"
fi

# Discover/link project ref if possible
PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
if [ -z "$PROJECT_REF" ] && [ -f supabase/config.toml ]; then
  PROJECT_REF="$(sed -nE 's/^project_ref\\s*=\\s*\"([^\"]+)\".*/\\1/p' supabase/config.toml | head -n1 || true)"
fi

if [ -n "${PROJECT_REF:-}" ]; then
  echo "==> supabase link ($PROJECT_REF)"
  pnpm exec supabase link --project-ref "$PROJECT_REF" >/dev/null 2>&1 || true
else
  echo "WARN: No project ref available (no SUPABASE_PROJECT_REF and no config.toml)"
fi

# Types only when linked/known
mkdir -p src/lib
if [ -n "${PROJECT_REF:-}" ] || [ -f supabase/config.toml ]; then
  echo "==> generating types (--linked)"
  if ! pnpm exec supabase gen types typescript --linked > src/lib/database.types.ts 2>/dev/null; then
    echo "WARN: typegen failed (likely not linked). Skipping."
  else
    echo "==> types updated"
  fi
else
  echo "→ Skipping typegen (no link info)"
fi

# Remote diff (skip if no Docker)
echo "==> remote diff"
if [ -S /var/run/docker.sock ]; then
  pnpm exec supabase db diff --use-migra --linked || true
else
  echo "→ Skipping diff (no Docker daemon)."
fi

echo "==> sb-sync done"