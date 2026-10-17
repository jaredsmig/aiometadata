# Drafts (not part of the PR)

Edit both into your own words before posting. Fill the bracketed parts after
your local test.

---

## 1. Comment for cedya77/aiometadata#829

Post this first and wait for a maintainer to reply before opening the PR
(`docs/contributing.md`: "open an issue first and wait for maintainer
confirmation before starting work").

> Before opening anything I wanted to check whether you'd take a PR for this.
>
> I have it working for MDBList lists: a per-list setting, default unchanged
> (Genres). Set to "Sort options", the list's Discover dropdown shows sort
> labels (Release Date Newest/Oldest, IMDb Rating, Runtime, Title...) and the
> catalog handler passes the picked one to MDBList as its sort before paging.
> Home rows and "None" keep the list's own order. It's one commit, about 120
> lines.
>
> One thing I ran into: MDBList's list items API reads `order` per field. On
> dates and numbers `asc` gives newest/highest/longest first; on title and rank
> it gives A-Z and rank 1 first. The dropdown accounts for that.
>
> I could also do Letterboxd lists as a second, separate step if you want it
> (they already come whole from StremThru, so it's a local sort with no extra
> requests). Happy to start with MDBList only.

---

## 2. PR description (follows .github/pull_request_template.md)

Title: `feat(mdblist): let a list offer sort options in the Discover dropdown`

If the maintainer wants Letterboxd too, use
`feat: let MDBList and Letterboxd lists offer sort options in the Discover dropdown`
and keep the Letterboxd lines below; otherwise delete them.

## Summary

Stremio gives each catalog one dropdown in Discover, and AIOMetadata always
fills it with genres. For themed lists (award winners, directors, franchises)
sorting by release date or rating is more useful. This adds a per-list
"Discover Dropdown" setting for MDBList lists [and Letterboxd lists]: Genres
(default, unchanged) or Sort options. With sort options, the picked label is
mapped to the provider's sort before the list is paged.

## Linked issue

Closes #829

## Type of change

- [ ] Bug fix
- [x] New feature
- [ ] Refactor
- [ ] Tests only
- [ ] Documentation only
- [ ] CI / tooling

## Why this approach

Stremio has only the one free-form `genre` extra per catalog, so the sort
labels go there for lists that opt in, and the handler reads them back as a
sort. Sorting has to happen before paging, so MDBList uses its own `sort` and
`order` parameters. [Letterboxd lists are already fetched whole from
StremThru, so they are sorted in memory with no extra requests.]

Tradeoffs and limits:
- A list in sort mode loses its genre filter in Discover; that is the choice
  the setting makes. Default stays Genres, and the manifest is unchanged
  unless a list opts in.
- MDBList's `order` is per field (on dates and numbers `asc` is
  newest/highest first), so each label sends the direction that gives the
  order it names.
- An explicit sort skips "randomize per page"; Home rows and "None" keep the
  list's own order and randomization.
- Lists without an order of their own (MDBList Recommended, Up Next,
  MDBList Discover) keep genres and don't show the setting.
- [StremThru sends the release year, not the date, so Letterboxd titles from
  the same year keep list order.]

## Testing

The repo has no automated test suite, so this was tested by hand against a
local instance with my real exported config:

- MDBList, live API: every label on two lists (67 and 323 films), paged to
  the end. Full order checked against MDBList's own data, no duplicates or
  missing titles; Home row and "None" keep list order; lists left on Genres
  still filter by genre.
- [Letterboxd, live StremThru: every label on a 500-film list, all 25 pages,
  matching the expected order exactly.]
- Config page in a browser: import, set the option, save; the manifest
  differs from the option-off manifest only in the chosen lists.
- [Your own run: what you checked in Stremio and the checker output.]
- `npm run build`, `npm run build:backend`, eslint on changed files: clean.

- [ ] I ran existing tests relevant to this change.
- [ ] I added or updated tests where needed.
- [x] No tests were needed, and I explained why.

## Documentation

- [x] I updated documentation or comments where needed.
- [ ] No documentation updates were needed.

(The setting's help text in the config page explains it, including the
reinstall note.)

## Author checklist

- [x] This PR is focused on one concern.
- [ ] This PR is reasonably small and reviewable.
- [x] I read and followed `CONTRIBUTING.md`.
- [ ] I can explain every code change in this PR.
- [ ] I will respond to review feedback myself.

(Tick the open boxes only once they are true for you.)

## AI usage disclosure

- [ ] No AI tools were used.
- [x] AI tools were used for part of this PR, and I personally reviewed and verified all changes.

If AI tools were used, briefly describe how: [your words, e.g. Claude Code
wrote most of the code and the test harness from my spec; I reviewed the diff,
ran it locally against my own lists, and checked the MDBList API behaviour it
relies on.]
