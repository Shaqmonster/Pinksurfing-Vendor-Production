import axios from "axios";
import { vendorAuthHeaders } from "@/utils/vendorAuth";

const BASE = process.env.NEXT_PUBLIC_BASE_URL;

function authHeader() {
  return vendorAuthHeaders();
}

export async function getPropertyVisitCount(): Promise<number> {
  const h = authHeader();
  if (!h || !BASE) return 0;
  try {
    const res = await axios.get(`${BASE}/property-visits/vendor/count/`, {
      headers: h,
    });
    return typeof res.data?.count === "number" ? res.data.count : 0;
  } catch {
    return 0;
  }
}

export async function getPropertyVisitList() {
  const h = authHeader();
  if (!h || !BASE) return { error: true, data: [] as unknown[] };
  try {
    const res = await axios.get(`${BASE}/property-visits/vendor/`, {
      headers: h,
    });
    return { error: false, data: res.data as unknown[] };
  } catch {
    return { error: true, data: [] as unknown[] };
  }
}

export async function vendorAcceptVisit(visitId: string) {
  const h = authHeader();
  if (!h || !BASE) throw new Error("Not authenticated");
  const res = await axios.post(
    `${BASE}/property-visits/${visitId}/vendor/accept/`,
    {},
    { headers: h }
  );
  return res.data;
}

export async function vendorRejectVisit(visitId: string) {
  const h = authHeader();
  if (!h || !BASE) throw new Error("Not authenticated");
  const res = await axios.post(
    `${BASE}/property-visits/${visitId}/vendor/reject/`,
    {},
    { headers: h }
  );
  return res.data;
}

export async function vendorRescheduleVisit(visitId: string, proposedAt: string) {
  const h = authHeader();
  if (!h || !BASE) throw new Error("Not authenticated");
  const res = await axios.post(
    `${BASE}/property-visits/${visitId}/vendor/reschedule/`,
    { proposed_at: proposedAt },
    { headers: h }
  );
  return res.data;
}
