# Local test: Discover sort dropdown

This folder is for testing the branch on your own computer before proposing it
upstream. It is never part of the pull request (`open-pr.sh` leaves it behind).

What the branch adds: a per-list **Discover Dropdown** setting for MDBList and
Letterboxd lists. Set to **Sort options**, Stremio's Discover dropdown for that
list shows sort labels (Release Date Newest/Oldest, IMDb Rating, Runtime,
Title...) instead of genres. Home rows keep the list's own order.

You run the same AIOMetadata that ElfHosted runs, built from the latest cedya77
`dev` plus this change, with your own exported config. It runs only on your
computer at `http://localhost:3232`.

## What you need

- Docker Desktop, running.
- Git.
- Your config backup **with keys**: on your ElfHosted AIOMetadata page, go to
  **Configuration**, switch **off** "Exclude API keys from export", then
  **Export Configuration**. Save it somewhere outside the repo, or in
  `local-test/` (anything `.json` there is git-ignored, so it can't be committed).
- Your **ElfHosted install URL** (Configuration > Install URL on the ElfHosted
  page). Keep it handy; see "Stremio" below.

## 1. Get the code, on the latest upstream

First time only:

```sh
git clone https://github.com/jaredsmig/aiometadata.git
cd aiometadata
git remote add upstream https://github.com/cedya77/aiometadata.git
```

Every time (safe to repeat; it throws away any local edits on this branch):

```sh
git fetch origin
git checkout -B ccr-54654f6d-msg7cc origin/ccr-54654f6d-msg7cc
git fetch upstream
git rebase upstream/dev
```

The rebase puts the change on top of whatever cedya77 has published today.
It is local only; nothing is pushed. If it stops with a conflict, run
`git rebase --abort` and ask for help rather than resolving it by hand.

## 2. Start it

```sh
docker compose -f local-test/compose.yml up --build
```

The first build takes a few minutes. Wait for a line like
`ready in 9.4s on :3232`. Requests made before that get a 503.
Leave this window open; `Ctrl+C` stops it.

## 3. Load your config

1. Open <http://localhost:3232/configure> and press **Skip** on the setup screen.
2. **Configuration** > **Import Configuration** > pick your backup. Expect
   "Configuration imported successfully! Imported 51 enabled catalogs". A
   "Configuration file version mismatch" warning just means your backup came
   from an older version; the import still goes through.
3. **Integrations**: check your keys came across.

## 4. Mark it as the test copy

1. Click the pencil next to **AIOMetadata** at the top, type
   `AIOMetadata TESTING`, press Enter.
2. **General** > turn on **Show Prefix**. Every catalog is then named
   "AIOMetadata TESTING - ..." in Stremio, so you can't mix them up with your
   ElfHosted ones.

## 5. Turn on sort options

In **Catalogs**, click the gear on a list, set **Discover Dropdown** to
**Sort options (reorder the list)** and press **Save** in the dialog. Good ones:

| List | Source |
|---|---|
| Best Picture Winners (67) | MDBList |
| Best Picture Nominees (323) | MDBList |
| Top 500 Movies of All-Time (by Jeff D. Lowe) | Letterboxd |

Lists with no order of their own (MDBList "Recommended", Up Next, MDBList
Discover, and Trakt lists) don't show the setting.

Then **Configuration** > **Save Configuration** and choose a password. When the
"Reinstall Required" box appears, press **Install** or **Later**.
**Never press "Sync to AIOManager"** on this local copy, and never add your
AIOManager key here: that is what pushes addons into your real Stremio
profiles. (It can't today anyway, since the AIOManager key lives on ElfHosted
and is not in the export.)

Your UUID and **Install URL** (`http://localhost:3232/stremio/<uuid>/manifest.json`)
are shown on the same page.

## 6. Stremio

Use the **Stremio app on this same computer** (or web.stremio.com in a browser on
this computer). Phones and TVs can't reach `localhost`.

In Stremio: **Addons** > paste the Install URL into the search box > **Install**.

Every AIOMetadata install reports the same addon id (`aio-metadata`), so it is
possible Stremio treats the test copy as the same addon and replaces your
ElfHosted one instead of adding a second. If that happens, reinstall ElfHosted
from its Install URL when you're done. Uninstall "AIOMetadata TESTING" afterwards.

Then **Discover** > pick "AIOMetadata TESTING - Best Picture Winners" > open the
dropdown > try each option. After changing the setting again, reinstall so
Stremio picks up the new dropdown.

Your local copy runs the latest cedya77 code, which may be newer than what
ElfHosted runs. Small differences unrelated to the dropdown can come from that.

## 7. Checker (optional)

Pages through every option of every sort-enabled list to the end and reports
duplicates, missing titles and wrong-way order where the metadata shows it
(year, runtime, title, IMDb rating). In a second terminal:

```sh
docker compose -f local-test/compose.yml exec aiometadata \
  node /local-test/check-sort-dropdown.mjs http://localhost:3232/stremio/<uuid>/manifest.json
```

It ends with `No problems found.` or a count. A few titles out of place on IMDb
Rating or Release Date for MDBList can be real (MDBList sorts on its own data;
the year and rating shown come from TMDB/IMDb). `REVERSED` means a bug.

Any catalog page is also plain JSON in the browser, for example
`http://localhost:3232/stremio/<uuid>/catalog/movie/mdblist.106846/genre=Release%20Date%20(Oldest).json`.

## What to expect

- **MDBList**: every option sorts on MDBList's side, across all pages.
- **Letterboxd**: sorted locally on what StremThru sends, which is the release
  year, not the date. Titles from the same year keep their list order, so
  "Newest" and "Oldest" are not exact mirror images.
- **Home rows** and **None** keep the list's own order, shuffled within each
  page if "random order" is on for that list.

## Stop and clean up

`Ctrl+C` stops it; `docker compose -f local-test/compose.yml up` starts it again
with your saved config. To wipe everything (saved config included):

```sh
docker compose -f local-test/compose.yml down -v
```

## Opening the pull request

1. First comment on cedya77/aiometadata#829 and wait for a maintainer to say a
   PR is welcome. Their `docs/contributing.md` asks for that, and PRs without it
   tend to be closed. A draft comment is in `local-test/drafts.md`.
2. When they agree:

   ```sh
   ./local-test/open-pr.sh
   ```

   It rebases onto the latest cedya77 `dev`, shows the commits, asks before
   pushing them (without `local-test/`) to your fork's `feat/discover-sort-dropdown`,
   then opens GitHub's new-PR page against **cedya77/aiometadata `dev`**. Paste
   section 2 of `local-test/drafts.md` as the description and fill in the
   bracketed parts. `DRY_RUN=1 ./local-test/open-pr.sh` shows what it would do.
   If the maintainer wants MDBList only, say so before running it.

## Trakt (not in the PR)

The project dropped Trakt support (0xConstant1 on cedya77/aiometadata#786), so
Trakt is left out. The Trakt part is kept in `local-test/trakt-sort-dropdown.patch`
in case it is ever wanted (`git apply local-test/trakt-sort-dropdown.patch`).
It was never tested against a live Trakt account.
