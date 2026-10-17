#!/usr/bin/env node
// Checks the Discover sort dropdown on a running AIOMetadata instance.
//
//   node local-test/check-sort-dropdown.mjs http://localhost:3232/stremio/<uuid>/manifest.json [catalogId ...]
//
// For every catalog whose dropdown carries sort options (or only the ids you
// name), it pages through every option to the end of the list and reports:
//   - how many titles came back, and whether any repeat or go missing compared
//     with the plain (no option) request
//   - for the sorts it can check from the catalog's own metadata (release
//     year, runtime, title, IMDb rating), whether the order runs the way the
//     label says. Other sorts (scores, votes, date added, list order, random)
//     are listed with their first and last titles for you to eyeball.
// No dependencies; Node 18 or newer.

const manifestUrl = process.argv[2];
const only = new Set(process.argv.slice(3));
if (!manifestUrl || !/manifest\.json$/.test(manifestUrl)) {
  console.error('usage: node check-sort-dropdown.mjs <.../manifest.json> [catalogId ...]');
  process.exit(2);
}
const base = manifestUrl.replace(/\/manifest\.json$/, '');
const MAX_PAGES = 100;
const SORT_MARKERS = ['List Rank', 'List Order'];

const year = (m) => { const y = parseInt(String(m.releaseInfo || m.year || '').slice(0, 4), 10); return Number.isFinite(y) ? y : null; };
const minutes = (m) => {
  const s = String(m.runtime || '');
  const h = s.match(/(\d+)\s*h/); const mi = s.match(/(\d+)\s*min/);
  const t = (h ? +h[1] * 60 : 0) + (mi ? +mi[1] : 0);
  return t > 0 ? t : null;
};
const rating = (m) => { const r = parseFloat(m.imdbRating); return Number.isFinite(r) ? r : null; };
const title = (m) => (m.name ? m.name.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase() : null);

// label -> [value getter, direction the label promises]
const CHECKS = {
  'Release Date (Newest)': [year, 'desc'], 'Release Date (Oldest)': [year, 'asc'],
  'Release Year (Newest)': [year, 'desc'], 'Release Year (Oldest)': [year, 'asc'],
  'Runtime (Longest)': [minutes, 'desc'], 'Runtime (Shortest)': [minutes, 'asc'],
  'Title (A-Z)': [title, 'asc'], 'IMDb Rating': [rating, 'desc'],
};

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

async function allPages(type, id, option) {
  const metas = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const extra = [];
    if (option) extra.push('genre=' + encodeURIComponent(option));
    if (page) extra.push('skip=' + metas.length);
    const url = `${base}/catalog/${type}/${encodeURIComponent(id)}${extra.length ? '/' + extra.join('&') : ''}.json`;
    const got = (await getJson(url)).metas || [];
    if (!got.length) break;
    metas.push(...got);
  }
  return metas;
}

// Share of neighbouring pairs (with values, not ties) that run the promised way.
function agreement(values, dir) {
  let good = 0, bad = 0;
  const v = values.filter((x) => x !== null);
  for (let i = 1; i < v.length; i++) {
    if (v[i] === v[i - 1]) continue;
    const up = v[i] > v[i - 1];
    if ((dir === 'asc') === up) good++; else bad++;
  }
  return good + bad ? good / (good + bad) : 1;
}

const label = (m) => `${m.name || m.id}${year(m) ? ` (${year(m)})` : ''}`;
let problems = 0;
const manifest = await getJson(manifestUrl);
const catalogs = manifest.catalogs.filter((c) => {
  const g = (c.extra || []).find((e) => e.name === 'genre');
  return g && (g.options || []).some((o) => SORT_MARKERS.includes(o)) && (!only.size || only.has(c.id));
});
if (!catalogs.length) {
  console.log('No catalog in this manifest has sort options in its dropdown. Turn on "Discover Dropdown: Sort options" for a list and save.');
  process.exit(1);
}

for (const c of catalogs) {
  const options = (c.extra.find((e) => e.name === 'genre').options || []).filter((o) => o !== 'None');
  console.log(`\n=== ${c.name} [${c.type} ${c.id}]`);
  const home = await allPages(c.type, c.id, null);
  const homeIds = new Set(home.map((m) => m.id));
  console.log(`  ${'(no option: Home row)'.padEnd(26)} ${String(home.length).padStart(4)} titles   first: ${home[0] ? label(home[0]) : '-'}   last: ${home.length ? label(home[home.length - 1]) : '-'}`);
  for (const option of options) {
    const metas = await allPages(c.type, c.id, option);
    const ids = metas.map((m) => m.id);
    const notes = [];
    const dups = ids.length - new Set(ids).size;
    if (dups) notes.push(`${dups} repeated`);
    const missing = [...homeIds].filter((id) => !ids.includes(id)).length;
    const extra = ids.filter((id) => !homeIds.has(id)).length;
    if (missing) notes.push(`${missing} missing vs Home row`);
    if (extra) notes.push(`${extra} not in Home row`);
    let verdict = 'ok';
    const check = CHECKS[option];
    if (check) {
      const [get, dir] = check;
      const values = metas.map(get);
      const known = values.filter((v) => v !== null).length;
      const a = agreement(values, dir);
      const pct = Math.round(a * 100);
      if (known < 2) verdict = 'n/a (no data)';
      else if (a >= 0.95) verdict = `PASS (${pct}% in order)`;
      else if (a <= 0.2) verdict = `REVERSED (${pct}% in order)`;
      else verdict = `MIXED (${pct}% in order)`;
      if (!verdict.startsWith('PASS') && !verdict.startsWith('n/a')) problems++;
    } else {
      verdict = 'not checkable here, eyeball first/last';
    }
    if (notes.length) problems++;
    console.log(`  ${option.padEnd(26)} ${String(metas.length).padStart(4)} titles   ${verdict}${notes.length ? '   !! ' + notes.join(', ') : ''}`);
    console.log(`  ${''.padEnd(26)}              first: ${metas[0] ? label(metas[0]) : '-'}   last: ${metas.length ? label(metas[metas.length - 1]) : '-'}`);
  }
}
console.log(problems ? `\n${problems} problem(s) found.` : '\nNo problems found.');
process.exit(problems ? 1 : 0);
