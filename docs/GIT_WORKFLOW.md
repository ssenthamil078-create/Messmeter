# Git Workflow for MessMeter

How this repository is maintained during development.

## Daily routine

```bash
git status                      # what changed?
git add <files>                 # stage only what belongs to one change
git commit -m "feat: add check-in API"
git push                        # send commits to GitHub
```

## Commit messages

Use a short prefix, then what changed in the present tense:

| Prefix | Use for | Example |
| --- | --- | --- |
| `feat:` | a new feature | `feat: add student check-in endpoint` |
| `fix:` | a bug fix | `fix: reject check-ins after cut-off time` |
| `docs:` | documentation only | `docs: update setup steps` |
| `test:` | adding or changing tests | `test: cover login with wrong password` |
| `chore:` | setup, dependencies, config | `chore: pin backend dependencies` |

## Rules

- Commit small and often; one logical change per commit.
- Never commit `.env`, passwords, API keys or tokens. Only `.env.example` (with fake values) is tracked.
- Do not commit `node_modules/`, `.venv/` or build output; `.gitignore` already excludes them.
- Run `pytest` before pushing backend changes.
- Check `git status` before every commit to see exactly what is included.

## Useful commands

| Command | Purpose |
| --- | --- |
| `git log --oneline` | short commit history |
| `git diff` | see unstaged changes |
| `git restore <file>` | discard changes to a file |
| `git switch -c feature/name` | create and switch to a new branch |
| `git pull` | get the latest commits from GitHub |
