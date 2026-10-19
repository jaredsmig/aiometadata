// Which catalogs can fill the Stremio Discover dropdown with sort options
// instead of genres. Mirrors sortDropdownProviderForId in
// addon/utils/discoverSortDropdown.ts; keep the two in step.

export function supportsSortDropdown(catalogId: string): boolean {
  if (catalogId.startsWith('mdblist.')) {
    return catalogId !== 'mdblist.upnext' && !catalogId.startsWith('mdblist.discover.') && !catalogId.startsWith('mdblist.recommended.');
  }
  if (catalogId.startsWith('letterboxd.')) return true;
  return false;
}
