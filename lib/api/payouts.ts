import axios from "axios";
import { resolveVendorApiToken, vendorAuthHeaders } from "@/utils/vendorAuth";

const BASE = process.env.NEXT_PUBLIC_BASE_URL;

export type PayoutStatus = "PENDING" | "CLEARED" | "PAID_OUT";

export type PayoutRow = {
  id: string;
  amount: string;
  status: PayoutStatus;
  created_at: string;
  updated_at: string;
  product_name: string;
  quantity: number;
  item_total: string;
  order_status: string;
  order_number: string | null;
};

export type PayoutsPage = {
  totals: Record<PayoutStatus, { amount: string; count: number }>;
  count: number;
  page: number;
  page_size: number;
  results: PayoutRow[];
};

/** The vendor's earnings per sold item (read-only). */
export async function getPayouts(params: { status?: string; page?: number } = {}): Promise<PayoutsPage> {
  const h = vendorAuthHeaders(await resolveVendorApiToken());
  if (!h || !BASE) throw new Error("Please sign in again.");
  const res = await axios.get(`${BASE}/vendor/payouts/`, {
    headers: h,
    params: { page_size: 25, ...params },
  });
  return res.data as PayoutsPage;
}
