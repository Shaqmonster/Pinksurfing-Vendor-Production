/** Rules for NDA-locked financial document uploads on business-for-sale listings. */

export const FINANCIAL_DOC_MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const FINANCIAL_DOC_MAX_LISTING_BYTES = 50 * 1024 * 1024; // 50 MB

export const FINANCIAL_DOC_ACCEPT =
  ".pdf,.csv,.xlsx,.xls,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const ALLOWED_EXTENSIONS = new Set([".pdf", ".csv", ".xlsx", ".xls"]);

const BLOCKED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".heic",
  ".heif",
  ".webp",
  ".gif",
  ".bmp",
  ".tif",
  ".tiff",
]);

const BLOCKED_MIME_PREFIXES = ["image/"];

export type FinancialDocValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function formatFinancialDocBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extensionOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  if (i < 0) return "";
  return filename.slice(i).toLowerCase();
}

export function validateFinancialDocumentFile(
  file: File,
  existingBytes: number
): FinancialDocValidationResult {
  const ext = extensionOf(file.name);

  if (BLOCKED_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      message:
        "Photos and images are not accepted. Use CSV, XLSX, or a clean PDF export instead of JPG, PNG, or HEIC.",
    };
  }

  if (BLOCKED_MIME_PREFIXES.some((p) => (file.type || "").toLowerCase().startsWith(p))) {
    return {
      ok: false,
      message:
        "Image files are not accepted. Upload CSV, XLSX, or a clean PDF financial report.",
    };
  }

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      message:
        "Only PDF, CSV, and Excel (XLSX/XLS) files are allowed. Export your data from your accounting software.",
    };
  }

  if (file.size > FINANCIAL_DOC_MAX_FILE_BYTES) {
    return {
      ok: false,
      message: `This file is ${formatFinancialDocBytes(file.size)}. Maximum size per file is 10 MB.`,
    };
  }

  if (existingBytes + file.size > FINANCIAL_DOC_MAX_LISTING_BYTES) {
    const remaining = Math.max(0, FINANCIAL_DOC_MAX_LISTING_BYTES - existingBytes);
    return {
      ok: false,
      message: `Listing limit is 50 MB total (${formatFinancialDocBytes(existingBytes)} used). This file would exceed the limit — you have ${formatFinancialDocBytes(remaining)} remaining.`,
    };
  }

  return { ok: true };
}

export function sumPendingDocBytes(docs: { file: File }[]): number {
  return docs.reduce((n, d) => n + d.file.size, 0);
}
