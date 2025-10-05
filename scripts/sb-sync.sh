#!/usr/bin/env bash
set -euo pipefail
echo "==> sb-sync start"

# Ensure deps
if [ ! -d node_modules ]; then
  echo "==> installing deps"
  pnpm install
fi

# Prefer global supabase if present, else use pnpm exec
if command -v supabase >/dev/null 2>&1; then
  SB="supabase"
else
  SB="pnpm exec supabase"
fi

# Login if token exists
if [ -n "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "==> supabase login"
  $SB login --token "$SUPABASE_ACCESS_TOKEN" >/dev/null 2>&1 || true
else
  echo "WARN: SUPABASE_ACCESS_TOKEN not set"
fi

# Link if project ref exists
if [ -n "${SUPABASE_PROJECT_REF:-}" ]; then
  echo "==> supabase link ($SUPABASE_PROJECT_REF)"
  $SB link --project-ref "$SUPABASE_PROJECT_REF" >/dev/null 2>&1 || true
else
  echo "WARN: SUPABASE_PROJECT_REF not set"
fi

# Generate types from the linked project
mkdir -p src/lib
echo "==> generating types (--linked)"
$SB gen types typescript --linked > src/lib/database.types.ts

# Remote diff (skip in Codespaces if no Docker)
echo "==> remote diff"
if [ -S /var/run/docker.sock ]; then
  $SB db diff --use-migra --linked || true
else
  echo "→ Skipping diff (no Docker daemon)."
fi

echo "==> sb-sync done"
