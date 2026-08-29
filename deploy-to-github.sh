#!/usr/bin/env bash
# ============================================================
# FindIt Ghana — one-command GitHub deployment
#
# Run this ON YOUR OWN MACHINE (where you're logged into GitHub).
# It creates the GitHub repo and pushes the site; Vercel then
# auto-deploys on every push once you import the repo (see README).
#
# Usage:
#   ./deploy-to-github.sh                        # repo "findit-ghana", private
#   ./deploy-to-github.sh findit-ghana public    # custom name + visibility
# ============================================================
set -euo pipefail
cd "$(dirname "$0")"

REPO_NAME="${1:-findit-ghana}"
VISIBILITY="${2:-private}"
GREEN="\033[32m"; YELLOW="\033[33m"; RESET="\033[0m"

echo -e "${GREEN}== FindIt Ghana · GitHub deploy ==${RESET}"
echo "Repo: $REPO_NAME ($VISIBILITY)"

# ---- 1. prerequisites -------------------------------------------------------
if ! command -v git >/dev/null 2>&1; then
  echo "git is not installed. Install it from https://git-scm.com and re-run."; exit 1
fi

# ---- 2. make sure the local repo is committed -------------------------------
if [ ! -d .git ]; then
  echo "Initialising local git repository…"
  git init -b main
  git add -A
  git commit -m "FindIt Ghana — Ghana's price finder (complete MVP)" --no-verify
else
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Committing pending changes…"
    git add -A
    git commit -m "Pre-deploy snapshot" --no-verify || true
  fi
fi
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[ "$BRANCH" = "main" ] || git branch -M main

# ---- 3. push to GitHub ------------------------------------------------------
if command -v gh >/dev/null 2>&1; then
  # GitHub CLI path (recommended) — handles auth and repo creation itself.
  if ! gh auth status >/dev/null 2>&1; then
    echo -e "${YELLOW}Not logged into GitHub. Starting login…${RESET}"
    gh auth login
  fi
  if gh repo create "$REPO_NAME" --"$VISIBILITY" --source=. --remote=origin --push 2>/dev/null; then
    echo -e "${GREEN}✔ Created and pushed to github.com/…/$REPO_NAME${RESET}"
  else
    echo "Repo may already exist — attaching remote and pushing…"
    gh repo set-default "$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)" 2>/dev/null || true
    git remote remove origin 2>/dev/null || true
    git remote add origin "https://github.com/$(gh api user -q .login)/$REPO_NAME.git"
    git push -u origin main
  fi
else
  # Plain-git fallback: create the repo at github.com/new first.
  echo -e "${YELLOW}GitHub CLI not found — falling back to plain git.${RESET}"
  echo "Create the repo at https://github.com/new (name: $REPO_NAME, visibility: $VISIBILITY) and press Enter…"
  read -r -p "GitHub username: " GH_USER
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://github.com/$GH_USER/$REPO_NAME.git"
  git push -u origin main
fi

# ---- 4. next steps ----------------------------------------------------------
echo
echo -e "${GREEN}✔ Code is on GitHub.${RESET} Now deploy to Vercel (2 minutes, free):"
echo "   1. Open  https://vercel.com/new/import"
echo "   2. Select the repo '$REPO_NAME' → Deploy (settings auto-detect Next.js)"
echo "   3. Optional: add env vars (ADMIN_PASSWORD, CRON_SECRET, Supabase keys)"
echo "   4. Every future push to main auto-deploys. Done."
