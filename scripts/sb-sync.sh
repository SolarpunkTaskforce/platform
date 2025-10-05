#!/usr/bin/env bash
set -euo pipefail
echo "==> sb-sync start"

# Ensure deps
if [ ! -d node_modules ]; then
  echo "==> installing deps"
  pnpm install
fi

# Prefer the CLI from devDependencies; fall back to PATH
if pnpm exec supabase --version >/dev/null 2>&1; then
  SB="pnpm exec supabase"
elif command -v supabase >/dev/null 2>&1; then
  SB="supabase"
else
  echo "ERROR: Supabase CLI not found (neither pnpm devDependency nor PATH)."
  exit 1
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

# Types (use --linked, not --project-ref)
mkdir -p src/lib
echo "==> generating types (--linked)"
$SB gen types typescript --linked > src/lib/database.types.ts

# Schema diff (non-fatal)
echo "==> remote diff"
$SB db remote changes || true

echo "==> sb-sync done"