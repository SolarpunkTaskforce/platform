# Solarpunk Taskforce Platform — Developer Guide

This document explains everything you need to work on the Solarpunk Taskforce Platform:  
how setup works, how Supabase integrates, and what to do for syncing, deployment, and automation.

---

## 1. Overview

This project is a **Next.js 15 + Supabase** full-stack platform.  
It uses:

- **PNPM** for dependency management  
- **Supabase CLI** for database migrations and type generation  
- **Vercel** for deployments  
- **GitHub Actions** for Supabase automation  
- **VSCode Dev Containers / Codespaces** for consistent local environments  

All tools and credentials are automatically handled in the dev container.

---

## 2. Local Development Setup

You don’t need to install anything manually.

1. Open the repo in **GitHub Codespaces** or VSCode with **Dev Containers**.
2. Wait for the environment to build.
3. It will automatically:
   - Install PNPM, Supabase CLI, and Git LFS
   - Log in to Supabase using Codespaces secrets
   - Run the Supabase sync (`sb-sync.sh`)
   - Start the Next.js dev server on port 3000

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 3. Automatic Behavior in Codespaces

When a Codespace launches:

1. PNPM (v10), Supabase CLI, and Git LFS are installed.
2. Supabase is authenticated and linked using secrets.
3. `scripts/sb-sync.sh` runs:
   - Authenticates Supabase CLI
   - Regenerates TypeScript DB types
   - Checks schema diffs (skipped if Docker unavailable)
4. The dev server auto-starts via `pnpm dev`.

---

## 4. Package Scripts

Available via `package.json`:

| Script | Description |
|--------|--------------|
| `pnpm dev` | Start Next.js locally |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm sb:sync` | Run Supabase sync script |
| `pnpm sb:diff` | Show schema differences |
| `pnpm sb:commit` | Commit DB changes (dry run) |
| `pnpm sb:login` | Authenticate Supabase |
| `pnpm sb:link` | Link local project to Supabase |

---

## 5. Supabase Sync (`scripts/sb-sync.sh`)

This script keeps the local project in sync with Supabase.

It performs:

1. Installs dependencies if missing  
2. Logs into Supabase (if token is present)  
3. Links to the Supabase project (if project ref is present)  
4. Regenerates TypeScript database types  
5. Runs a schema diff check (skips if Docker is unavailable)  
6. Commits updated types if changed  

Run manually anytime:
```bash
pnpm sb:sync
```

This ensures your Supabase schema and types stay synchronized.

---

## 6. GitHub Actions — Supabase DB Automation

Workflow file: `.github/workflows/supabase-db-auto.yml`

This runs automatically when:
- Code is pushed to `main`
- Or triggered manually from the **Actions** tab

### Steps Performed

1. Logs into Supabase using repository secrets:
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_DB_URL`
   - `SUPABASE_PROJECT_REF`
2. Creates migration diffs:
   ```bash
   supabase db diff --db-url $SUPABASE_DB_URL
   ```
3. Applies migrations:
   ```bash
   supabase db push
   ```
4. Regenerates TypeScript types:
   ```bash
   supabase gen types typescript --db-url $SUPABASE_DB_URL -s public -s auth -s storage > src/lib/database.types.ts
   ```
5. Commits and pushes updates back to `main`.

This keeps your live Supabase DB and schema definitions consistent with code.

---

## 7. Deployment — Vercel

Vercel automatically deploys whenever you push to `main`.

### Build Process
- Detects PNPM and installs dependencies
- Runs `pnpm build`
- Serves with `pnpm start`

### Notes
- `sb-sync.sh` is **not** executed during Vercel builds.
- The Supabase CLI installs automatically for build-time use.
- Keep `pnpm-lock.yaml` up to date with `package.json` to avoid:
  ```
  ERR_PNPM_OUTDATED_LOCKFILE
  ```

After modifying dependencies, always run:
```bash
pnpm install
git add package.json pnpm-lock.yaml
git commit -m "update deps"
git push
```

---

## 8. Git and Git LFS

This repo uses **Git LFS** for large files.

If you see:
```
This repository is configured for Git LFS but 'git-lfs' was not found.
```
Fix it with:
```bash
git lfs install --force
```

---

## 9. Common Commands

**Sync everything:**
```bash
pnpm sb:sync
```

**Start local server:**
```bash
pnpm dev
```

**Reinstall dependencies:**
```bash
pnpm install
```

**Fix Git LFS hooks:**
```bash
git lfs install --force
```

**Manually regenerate Supabase types:**
```bash
supabase gen types typescript --linked > src/lib/database.types.ts
```

**Trigger the GitHub Supabase sync workflow:**
Go to **GitHub → Actions → Supabase DB Auto → Run workflow**

---

## 10. Environment Variables

Configured in Codespaces and GitHub Secrets:

| Variable | Description |
|-----------|--------------|
| `SUPABASE_ACCESS_TOKEN` | Supabase service access token |
| `SUPABASE_PROJECT_REF` | Supabase project reference ID |
| `SUPABASE_DB_URL` | Supabase database connection URL |

---

## 11. Legacy Script

The old `db-sync.sh` script is **deprecated**.  
It has been fully replaced by:
- `scripts/sb-sync.sh` for local development
- The GitHub Actions workflow for automation

You can delete `db-sync.sh` safely.

---

## 12. Daily Developer Workflow

1. Open the repo in Codespaces — setup runs automatically.
2. When changing database schema or Supabase data models:
   ```bash
   pnpm sb:sync
   git commit -am "update schema/types"
   git push
   ```
3. GitHub Actions syncs the live Supabase project.
4. Vercel automatically deploys the latest version.
5. Local, CI, and production environments stay consistent.
