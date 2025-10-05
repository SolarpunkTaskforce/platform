#!/usr/bin/env bash
set -euo pipefail
echo "==> sb-sync start"

# 0) Ensure deps installed
if [ ! -d node_modules ]; then
  echo "==> installing deps"
  pnpm install --no-frozen-lockfile
fi

# 1) Fast exit when no Supabase creds (prevents CI/Codex hangs)
if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ] || { [ -z "${SUPABASE_PROJECT_REF:-}" ] && [ -z "${SUPABASE_DB_URL:-}" ]; }; then
  echo "INFO: No Supabase credentials (SUPABASE_ACCESS_TOKEN + PROJECT_REF/DB_URL). Skipping sb-sync."
  exit 0
fi

# 2) Ensure CLI is available; otherwise skip gracefully
if ! command -v supabase >/dev/null 2>&1 && ! pnpm exec supabase --version >/dev/null 2>&1; then
  echo "WARN: Supabase CLI not found on PATH and not in node_modules. Skipping sb-sync."
  exit 0
fi
SUPA="pnpm exec supabase"
$SUPA --version >/dev/null 2>&1 || SUPA="supabase"

# 3) Non-interactive auth + optional link
echo "==> supabase login"
$SUPA login --token "${SUPABASE_ACCESS_TOKEN}" >/dev/null 2>&1 || true

if [ -n "${SUPABASE_PROJECT_REF:-}" ]; then
  echo "==> supabase link (${SUPABASE_PROJECT_REF})"
  $SUPA link --project-ref "${SUPABASE_PROJECT_REF}" >/dev/null 2>&1 || true
fi

# 4) Type generation (prefer DB URL; fallback to linked)
echo "==> generating types"
mkdir -p src/lib
if [ -n "${SUPABASE_DB_URL:-}" ]; then
  $SUPA gen types typescript --db-url "${SUPABASE_DB_URL}" > src/lib/database.types.ts
else
  $SUPA gen types typescript --linked > src/lib/database.types.ts
fi
echo "==> types updated"

# 5) Optional schema diff (avoid Docker requirement; use DB URL if present)
echo "==> remote diff"
if [ -n "${SUPABASE_DB_URL:-}" ]; then
  # Create a throwaway diff file just to surface drift in logs
  TMP_DIFF="$(mktemp)"
  $SUPA db diff --db-url "${SUPABASE_DB_URL}" --schema public --use-pg-schema -f "${TMP_DIFF}" || true
  rm -f "${TMP_DIFF}"
elif [ -S /var/run/docker.sock ]; then
  $SUPA db diff --use-migra --linked || true
else
  echo "→ Skipping diff (no DB_URL and no Docker daemon)."
fi

echo "==> sb-sync done"