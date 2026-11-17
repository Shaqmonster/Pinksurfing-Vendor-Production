import axios from "axios";
import { vendorAuthHeaders } from "@/utils/vendorAuth";
import { validateFinancialDocumentFile } from "@/utils/financialDocumentUpload";

const BASE = process.env.NEXT_PUBLIC_BASE_URL;

function authHeader() {
  return vendorAuthHeaders();
}

export type ProductNdaDocument = {
  id: string;
  document_type: string;
  document_name: string;
  file: string;
  file_size?: number;
  uploaded_at: string;
};

function uploadErrorMessage(err: unknown): string {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
  if (!data) return "Could not upload document.";
  const fileErr = data.file;
  if (Array.isArray(fileErr) && fileErr[0]) return String(fileErr[0]);
  if (typeof fileErr === "string") return fileErr;
  if (typeof data.detail === "string") return data.detail;
  return "Could not upload document.";
}

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
): Promise<{ error: boolean; data?: ProductNdaDocument; message?: string }> {
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
  } catch (err) {
    return { error: true, message: uploadErrorMessage(err) };
  }
}

export async function uploadPendingProductNdaDocuments(
  productId: string,
  pending: { file: File; document_type: string; document_name: string }[]
): Promise<{ uploaded: number; failed: number }> {
  let uploaded = 0;
  let failed = 0;
  let usedBytes = 0;
  for (const doc of pending) {
    const check = validateFinancialDocumentFile(doc.file, usedBytes);
    if (!check.ok) {
      failed += 1;
      continue;
    }
    const { error } = await uploadProductNdaDocument(
      productId,
      doc.document_type,
      doc.document_name,
      doc.file
    );
    if (error) failed += 1;
    else {
      uploaded += 1;
      usedBytes += doc.file.size;
    }
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
