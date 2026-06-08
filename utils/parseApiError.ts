/** Extract a human-readable message from vendor API error responses. */
export function parseApiErrorMessage(errorPayload: unknown, fallback = "Something went wrong"): string {
  if (!errorPayload) return fallback;
  if (typeof errorPayload === "string") {
    const match = errorPayload.match(/string='([^']+)'/);
    return match?.[1] || errorPayload;
  }
  if (typeof errorPayload !== "object") return fallback;

  const data = errorPayload as Record<string, unknown>;

  // Axios error.response wrapper: { data: { Status: "..." }, status: 400 }
  if (data.data && typeof data.data === "object") {
    const nested = parseApiErrorMessage(data.data, "");
    if (nested) return nested;
  }

  const status = data.Status ?? data.status ?? data.message ?? data.detail;

  if (typeof status === "string") {
    const match = status.match(/string='([^']+)'/);
    return match?.[1] || status;
  }
  if (Array.isArray(status) && status.length > 0) {
    return String(status[0]);
  }

  return fallback;
}
