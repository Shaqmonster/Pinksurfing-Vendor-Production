/**
 * Static export builds one shell page per dynamic route (id = "_").
 * Real entity ids live in the browser URL path or ?id= query param.
 */

export function staticDetailHref(basePath: string, id: string): string {
  const normalized = basePath.replace(/\/$/, "");
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
    if (last && last !== "_") {
      return decodeURIComponent(last);
    }
  }

  if (routeParam && routeParam !== "_") {
    return routeParam;
  }

  return undefined;
}
