# Git Best Practices for Feature Development

## The Branch Workflow

```
main (production-ready)
  │
  └── feature/add-progress-tracking  ← your feature branch
        │
        ├── commit 1: "Add progress model"
        ├── commit 2: "Add progress API routes"
        └── commit 3: "Add progress UI component"
```

---

## Step-by-Step Guide

### 1️⃣ Start a New Feature

```bash
# Make sure you're on main and up-to-date
git checkout main
git pull origin main

# Create a feature branch
git checkout -b feature/your-feature-name
```

**Branch naming conventions:**
- `feature/add-user-auth` - New features
- `fix/verse-loading-bug` - Bug fixes
- `refactor/cleanup-api` - Code refactoring
- `docs/update-readme` - Documentation

---

### 2️⃣ Make Small, Focused Commits

```bash
# Check what's changed
git status
git diff

# Stage specific files (preferred over `git add .`)
git add app/api/progress/route.ts
git add lib/progress.ts

# Or stage everything (when you're sure)
git add .

# Commit with a meaningful message
git commit -m "Add progress tracking API endpoint"
```

**Good commit messages:**
```
✅ "Add speech recognition pause threshold slider"
✅ "Fix hydration error on practice page"
✅ "Refactor verse fetching to use async/await"

❌ "Fixed stuff"
❌ "WIP"
❌ "asdfasdf"
```

---

### 3️⃣ Push Your Branch

```bash
# First push (sets upstream)
git push -u origin feature/your-feature-name

# Subsequent pushes
git push
```

---

### 4️⃣ Keep Your Branch Updated

```bash
# If main has new changes, sync your branch
git checkout main
git pull origin main
git checkout feature/your-feature-name
git merge main

# Or use rebase for cleaner history (advanced)
git fetch origin
git rebase origin/main
```

---

### 5️⃣ Create a Pull Request (PR)

1. Go to your repository on GitHub
2. Click **"Compare & pull request"**
3. Write a description of your changes
4. Review the diff
5. Click **"Create pull request"**

---

### 6️⃣ Merge to Main

**Option A: Via GitHub (recommended)**
- Review the PR on GitHub
- Click **"Merge pull request"**
- Delete the feature branch

**Option B: Via command line**
```bash
git checkout main
git pull origin main
git merge feature/your-feature-name
git push origin main

# Delete the feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

---

## Quick Reference Card

```bash
# 🚀 Starting work
git checkout main && git pull
git checkout -b feature/my-feature

# 💾 Saving work
git add .
git commit -m "Descriptive message"
git push

# 🔄 Syncing with main
git fetch origin
git merge origin/main

# ✅ Finishing up
git checkout main
git merge feature/my-feature
git push
git branch -d feature/my-feature
```

---

## Common Scenarios

### "I want to undo my last commit"
```bash
# Keep changes, undo commit
git reset --soft HEAD~1

# Discard changes entirely
git reset --hard HEAD~1
```

### "I committed to the wrong branch"
```bash
# Move the commit to correct branch
git checkout correct-branch
git cherry-pick <commit-hash>
git checkout wrong-branch
git reset --hard HEAD~1
```

### "I want to save work without committing"
```bash
# Stash changes
git stash

# Get them back
git stash pop
```

### "I want to see what changed"
```bash
git log --oneline -10          # Recent commits
git diff                        # Unstaged changes
git diff --staged              # Staged changes
git show <commit-hash>         # Specific commit
```

---

## Your Typical Workflow

```bash
# Morning: Start new feature
cd ~/app-dev/bible
git checkout main && git pull
git checkout -b feature/add-verse-history

# During development: Commit often
git add .
git commit -m "Add verse history data model"
# ... more work ...
git commit -m "Add history API endpoint"
# ... more work ...
git commit -m "Add history UI component"

# Push at end of session
git push -u origin feature/add-verse-history

# When feature is complete: Merge to main
git checkout main
git merge feature/add-verse-history
git push
git branch -d feature/add-verse-history
```

---

## Useful Git Aliases (Optional)

Add these to `~/.gitconfig` for shortcuts:

```ini
[alias]
    s = status
    co = checkout
    br = branch
    ci = commit
    lg = log --oneline --graph --decorate -10
    last = log -1 HEAD
    unstage = reset HEAD --
    undo = reset --soft HEAD~1
```

Then use: `git s`, `git co main`, `git lg`, etc.

---

## Git GUI Tools (Optional)

- **VS Code** - Built-in Git support (Source Control panel)
- **GitHub Desktop** - Simple GUI for Git
- **GitKraken** - Visual Git client
- **Lazygit** - Terminal UI for Git

---

## Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)

