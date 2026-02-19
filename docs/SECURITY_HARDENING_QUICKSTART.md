# Security Hardening - Quick Start Guide

## 🚀 Deployment Commands (Copy-Paste Ready)

```bash
# 1. Apply the migration (requires Supabase CLI and linked project)
cd /home/runner/work/platform/platform
npx -y supabase@latest db push

# 2. Regenerate TypeScript types
pnpm sb:types

# 3. Commit types if changed
git add src/lib/database.types.ts
git commit -m "Regenerate types after security hardening migration"
git push origin main
```

## 📋 Manual Dashboard Actions Required

After deploying the migration, complete these steps in the Supabase Dashboard:

### 1. Enable Leaked Password Protection
- Go to **Authentication** → **Policies** → **Password Protection**
- Toggle **Leaked Password Protection** to **Enabled**
- Click **Save**

### 2. Upgrade Postgres Version
- Go to **Settings** → **Database**
- Click **Upgrade** when security patches are available
- Schedule during low-traffic period

## ✅ Verification Checklist

After deployment, verify in **Advisors → Security**:
- [ ] No SECURITY DEFINER view warnings
- [ ] No functions missing search_path warnings
- [ ] No RLS policies with WITH CHECK (true) warnings

## 📄 Files in This PR

| File | Purpose |
|------|---------|
| `supabase/migrations/20260322000000_security_hardening_rls_functions.sql` | Main migration file |
| `SECURITY_HARDENING_SUMMARY.md` | Detailed deployment guide |
| `SUPABASE_DASHBOARD_ACTIONS.md` | Dashboard configuration steps |
| `SECURITY_HARDENING_QUICKSTART.md` | This quick start guide |

## 🔒 What Was Fixed

### 1. SECURITY DEFINER View
- **Fixed:** `public.verified_organisations`
- **Change:** Added `with (security_invoker=on)`
- **Impact:** Prevents privilege escalation

### 2. Functions Missing search_path (4 functions)
- `public.set_updated_at()`
- `public.enforce_at_least_one_admin()`
- `public.get_home_stats()`
- `public.update_comments_updated_at()`
- **Change:** Added `SET search_path = pg_catalog, public`
- **Impact:** Prevents search_path injection attacks

### 3. RLS Policies with WITH CHECK (true) (6 policies)
- `project_ifrc_admin_all`
- `project_links_admin_all`
- `project_media_admin_all`
- `project_partners_admin_all`
- `project_posts_admin_all`
- `project_sdgs_admin_all`
- **Change:** WITH CHECK now matches USING clause
- **Impact:** Prevents privilege escalation via INSERT/UPDATE

## 🛡️ Security Improvements

✅ Eliminated SECURITY DEFINER view vulnerability  
✅ Protected against search_path injection attacks  
✅ Tightened RLS write policies to prevent privilege escalation  
✅ No business logic changes  
✅ No permissions loosened  

## ⚠️ Important Notes

- Migration is **forward-only** (cannot be rolled back automatically)
- All existing functionality preserved
- Admin users: no change in permissions
- Non-admin users: same restrictions, better enforced
- Zero downtime deployment

## 📚 Need More Details?

See `SECURITY_HARDENING_SUMMARY.md` for:
- Complete change documentation
- Detailed functional testing checklist
- Risk assessment
- Rollback procedures

## 🆘 Support

If you encounter issues:
1. Check Supabase logs for errors
2. Review Security Advisor for warnings
3. Run functional test checklist
4. Contact development team

---

**Status:** ✅ Ready for Production  
**Risk Level:** Low  
**Downtime:** None
