/** Hidden from vendor add/edit listing category pickers (frontend only for now). */
export const LISTING_HIDDEN_CATEGORY_IDS = new Set([
  "videogames",
  "staywithus",
  "building-materials",
]);

export function filterListingCategories<T extends { id: string }>(categories: T[]): T[] {
  return categories.filter((cat) => !LISTING_HIDDEN_CATEGORY_IDS.has(cat.id));
}
