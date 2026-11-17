import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export type OffMarketDealProfilePayload = {
  product_id: string;
  is_off_market?: boolean;
  property_class?: string;
  listing_intent?: string;
  arv: number | string;
  asking_price: number | string;
  city: string;
  state: string;
  beds?: number | null;
  teaser_summary?: string;
  popular_tags?: string[];
  unlock_fee?: number | string;
  max_unlock_slots?: number;
  unlock_fee_credited_at_close?: boolean;
  deadline_type?: string;
  deadline_at: string;
  full_address?: string;
  lat?: number | null;
  lng?: number | null;
};

export async function upsertOffMarketDealProfile(
  token: string | null,
  payload: OffMarketDealProfilePayload
) {
  if (!token) return { error: true, data: null };
  try {
    const response = await axios.post(
      `${BASE_URL}/off-market-deals/profile/`,
      payload,
      {
        headers: { Authorization: `Bearer ${token.replaceAll('"', "")}` },
      }
    );
    return { error: false, data: response.data };
  } catch (error: any) {
    return { error: true, data: error?.response?.data };
  }
}

export async function listOutreachCampaigns(token: string | null) {
  if (!token) return { error: true, data: [] };
  try {
    const response = await axios.get(`${BASE_URL}/off-market-deals/outreach/campaigns/`, {
      headers: { Authorization: `Bearer ${token.replaceAll('"', "")}` },
    });
    return { error: false, data: response.data };
  } catch {
    return { error: true, data: [] };
  }
}

export async function sendOutreachCampaign(token: string | null, campaignId: string) {
  if (!token) return { error: true };
  try {
    await axios.post(
      `${BASE_URL}/off-market-deals/outreach/campaigns/${campaignId}/send/`,
      {},
      { headers: { Authorization: `Bearer ${token.replaceAll('"', "")}` } }
    );
    return { error: false };
  } catch {
    return { error: true };
  }
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token.replaceAll('"', "")}` };
}

export async function fetchOffMarketProfile(
  token: string | null,
  productId: string
) {
  if (!token) return { error: true, data: null };
  try {
    const response = await axios.get(`${BASE_URL}/off-market-deals/profile/`, {
      params: { product_id: productId },
      headers: authHeader(token),
    });
    return { error: false, data: response.data };
  } catch (error: any) {
    return { error: true, data: error?.response?.data };
  }
}

/** Rows from either a bare array or a {results: [...]} response. */
function resultRows(data: any): any[] {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.results) ? data.results : [];
}

export async function listSupplyInvites(token: string | null) {
  if (!token) return { error: true, data: [] };
  try {
    const response = await axios.get(`${BASE_URL}/off-market-deals/supply/invites/`, {
      headers: authHeader(token),
    });
    return { error: false, data: resultRows(response.data) };
  } catch {
    return { error: true, data: [] };
  }
}

/** Revoke (is_active=false), reopen, or change an invite's expiry ("YYYY-MM-DD" or null). */
export async function updateSupplyInvite(
  token: string | null,
  inviteId: string,
  patch: { is_active?: boolean; expires_at?: string | null }
) {
  if (!token) return { error: true, data: null };
  try {
    const response = await axios.patch(
      `${BASE_URL}/off-market-deals/supply/invites/${inviteId}/`,
      patch,
      { headers: authHeader(token) }
    );
    return { error: false, data: response.data };
  } catch (error: any) {
    return { error: true, data: error?.response?.data };
  }
}

export async function createSupplyInvite(
  token: string | null,
  payload: { label?: string; max_uses?: number; expires_at?: string | null } = {}
) {
  if (!token) return { error: true, data: null };
  try {
    const response = await axios.post(
      `${BASE_URL}/off-market-deals/supply/invites/`,
      payload,
      { headers: authHeader(token) }
    );
    return { error: false, data: response.data };
  } catch (error: any) {
    return { error: true, data: error?.response?.data };
  }
}

export async function listSupplySubmissions(
  token: string | null,
  status: string = "pending"
) {
  if (!token) return { error: true, data: [] };
  try {
    const response = await axios.get(
      `${BASE_URL}/off-market-deals/supply/submissions/`,
      {
        params: { status },
        headers: authHeader(token),
      }
    );
    return { error: false, data: resultRows(response.data) };
  } catch {
    return { error: true, data: [] };
  }
}

export async function approveSupplySubmission(
  token: string | null,
  submissionId: string
) {
  if (!token) return { error: true, data: null };
  try {
    const response = await axios.post(
      `${BASE_URL}/off-market-deals/supply/submissions/${submissionId}/approve/`,
      {},
      { headers: authHeader(token) }
    );
    return { error: false, data: response.data };
  } catch (error: any) {
    return { error: true, data: error?.response?.data };
  }
}

export async function rejectSupplySubmission(
  token: string | null,
  submissionId: string,
  reason: string = ""
) {
  if (!token) return { error: true, data: null };
  try {
    const response = await axios.post(
      `${BASE_URL}/off-market-deals/supply/submissions/${submissionId}/reject/`,
      { reason },
      { headers: authHeader(token) }
    );
    return { error: false, data: response.data };
  } catch (error: any) {
    return { error: true, data: error?.response?.data };
  }
}

// ── Seller view of paid deal unlocks (Signed NDAs & Leads → Deal unlocks) ─────

export type DealUnlockRow = {
  unlock_id: string;
  product_id: string;
  listing_title: string;
  listing_slug: string;
  buyer_name: string;
  buyer_email: string;
  status: string;
  paid_at: string | null;
  deal_room_id: string | null;
  deal_room_state: string | null;
  conversation_id: number | null;
};

async function dealAuthHeaders() {
  const { resolveVendorApiToken, vendorAuthHeaders } = await import("@/utils/vendorAuth");
  return vendorAuthHeaders(await resolveVendorApiToken());
}

export async function listDealUnlocks(): Promise<{ error: boolean; data: DealUnlockRow[] }> {
  const headers = await dealAuthHeaders();
  if (!headers || !BASE_URL) return { error: true, data: [] };
  try {
    const res = await axios.get(`${BASE_URL}/off-market-deals/vendor/unlocks/`, { headers });
    const rows = Array.isArray(res.data) ? res.data : res.data?.results;
    return { error: false, data: Array.isArray(rows) ? rows : [] };
  } catch {
    return { error: true, data: [] };
  }
}

/** Move a deal room to its next state as the seller (the API checks who may do what). */
export async function sellerTransitionDealRoom(
  roomId: string,
  newState: string
): Promise<{ error: string | null; state: string | null }> {
  const headers = await dealAuthHeaders();
  if (!headers || !BASE_URL) return { error: "Please sign in again.", state: null };
  try {
    const res = await axios.patch(
      `${BASE_URL}/off-market-deals/rooms/${roomId}/`,
      { new_state: newState },
      { headers }
    );
    return { error: null, state: res.data?.state ?? newState };
  } catch (e: any) {
    return { error: e?.response?.data?.detail || "Couldn't update the deal.", state: null };
  }
}
