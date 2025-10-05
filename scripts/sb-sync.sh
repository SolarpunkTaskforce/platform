#!/usr/bin/env bash
set -euo pipefail
echo "==> sb-sync start"

# Ensure deps
if [ ! -d node_modules ]; then
  echo "==> installing deps"
  pnpm install
fi

# Supabase CLI via pnpm
if ! pnpm exec supabase --version >/dev/null 2>&1; then
  echo "ERROR: Supabase CLI missing (devDependency 'supabase')."
  exit 1
fi

# Login if token exists
if [ -n "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "==> supabase login"
  pnpm exec supabase login --token "$SUPABASE_ACCESS_TOKEN" >/dev/null 2>&1 || true
else
  echo "WARN: SUPABASE_ACCESS_TOKEN not set"
fi

# Link if project ref exists
if [ -n "${SUPABASE_PROJECT_REF:-}" ]; then
  echo "==> supabase link (${SUPABASE_PROJECT_REF})"
  pnpm exec supabase link --project-ref "$SUPABASE_PROJECT_REF" >/dev/null 2>&1 || true
else
  echo "WARN: SUPABASE_PROJECT_REF not set"
fi

# Types
mkdir -p src/lib
echo "==> generating types (--linked)"
pnpm exec supabase gen types typescript --linked > src/lib/database.types.ts
echo "==> types updated"

# in scripts/sb-sync.sh, replace the "remote diff" section with:
echo "==> remote diff"
if [ -S /var/run/docker.sock ]; then
  pnpm exec supabase db diff --use-migra --linked || true
else
  echo "→ Skipping diff (no Docker daemon in Codespaces)."
fi

echo "==> sb-sync done"