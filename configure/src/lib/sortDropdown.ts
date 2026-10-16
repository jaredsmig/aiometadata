// Which catalogs can fill the Stremio Discover dropdown with sort options
// instead of genres. Mirrors sortDropdownProviderForId in
// addon/utils/discoverSortDropdown.ts; keep the two in step.

const TRAKT_EXCLUDED = /^trakt\.(upnext|unwatched|calendar|most_favorited|trending|popular|anticipated|recommendations|search)\b/;

export function supportsSortDropdown(catalogId: string): boolean {
  if (catalogId.startsWith('mdblist.')) {
    return catalogId !== 'mdblist.upnext' && !catalogId.startsWith('mdblist.discover.') && !catalogId.startsWith('mdblist.recommended.');
  }
  if (catalogId.startsWith('trakt.')) return !TRAKT_EXCLUDED.test(catalogId);
  if (catalogId.startsWith('letterboxd.')) return true;
  return false;
}
