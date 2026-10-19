// Sort choices a list can offer in the Stremio Discover dropdown in place of
// genres. Stremio gives each catalog one free-form dropdown (the genre extra),
// so a list that opts in sends one of these labels as its "genre" and the
// catalog handler maps it back to the provider's own sort and direction.
//
// Sorting has to happen before a list is cut into pages, so each provider maps
// the labels to its native sort. MDBList sorts server-side; Letterboxd
// lists arrive whole from StremThru, so they are sorted here on the fields
// StremThru sends (year, rating, runtime, title, index).

export type SortDropdownProvider = 'mdblist' | 'letterboxd';

export interface SortChoice {
  label: string;
  sort: string;
  order: 'asc' | 'desc';
}

// MDBList's list items API reads `order` per field, not as a plain direction:
// on dates and numbers (released, added, runtime, score and every rating or vote
// count) asc is newest, highest or longest first, and desc reverses it. On title
// and rank, asc is A-Z and rank 1 first. Checked live against
// api.mdblist.com/lists/{id}/items in October 2026.
const MDBLIST_CHOICES: SortChoice[] = [
  { label: 'Release Date (Newest)', sort: 'released', order: 'asc' },
  { label: 'Release Date (Oldest)', sort: 'released', order: 'desc' },
  { label: 'List Rank', sort: 'rank', order: 'asc' },
  { label: 'MDBList Score', sort: 'score', order: 'asc' },
  { label: 'IMDb Rating', sort: 'imdbrating', order: 'asc' },
  { label: 'IMDb Votes', sort: 'imdbvotes', order: 'asc' },
  { label: 'Letterboxd Rating', sort: 'letterrating', order: 'asc' },
  { label: 'Rotten Tomatoes', sort: 'rtomatoes', order: 'asc' },
  { label: 'Metacritic', sort: 'metacritic', order: 'asc' },
  { label: 'Runtime (Longest)', sort: 'runtime', order: 'asc' },
  { label: 'Runtime (Shortest)', sort: 'runtime', order: 'desc' },
  { label: 'Title (A-Z)', sort: 'title', order: 'asc' },
  { label: 'Date Added (Newest)', sort: 'added', order: 'asc' },
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

const CHOICES: Record<SortDropdownProvider, SortChoice[]> = { mdblist: MDBLIST_CHOICES, letterboxd: LETTERBOXD_CHOICES };

const BY_LABEL: Record<SortDropdownProvider, Map<string, SortChoice>> = {
  mdblist: new Map(MDBLIST_CHOICES.map((c) => [c.label.toLowerCase(), c])),
  letterboxd: new Map(LETTERBOXD_CHOICES.map((c) => [c.label.toLowerCase(), c])),
};

/** Which provider's sort choices a catalog id can offer, or null when it has none. */
export function sortDropdownProviderForId(id: string): SortDropdownProvider | null {
  if (id.startsWith('mdblist.')) {
    if (id === 'mdblist.upnext' || id.startsWith('mdblist.discover.') || id.startsWith('mdblist.recommended.')) return null;
    return 'mdblist';
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
