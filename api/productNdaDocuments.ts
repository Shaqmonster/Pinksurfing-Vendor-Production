import axios from "axios";
import { getCookie } from "@/utils/cookies";

const BASE = process.env.NEXT_PUBLIC_BASE_URL;

function authHeader() {
  const token = getCookie("access_token");
  if (!token) return null;
  return { Authorization: `Bearer ${token.replaceAll('"', "")}` };
}

export type ProductNdaDocument = {
  id: string;
  document_type: string;
  document_name: string;
  file: string;
  uploaded_at: string;
};

export async function listProductNdaDocuments(
  productId: string
): Promise<{ error: boolean; data: ProductNdaDocument[] }> {
  const h = authHeader();
  if (!h || !BASE) return { error: true, data: [] };
  try {
    const res = await axios.get(`${BASE}/nda/product/${productId}/listing-documents/`, {
      headers: h,
    });
    return { error: false, data: res.data as ProductNdaDocument[] };
  } catch {
    return { error: true, data: [] };
  }
}

export async function uploadProductNdaDocument(
  productId: string,
  documentType: string,
  documentName: string,
  file: File
): Promise<{ error: boolean; data?: ProductNdaDocument }> {
  const h = authHeader();
  if (!h || !BASE) return { error: true };
  const form = new FormData();
  form.append("document_type", documentType);
  form.append("document_name", documentName);
  form.append("file", file);
  try {
    const res = await axios.post(`${BASE}/nda/product/${productId}/listing-documents/`, form, {
      headers: { ...h, "Content-Type": "multipart/form-data" },
    });
    return { error: false, data: res.data as ProductNdaDocument };
  } catch {
    return { error: true };
  }
}

export async function uploadPendingProductNdaDocuments(
  productId: string,
  pending: { file: File; document_type: string; document_name: string }[]
): Promise<{ uploaded: number; failed: number }> {
  let uploaded = 0;
  let failed = 0;
  for (const doc of pending) {
    const { error } = await uploadProductNdaDocument(
      productId,
      doc.document_type,
      doc.document_name,
      doc.file
    );
    if (error) failed += 1;
    else uploaded += 1;
  }
  return { uploaded, failed };
}

export async function deleteProductNdaDocument(
  productId: string,
  docId: string
): Promise<boolean> {
  const h = authHeader();
  if (!h || !BASE) return false;
  try {
    await axios.delete(`${BASE}/nda/product/${productId}/listing-documents/${docId}/`, {
      headers: h,
    });
    return true;
  } catch {
    return false;
  }
}
