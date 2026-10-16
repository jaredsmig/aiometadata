// Sort choices an MDBList list can offer in the Stremio Discover dropdown in
// place of genres. Stremio has one free-form dropdown per catalog (the genre
// extra), so a list that opts in sends one of these labels as its "genre" and
// the catalog handler maps it back to MDBList's sort and order.

export interface MdblistSortChoice {
  label: string;
  sort: string;
  order: 'asc' | 'desc';
}

export const MDBLIST_SORT_CHOICES: MdblistSortChoice[] = [
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

const BY_LABEL = new Map(MDBLIST_SORT_CHOICES.map((choice) => [choice.label.toLowerCase(), choice]));

export function mdblistSortChoiceLabels(): string[] {
  return MDBLIST_SORT_CHOICES.map((choice) => choice.label);
}

/** Whether this catalog's Discover dropdown carries sort choices instead of genres. */
export function usesMdblistSortDropdown(catalogConfig: any): boolean {
  if (!catalogConfig || catalogConfig.discoverDropdown !== 'sort') return false;
  const id = String(catalogConfig.id || '');
  if (!id.startsWith('mdblist.')) return false;
  // These have no list sort to pick from.
  return id !== 'mdblist.upnext' && !id.startsWith('mdblist.discover.') && !id.startsWith('mdblist.recommended.');
}

/** The MDBList sort a dropdown value stands for, or null for 'None', an empty value or an unknown label. */
export function resolveMdblistSortChoice(value: string | null | undefined): MdblistSortChoice | null {
  if (!value) return null;
  return BY_LABEL.get(String(value).trim().toLowerCase()) || null;
}

module.exports = { MDBLIST_SORT_CHOICES, mdblistSortChoiceLabels, usesMdblistSortDropdown, resolveMdblistSortChoice };
