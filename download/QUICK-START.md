# Kandler — Quick Deploy

## 3 steps. 5 minutes. Done.

### 1. Create the repo
Go to https://github.com/new — name it **`Kandler`** (capital K), Public, no README/.gitignore/license. Create.

### 2. Push the code
In a terminal, inside the unzipped `Kandler` folder:

```bash
git init
git branch -M main
git add .
git commit -m "Initial Kandler commit"
git remote add origin https://github.com/ddown325/Kandler.git
git push -u origin main
```

(If asked for password, use a Personal Access Token from https://github.com/settings/tokens — check `repo` scope.)

### 3. Enable Pages (one-time)
1. Repo → **Settings → Pages**
2. **Source**: Deploy from a branch
3. **Branch**: select `gh-pages` → folder: `/(root)`
4. Save

Wait ~2 min. Live at **https://ddown325.github.io/Kandler/** 🎉

The `gh-pages` branch is created automatically on first push.

---

## If something breaks

| Issue | Fix |
|-------|-----|
| Site shows README | Settings → Pages → Branch: `gh-pages` (not `main`) |
| Site shows 404 | Repo must be **Public** (free Pages doesn't support private) |
| Workflow didn't run | Push something to `main` to trigger it |
| Build failed | Repo → Actions tab → click red ✗ → read error |

## Run locally
```bash
bun install && bun run dev
# Open http://localhost:3000
```

Made by Kantasu.
