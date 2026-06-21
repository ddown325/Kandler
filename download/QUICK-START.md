# Kandler — Quick Deploy Guide

Your Kandler source zip is ready. Here's how to get it live on GitHub Pages in ~5 minutes.

---

## ⚠️ If you're seeing the README instead of the app

This means GitHub Pages is misconfigured. **The fix is on step 4 below** — you must select **"GitHub Actions"** as the Pages source, NOT "Deploy from a branch".

To fix it right now:
1. Open your repo: https://github.com/ddown325/Kandler
2. Click **Settings** tab → **Pages** (left sidebar)
3. Under **Build and deployment → Source**, change it from "Deploy from a branch" to **"GitHub Actions"**
4. Wait ~2 minutes for the workflow to run
5. Refresh https://ddown325.github.io/Kandler/

---

## Step 1 — Unzip

Unzip `Kandler-source.zip` somewhere on your computer:

```bash
# Mac/Linux
unzip Kandler-source.zip -d Kandler
cd Kandler

# Windows: right-click → Extract All → open the Kandler folder
```

## Step 2 — Create the GitHub repo

1. Go to https://github.com/new
2. Repository name: **`Kandler`** (exactly this — capital K matters)
3. Set to **Public** (required for free GitHub Pages)
4. **Do NOT** check "Add README" / "Add .gitignore" / "Add license" — leave it empty
5. Click **Create repository**

## Step 3 — Push the code

In a terminal (Mac: Terminal app; Windows: Git Bash or PowerShell), from inside the unzipped `Kandler` folder:

```bash
# Initialize git
git init
git branch -M main

# Stage everything
git add .

# First commit
git commit -m "Initial Kandler commit — 3D modeling suite by Kantasu"

# Link to your GitHub repo (use your actual username if not ddown325)
git remote add origin https://github.com/ddown325/Kandler.git

# Push
git push -u origin main
```

### If it asks for a password

GitHub no longer accepts your account password. Use a **Personal Access Token** instead:
1. Go to https://github.com/settings/tokens/new
2. Note: "Kandler deploy"
3. Expiration: 90 days
4. Check the `repo` scope
5. Generate → copy the token
6. When you push, use your GitHub username as the username and the token as the password.

**OR easier:** install GitHub CLI (`gh auth login`) and it handles auth automatically.

## Step 4 — Enable GitHub Pages (THIS IS THE IMPORTANT STEP)

1. Go to your repo: https://github.com/ddown325/Kandler
2. **Settings** tab → **Pages** (left sidebar)
3. Under **Build and deployment**:
   - **Source**: select **"GitHub Actions"** ← THIS IS CRITICAL
   - Do NOT select "Deploy from a branch" — that will serve your README instead of the app
4. Done!

The deploy workflow at `.github/workflows/deploy.yml` will run automatically on every push.

## Step 5 — Watch it deploy

1. Click the **Actions** tab in your repo
2. You'll see "Deploy to GitHub Pages" running (yellow dot → green checkmark)
3. Takes ~2 minutes
4. Your site goes live at: **https://ddown325.github.io/Kandler/** 🎉

---

## Run locally (optional, for development)

```bash
# Install dependencies (need Node 18+ and Bun: https://bun.sh)
bun install

# Start dev server
bun run dev

# Open http://localhost:3000
```

No Bun? Use npm instead:
```bash
npm install
npm run dev
```

---

## Update later

After making changes:
```bash
git add .
git commit -m "Your update message"
git push
```

The deploy workflow runs automatically and your live site updates in ~2 minutes.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **Site shows README instead of the app** | Settings → Pages → Source must be **"GitHub Actions"**, NOT "Deploy from a branch" |
| Workflow doesn't run | Make sure you pushed to `main` (not `master`). Run `git branch -M main` |
| Workflow runs but site still shows README | Wait 2 min, then hard-refresh with Ctrl+Shift+R (browser cache) |
| Workflow fails with red ✗ | Click into the failed run → click "Build" → read the error log. Most common: missing files in the zip |
| `fatal: remote origin already exists` | `git remote remove origin` then re-add |
| `Authentication failed` | Use a Personal Access Token (Step 3 above) |
| Site shows 404 | Confirm repo is **Public**, and Pages → Source is **GitHub Actions** |
| Assets missing (CSS/JS 404) | Repo must be named exactly `Kandler` (capital K) — basePath depends on it |
| Want to rename the repo | Update `basePath` in `next.config.ts` and `BASE` in `src/app/layout.tsx` to match new name |
| Icon doesn't load on deployed site | Make sure you pushed the latest version (the icon fix is in `src/lib/kandler/asset.ts`) |
| Browser shortcuts (Ctrl+S, F12, Ctrl+R) hijack the app | Already fixed — make sure you pushed the latest version |

---

## How to verify the deploy worked

1. Go to https://github.com/ddown325/Kandler/actions
2. You should see a green ✓ next to the most recent "Deploy to GitHub Pages" run
3. Click on it → scroll to the bottom → you'll see "The site was live at https://ddown325.github.io/Kandler/"
4. Visit https://ddown325.github.io/Kandler/ — you should see the Kandler app with the orange cube icon, not a README

---

Made by **Kantasu**.
