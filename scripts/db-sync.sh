#!/usr/bin/env bash
set -euo pipefail

# --- config ---
MSG="${MSG:-chore(db): diff -> migration + push + typegen}"
TYPES="src/lib/database.types.ts"
SCHEMAS="${SCHEMAS:-public}"            # comma-separated allowed
STAMP="$(date -u +%Y%m%d%H%M%S)"
NAME="${NAME:-auto}"
MERGE_TO_MAIN="${MERGE_TO_MAIN:-1}"     # set to 0 to skip auto-merge

# --- preflight ---
branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" = "HEAD" ] && { echo "[ERR] detached HEAD"; exit 1; }

echo "[git] sync $branch"
git fetch origin
git pull --rebase origin "$branch" || git pull origin "$branch"

# --- diff -> migration file (if needed) ---
echo "[db] check diff → migration"
set +e
DIFF_OUT="$(pnpm exec supabase db diff --schema "$SCHEMAS")"
set -e
if [ -n "$DIFF_OUT" ]; then
  pnpm exec supabase db diff --schema "$SCHEMAS" -f "supabase/migrations/${STAMP}_${NAME}.sql"
  echo "[db] migration created: supabase/migrations/${STAMP}_${NAME}.sql"
else
  echo "[db] no schema diff"
fi

# --- apply to remote ---
echo "[db] push"
pnpm exec supabase db push

# --- typegen (only update if changed) ---
echo "[types] regenerate only if changed"
TMP="$(mktemp)"
if [ -n "${SUPABASE_PROJECT_ID:-}" ]; then
  pnpm exec supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > "$TMP"
elif [ -n "${SUPABASE_PROJECT_REF:-}" ]; then
  pnpm exec supabase gen types typescript --project-ref "$SUPABASE_PROJECT_REF" > "$TMP"
else
  REF="$(grep -Eo "\"project_ref\"\\s*=\\s*\"[^\"]+\"" supabase/config.toml | sed -E 's/.*"(.*)"/\1/')"
  pnpm exec supabase gen types typescript --project-ref "$REF" > "$TMP"
fi

if [ ! -f "$TYPES" ] || ! diff -q "$TMP" "$TYPES" >/dev/null 2>&1; then
  mkdir -p "$(dirname "$TYPES")"
  mv "$TMP" "$TYPES"
  git add "$TYPES"
else
  rm -f "$TMP"
fi

# --- commit & push current branch ---
echo "[git] stage and commit"
git add supabase/migrations/*.sql 2>/dev/null || true
git diff --cached --quiet || git commit -m "$MSG"

echo "[git] push $branch"
git push origin "$branch" || true

# --- optional: merge to main ---
if [ "$MERGE_TO_MAIN" = "1" ] && [ "$branch" != "main" ]; then
  echo "[git] merge $branch -> main"
  git checkout main
  git fetch origin
  git pull --rebase origin main || git pull origin main
  git merge --no-edit "$branch" || { echo "[ERR] merge conflict; resolve manually"; exit 1; }
  git push origin main
  echo "[git] delete merged branch $branch"
  git branch -d "$branch" || true
  git push origin --delete "$branch" || true
  echo "[git] back to main"
fi

echo "[ok] migrations applied, types updated, git pushed${MERGE_TO_MAIN:+, merged to main if enabled}."