import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const authHeader = (token: string) => ({
  Authorization: `Bearer ${token.replaceAll('"', "")}`,
});

// ── Vendor: Explore open buyer requests ──────────────────────────────────────

export async function getOpenRequests(token: string) {
  const response = await axios.get(
    `${BASE_URL}/buyer_requests/vendor/explore/`,
    { headers: authHeader(token) }
  );
  return { data: response.data, error: false };
}

export async function getOpenRequestDetail(token: string, id: string) {
  const response = await axios.get(
    `${BASE_URL}/buyer_requests/vendor/explore/${id}/`,
    { headers: authHeader(token) }
  );
  return { data: response.data, error: false };
}

// ── Vendor: Manage own bids ───────────────────────────────────────────────────

export async function getMyBids(token: string) {
  const response = await axios.get(
    `${BASE_URL}/buyer_requests/vendor/bids/`,
    { headers: authHeader(token) }
  );
  return { data: response.data, error: false };
}

export interface BidPayload {
  request_id: string;
  bid_amount: string | number;
  delivery_time_days: string | number;
  proposal: string;
}

export async function createBid(
  token: string,
  bidData: BidPayload,
  images: File[]
) {
  const form = new FormData();
  form.append("request_id", bidData.request_id);
  form.append("bid_amount", String(bidData.bid_amount));
  form.append("delivery_time_days", String(bidData.delivery_time_days));
  form.append("proposal", bidData.proposal);
  images.forEach((img, i) => form.append(`image${i + 1}`, img));

  const response = await axios.post(
    `${BASE_URL}/buyer_requests/vendor/bids/`,
    form,
    { headers: authHeader(token) }
  );
  return { data: response.data, error: false };
}

export async function updateBid(
  token: string,
  bidId: string,
  bidData: Partial<BidPayload>,
  images: File[]
) {
  const form = new FormData();
  if (bidData.bid_amount !== undefined)
    form.append("bid_amount", String(bidData.bid_amount));
  if (bidData.delivery_time_days !== undefined)
    form.append("delivery_time_days", String(bidData.delivery_time_days));
  if (bidData.proposal !== undefined) form.append("proposal", bidData.proposal);
  images.forEach((img, i) => form.append(`image${i + 1}`, img));

  const response = await axios.put(
    `${BASE_URL}/buyer_requests/vendor/bids/${bidId}/`,
    form,
    { headers: authHeader(token) }
  );
  return { data: response.data, error: false };
}

export async function deleteBid(token: string, bidId: string) {
  await axios.delete(`${BASE_URL}/buyer_requests/vendor/bids/${bidId}/`, {
    headers: authHeader(token),
  });
  return { error: false };
}
