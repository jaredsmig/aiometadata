// Sort choices an MDBList list can offer in the Stremio Discover dropdown in
// place of genres. Stremio has one free-form dropdown per catalog (the genre
// extra), so a list that opts in sends one of these labels as its "genre" and
// the catalog handler maps it back to MDBList's sort and order.

export interface MdblistSortChoice {
  label: string;
  sort: string;
  order: 'asc' | 'desc';
}

// MDBList's list items API reads `order` per field, not as a plain direction:
// on dates and numbers (released, added, runtime, score and every rating or vote
// count) asc is newest, highest or longest first, and desc reverses it. On title
// and rank, asc is A-Z and rank 1 first. Checked live against
// api.mdblist.com/lists/{id}/items in October 2026.
export const MDBLIST_SORT_CHOICES: MdblistSortChoice[] = [
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
