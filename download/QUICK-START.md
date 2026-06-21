# Kandler — Quick Deploy Guide

Your Kandler source zip is ready. Here's how to get it live on GitHub Pages in ~5 minutes.

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

## Step 4 — Enable GitHub Pages

1. Go to your repo: https://github.com/ddown325/Kandler
2. **Settings** tab → **Pages** (left sidebar)
3. Under **Source**, select **GitHub Actions**
4. Done!

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
| `fatal: remote origin already exists` | `git remote remove origin` then re-add |
| `Authentication failed` | Use a Personal Access Token (Step 3 above) |
| Workflow doesn't run | Make sure you pushed to `main` (not `master`): `git branch -M main` |
| Site shows 404 | Confirm repo is **Public**, and Pages → Source is **GitHub Actions** |
| Assets missing (CSS/JS 404) | Repo must be named exactly `Kandler` (capital K) — basePath depends on it |
| Want to rename the repo | Update `basePath` in `next.config.ts` and `BASE` in `src/app/layout.tsx` to match new name |

---

Made by **Kantasu**.
