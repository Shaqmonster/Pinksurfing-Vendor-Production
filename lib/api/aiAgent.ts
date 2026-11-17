const getBase = (): string =>
  process.env.NEXT_PUBLIC_AI_AGENT_URL || 'http://localhost:4000';

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${getBase()}${path}`, init);
  return res.json();
}

// ─── Status & Logs ────────────────────────────────────────────────────────────

export async function fetchAgentStatus() {
  return apiFetch('/api/status');
}

export async function fetchAgentLogs(filters: Record<string, string> = {}) {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/api/logs${params ? `?${params}` : ''}`);
}

export async function fetchAgentCategories() {
  return apiFetch('/api/categories');
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function fetchAgentProducts(filters: Record<string, string | number | undefined> = {}) {
  const clean = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ) as Record<string, string>;
  const params = new URLSearchParams(clean).toString();
  return apiFetch(`/api/products${params ? `?${params}` : ''}`);
}

export async function markAgentProductPosted(productMongoId: string) {
  return apiFetch(`/api/products/${productMongoId}/posted`, { method: 'PATCH' });
}

// ─── Agent Controls ───────────────────────────────────────────────────────────

export async function agentStart() {
  return apiFetch('/api/agent/start', { method: 'POST' });
}

export async function agentPause() {
  return apiFetch('/api/agent/pause', { method: 'POST' });
}

export async function agentResume() {
  return apiFetch('/api/agent/resume', { method: 'POST' });
}

export async function agentStop() {
  return apiFetch('/api/agent/stop', { method: 'POST' });
}

export async function agentReset() {
  return apiFetch('/api/agent/reset', { method: 'POST' });
}

export async function agentFetch(queries: string[], maxItems: number) {
  return apiFetch('/api/agent/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queries, maxItems }),
  });
}

export async function updateAgentConfig(config: Record<string, unknown>) {
  return apiFetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function getAgentWsUrl(): string {
  const base = getBase();
  return base.replace(/^http/, 'ws');
}

/**
 * Returns a URL that proxies the given image through the agent server,
 * bypassing browser CORS restrictions so we can fetch it as a File.
 */
export function getProxiedImageUrl(imageUrl: string): string {
  return `${getBase()}/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
}

/**
 * Fetches a remote image via the agent proxy and returns it as a File,
 * ready to pass to `saveProducts`. Returns null if the download fails.
 */
export async function downloadImageAsFile(
  imageUrl: string,
  filename: string
): Promise<File | null> {
  try {
    const proxied = getProxiedImageUrl(imageUrl);
    const res = await fetch(proxied);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  } catch {
    return null;
  }
}
