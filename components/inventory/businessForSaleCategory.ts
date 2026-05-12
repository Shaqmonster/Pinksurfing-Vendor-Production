/** Category name from schema API — match case-insensitively. */
export function isBusinessForSaleCategory(categoryName: string): boolean {
  const n = categoryName.trim().toLowerCase().replace(/\s+/g, " ");
  return n === "business for sale" || n.includes("business for sale");
}
