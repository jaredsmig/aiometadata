#!/usr/bin/env bash
# Puts the PR commits on your fork's feat/discover-sort-dropdown branch, on top of
# the latest cedya77 dev, and opens GitHub's "new pull request" page for
# cedya77/aiometadata. It never pushes to cedya77; the PR is opened by you in the
# browser. Run it from the repo root, on the testing branch:
#
#   ./local-test/open-pr.sh            # rebase, confirm, push, open the PR page
#   DRY_RUN=1 ./local-test/open-pr.sh  # show what would happen, push nothing
set -euo pipefail

UPSTREAM_URL=https://github.com/cedya77/aiometadata.git
FORK_OWNER=jaredsmig
PR_BRANCH=feat/discover-sort-dropdown

[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo "Commit or stash your changes first."; exit 1; }

# The last commit must be the local-test one; everything before it is the PR.
if git diff --name-only HEAD~1 HEAD | grep -qv '^local-test/'; then
  echo "The last commit touches files outside local-test/, so it can't be split off safely. Stopping."; exit 1
fi

git remote get-url upstream >/dev/null 2>&1 || git remote add upstream "$UPSTREAM_URL"
git fetch upstream dev

echo "Rebasing onto the latest cedya77 dev..."
if ! git rebase upstream/dev; then
  git rebase --abort
  echo "The branch no longer applies cleanly to cedya77 dev. Nothing was pushed."; exit 1
fi

echo
echo "These commits will go on $FORK_OWNER:$PR_BRANCH (local-test/ stays behind):"
git log --oneline upstream/dev..HEAD~1
git diff --stat upstream/dev HEAD~1 | tail -1
echo

if [ "${DRY_RUN:-}" = 1 ]; then echo "DRY_RUN: nothing pushed."; exit 0; fi
read -r -p "Push them to your fork now? [y/N] " ok
[ "$ok" = y ] || [ "$ok" = Y ] || { echo "Nothing pushed."; exit 0; }

git push --force origin "HEAD~1:refs/heads/$PR_BRANCH"

url="https://github.com/cedya77/aiometadata/compare/dev...$FORK_OWNER:aiometadata:$PR_BRANCH?expand=1"
echo
echo "Open this to create the PR (paste section 2 of local-test/drafts.md as the description):"
echo "  $url"
command -v open >/dev/null && open "$url" || { command -v xdg-open >/dev/null && xdg-open "$url" >/dev/null 2>&1 || true; }
