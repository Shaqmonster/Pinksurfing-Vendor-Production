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
  verification_score?: number;
  verification_label?: string;
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
