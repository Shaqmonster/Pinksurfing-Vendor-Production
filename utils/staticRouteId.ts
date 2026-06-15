/**
 * Static export cannot emit one HTML file per product/order id.
 * Use flat pages + ?id= query (e.g. /inventory/edit-product?id=...).
 */

export function editProductHref(productId: string): string {
  return `/inventory/edit-product?id=${encodeURIComponent(productId)}`;
}

export function staticDetailHref(basePath: string, id: string): string {
  const normalized = basePath.replace(/\/$/, "");
  if (
    normalized === "/inventory/editProduct" ||
    normalized === "/inventory/edit-product"
  ) {
    return editProductHref(id);
  }
  return `${normalized}/_?id=${encodeURIComponent(id)}`;
}

/** Read the real id from ?id=, the last URL segment, or the route param. */
export function resolveStaticRouteId(routeParam?: string | null): string | undefined {
  if (typeof window !== "undefined") {
    const queryId = new URLSearchParams(window.location.search).get("id");
    if (queryId?.trim()) {
      return queryId.trim();
    }

    const segments = window.location.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && last !== "_" && last !== "edit-product" && last !== "editProduct") {
      return decodeURIComponent(last);
    }
  }

  if (routeParam && routeParam !== "_") {
    return routeParam;
  }

  return undefined;
}
