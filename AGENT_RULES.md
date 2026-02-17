# Solarpunk Taskforce Platform — Agent Rules (MANDATORY)

This repository uses:
- Supabase (Postgres + RLS)
- Forward-only SQL migrations
- Strict migration ordering
- CI-enforced migration guards

Production stability depends on following these rules.

------------------------------------------------------------
SOURCE OF TRUTH
------------------------------------------------------------

• GitHub repo = source of truth for schema + migrations  
• Supabase DB must only be changed via migrations  
• NEVER edit production DB manually in Supabase UI  
• NEVER rename or modify already-applied migrations  
• Migrations are forward-only  

------------------------------------------------------------
ALWAYS SYNC BEFORE MAKING CHANGES
------------------------------------------------------------

Run:

git status
git switch main
git fetch origin
git pull --rebase origin main
git status
git log -1 --oneline

If your branch is behind → STOP and sync first.

------------------------------------------------------------
CREATING MIGRATIONS (STRICT RULE)
------------------------------------------------------------

DO NOT USE:
- supabase migration new
- npx supabase migration new

These can generate out-of-order timestamps.

ALWAYS USE:

pnpm sb:migration "short_description"

This script:
• Ensures strictly increasing timestamps
• Prevents out-of-order migrations
• Works even if future-dated migrations exist

After generation:
• Paste SQL into the created file under:
  supabase/migrations/

------------------------------------------------------------
APPLYING MIGRATIONS
------------------------------------------------------------

After adding or modifying migrations:

npx -y supabase@latest migration list
npx -y supabase@latest db push
pnpm sb:types

Then:

git add -A
git commit -m "Describe change clearly"
git push

Never manually edit:
src/lib/database.types.ts

------------------------------------------------------------
RLS (ROW LEVEL SECURITY) — NON NEGOTIABLE
------------------------------------------------------------

For EVERY new table:

• RLS must be enabled
• Explicit policies must be defined
• No permissive "true" policies without justification
• Policies must consider:
  - anon
  - authenticated
  - admin / superadmin

If modifying ownership logic:
• Update policies accordingly
• Test as:
  - logged out
  - logged in user
  - org admin
  - superadmin

------------------------------------------------------------
DUAL OWNERSHIP MODEL (CRITICAL ARCHITECTURE)
------------------------------------------------------------

Entities may be owned by:
• Individual user
• Organisation

Owner model:
owner_type ('user' | 'organisation')
owner_id (uuid)

Never reintroduce direct FK-only ownership patterns.

------------------------------------------------------------
BEFORE PUSHING
------------------------------------------------------------

Run:

pnpm lint || true
pnpm typecheck || true
pnpm check:migrations

If migration guard fails → fix ordering.

------------------------------------------------------------
NEVER DO THIS
------------------------------------------------------------

• Rename applied migrations
• Use --include-all on production
• Edit DB directly in Supabase UI
• Disable RLS
• Add broad policies without review
• Modify past migrations to “fix” history

------------------------------------------------------------
PR REQUIREMENTS
------------------------------------------------------------

Every PR must include:

• What changed (user-facing impact)
• Which tables were modified
• Which RLS policies changed
• How to test (step-by-step)
• Confirmation migrations are ordered correctly

------------------------------------------------------------
FINAL RULE
------------------------------------------------------------

If unsure about migrations, RLS, or ownership:

STOP.
Ask for clarification.
Do not guess.

Schema mistakes are expensive.
