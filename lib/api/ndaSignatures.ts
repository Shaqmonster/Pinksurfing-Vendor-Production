import axios from "axios";
import { vendorAuthHeaders } from "@/utils/vendorAuth";

const BASE = process.env.NEXT_PUBLIC_BASE_URL;

function authHeader() {
  return vendorAuthHeaders();
}

export type NdaDocument = {
  id: string;
  document_type: string;
  document_name: string;
  file: string;
  uploaded_at: string;
};

export type NdaRow = {
  id: string;
  status: string;
  full_name: string;
  email: string;
  company: string;
  buyer_role: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  vendor_id: string;
  vendor_store_name: string;
  signed_at: string;
  paid_at: string | null;
  vendor_accepted_at: string | null;
  rejection_reason: string;
  dispute_reason: string;
  disputed_at: string | null;
  dispute_resolved: boolean;
  refunded_at: string | null;
  documents: NdaDocument[];
};

export async function getNdaCount(): Promise<number> {
  const h = authHeader();
  if (!h || !BASE) return 0;
  try {
    const res = await axios.get(`${BASE}/nda/vendor/count/`, { headers: h });
    return typeof res.data?.count === "number" ? res.data.count : 0;
  } catch {
    return 0;
  }
}

export async function getNdaList(): Promise<{ error: boolean; data: NdaRow[] }> {
  const h = authHeader();
  if (!h || !BASE) return { error: true, data: [] };
  try {
    const res = await axios.get(`${BASE}/nda/vendor/`, { headers: h });
    return { error: false, data: res.data as NdaRow[] };
  } catch {
    return { error: true, data: [] };
  }
}

export async function vendorAcceptNda(ndaId: string): Promise<NdaRow> {
  const h = authHeader();
  if (!h || !BASE) throw new Error("Not authenticated");
  const res = await axios.post(`${BASE}/nda/${ndaId}/accept/`, {}, { headers: h });
  return res.data as NdaRow;
}

export async function vendorRejectNda(ndaId: string, rejectionReason?: string): Promise<NdaRow> {
  const h = authHeader();
  if (!h || !BASE) throw new Error("Not authenticated");
  const res = await axios.post(
    `${BASE}/nda/${ndaId}/reject/`,
    { rejection_reason: rejectionReason || "" },
    { headers: h }
  );
  return res.data as NdaRow;
}

export async function vendorUploadDocument(
  ndaId: string,
  documentType: string,
  documentName: string,
  file: File
): Promise<NdaDocument> {
  const h = authHeader();
  if (!h || !BASE) throw new Error("Not authenticated");
  const form = new FormData();
  form.append("document_type", documentType);
  form.append("document_name", documentName);
  form.append("file", file);
  const res = await axios.post(`${BASE}/nda/${ndaId}/upload/`, form, {
    headers: { ...h, "Content-Type": "multipart/form-data" },
  });
  return res.data as NdaDocument;
}

export async function vendorDeleteDocument(ndaId: string, docId: string): Promise<void> {
  const h = authHeader();
  if (!h || !BASE) throw new Error("Not authenticated");
  await axios.delete(`${BASE}/nda/${ndaId}/document/${docId}/`, { headers: h });
}
