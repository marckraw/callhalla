import type { SavedRequest } from "@/shared";

const TAG_SEPARATOR = /[\n,]/;

export const parseTagsInput = (value: string): string[] => {
  const unique = new Set<string>();

  value
    .split(TAG_SEPARATOR)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0)
    .forEach((item) => {
      unique.add(item);
    });

  return [...unique];
};

const normalizeForSearch = (value: string) => value.trim().toLowerCase();

export const filterSavedRequests = (items: SavedRequest[], query: string): SavedRequest[] => {
  const terms = normalizeForSearch(query)
    .split(/\s+/)
    .filter((term) => term.length > 0);

  if (terms.length === 0) {
    return items;
  }

  return items.filter((item) => {
    const haystack = [item.name, item.draft.method, item.draft.url, item.tags.join(" ")]
      .join(" ")
      .toLowerCase();

    return terms.every((term) => haystack.includes(term));
  });
};
