// Sort choices a list can offer in the Stremio Discover dropdown in place of
// genres. Stremio gives each catalog one free-form dropdown (the genre extra),
// so a list that opts in sends one of these labels as its "genre" and the
// catalog handler maps it back to the provider's own sort and direction.
//
// Sorting has to happen before a list is cut into pages, so each provider maps
// the labels to its native sort. MDBList and Trakt sort server-side; Letterboxd
// lists arrive whole from StremThru, so they are sorted here on the fields
// StremThru sends (year, rating, runtime, title, index).

export type SortDropdownProvider = 'mdblist' | 'trakt' | 'letterboxd';

export interface SortChoice {
  label: string;
  sort: string;
  order: 'asc' | 'desc';
}

const MDBLIST_CHOICES: SortChoice[] = [
  { label: 'Release Date (Newest)', sort: 'released', order: 'desc' },
  { label: 'Release Date (Oldest)', sort: 'released', order: 'asc' },
  { label: 'List Rank', sort: 'rank', order: 'asc' },
  { label: 'MDBList Score', sort: 'score', order: 'desc' },
  { label: 'IMDb Rating', sort: 'imdbrating', order: 'desc' },
  { label: 'IMDb Votes', sort: 'imdbvotes', order: 'desc' },
  { label: 'Letterboxd Rating', sort: 'letterrating', order: 'desc' },
  { label: 'Rotten Tomatoes', sort: 'rtomatoes', order: 'desc' },
  { label: 'Metacritic', sort: 'metacritic', order: 'desc' },
  { label: 'Runtime (Longest)', sort: 'runtime', order: 'desc' },
  { label: 'Runtime (Shortest)', sort: 'runtime', order: 'asc' },
  { label: 'Title (A-Z)', sort: 'title', order: 'asc' },
  { label: 'Date Added (Newest)', sort: 'added', order: 'desc' },
  { label: 'Random', sort: 'random', order: 'asc' },
];

const TRAKT_CHOICES: SortChoice[] = [
  { label: 'Release Date (Newest)', sort: 'released', order: 'desc' },
  { label: 'Release Date (Oldest)', sort: 'released', order: 'asc' },
  { label: 'List Rank', sort: 'rank', order: 'asc' },
  { label: 'Trakt Rating', sort: 'percentage', order: 'desc' },
  { label: 'IMDb Rating', sort: 'imdb_rating', order: 'desc' },
  { label: 'IMDb Votes', sort: 'imdb_votes', order: 'desc' },
  { label: 'TMDB Rating', sort: 'tmdb_rating', order: 'desc' },
  { label: 'Rotten Tomatoes', sort: 'rt_tomatometer', order: 'desc' },
  { label: 'Metacritic', sort: 'metascore', order: 'desc' },
  { label: 'Popularity', sort: 'popularity', order: 'desc' },
  { label: 'Runtime (Longest)', sort: 'runtime', order: 'desc' },
  { label: 'Runtime (Shortest)', sort: 'runtime', order: 'asc' },
  { label: 'Title (A-Z)', sort: 'title', order: 'asc' },
  { label: 'Date Added (Newest)', sort: 'added', order: 'desc' },
  { label: 'Random', sort: 'random', order: 'asc' },
];

// sort names a StremThru list item field. StremThru sends the release year only,
// so titles from the same year keep their list order.
const LETTERBOXD_CHOICES: SortChoice[] = [
  { label: 'Release Year (Newest)', sort: 'year', order: 'desc' },
  { label: 'Release Year (Oldest)', sort: 'year', order: 'asc' },
  { label: 'List Order', sort: 'index', order: 'asc' },
  { label: 'Letterboxd Rating', sort: 'rating', order: 'desc' },
  { label: 'Runtime (Longest)', sort: 'runtime', order: 'desc' },
  { label: 'Runtime (Shortest)', sort: 'runtime', order: 'asc' },
  { label: 'Title (A-Z)', sort: 'title', order: 'asc' },
];

const CHOICES: Record<SortDropdownProvider, SortChoice[]> = { mdblist: MDBLIST_CHOICES, trakt: TRAKT_CHOICES, letterboxd: LETTERBOXD_CHOICES };

const BY_LABEL: Record<SortDropdownProvider, Map<string, SortChoice>> = {
  mdblist: new Map(MDBLIST_CHOICES.map((c) => [c.label.toLowerCase(), c])),
  trakt: new Map(TRAKT_CHOICES.map((c) => [c.label.toLowerCase(), c])),
  letterboxd: new Map(LETTERBOXD_CHOICES.map((c) => [c.label.toLowerCase(), c])),
};

// Feeds and generated catalogs with no list order to choose from.
const TRAKT_EXCLUDED = /^trakt\.(upnext|unwatched|calendar|most_favorited|trending|popular|anticipated|recommendations|search)\b/;

/** Which provider's sort choices a catalog id can offer, or null when it has none. */
export function sortDropdownProviderForId(id: string): SortDropdownProvider | null {
  if (id.startsWith('mdblist.')) {
    if (id === 'mdblist.upnext' || id.startsWith('mdblist.discover.') || id.startsWith('mdblist.recommended.')) return null;
    return 'mdblist';
  }
  if (id.startsWith('trakt.')) {
    return TRAKT_EXCLUDED.test(id) ? null : 'trakt';
  }
  if (id.startsWith('letterboxd.')) return 'letterboxd';
  return null;
}

/** The provider whose sort choices this catalog's Discover dropdown carries, or null when it carries genres. */
export function sortDropdownProvider(catalogConfig: any): SortDropdownProvider | null {
  if (!catalogConfig || catalogConfig.discoverDropdown !== 'sort') return null;
  return sortDropdownProviderForId(String(catalogConfig.id || ''));
}

export function sortChoiceLabels(provider: SortDropdownProvider): string[] {
  return CHOICES[provider].map((c) => c.label);
}

/** The sort a dropdown value stands for, or null for 'None', an empty value or an unknown label. */
export function resolveSortChoice(provider: SortDropdownProvider, value: string | null | undefined): SortChoice | null {
  if (!value) return null;
  return BY_LABEL[provider].get(String(value).trim().toLowerCase()) || null;
}

// StremThru sends 0 when it has no year, rating or runtime; for index, 0 is the first item.
const ZERO_MEANS_MISSING = new Set(['year', 'rating', 'runtime']);

/**
 * Sorts a whole list held in memory by one item field. Items missing the field
 * (no year, no rating) go last in either direction, and ties keep list order.
 * Returns a new array.
 */
export function sortItemsLocally<T extends Record<string, any>>(items: T[], choice: SortChoice): T[] {
  const field = choice.sort;
  const dir = choice.order === 'desc' ? -1 : 1;
  const zeroIsMissing = ZERO_MEANS_MISSING.has(field);
  const missing = (v: any) => v === undefined || v === null || v === '' || (zeroIsMissing && v === 0);
  return items
    .map((item, position) => ({ item, position }))
    .sort((a, b) => {
      const av = a.item[field];
      const bv = b.item[field];
      const am = missing(av);
      const bm = missing(bv);
      if (am !== bm) return am ? 1 : -1;
      if (!am && av !== bv) {
        const cmp = typeof av === 'string' ? av.localeCompare(String(bv), undefined, { sensitivity: 'base' }) : av - bv;
        if (cmp !== 0) return cmp * dir;
      }
      return a.position - b.position;
    })
    .map(({ item }) => item);
}

module.exports = { sortDropdownProviderForId, sortDropdownProvider, sortChoiceLabels, resolveSortChoice, sortItemsLocally };
