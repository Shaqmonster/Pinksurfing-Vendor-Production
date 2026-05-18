"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteProductNdaDocument,
  listProductNdaDocuments,
  ProductNdaDocument,
  uploadProductNdaDocument,
} from "@/api/productNdaDocuments";
import { buildNdaDocumentDisplayName } from "@/utils/ndaDocumentNaming";
import {
  FINANCIAL_DOC_ACCEPT,
  FINANCIAL_DOC_MAX_LISTING_BYTES,
  formatFinancialDocBytes,
  sumPendingDocBytes,
  validateFinancialDocumentFile,
} from "@/utils/financialDocumentUpload";
import { toast } from "react-toastify";

const DOC_TYPE_OPTIONS = [
  { id: "pl_statement", label: "P&L Statement" },
  { id: "tax_returns", label: "Tax Returns" },
  { id: "revenue_breakdown", label: "Revenue Breakdown" },
  { id: "cim", label: "CIM / Info Memorandum" },
  { id: "bank_statements", label: "Bank Statements" },
  { id: "lease_agreement", label: "Lease Agreement" },
  { id: "franchise_agreement", label: "Franchise Agreement" },
  { id: "asset_list", label: "Asset List" },
  { id: "other", label: "Other" },
];

export type PendingNdaListingDoc = {
  id: string;
  file: File;
  document_type: string;
  document_name: string;
};

type Props = {
  productId?: string;
  pendingDocs?: PendingNdaListingDoc[];
  onPendingDocsChange?: (docs: PendingNdaListingDoc[]) => void;
  ndaLocksEnabled: boolean;
  variant?: "wizard" | "panel";
};

function totalRemoteBytes(docs: ProductNdaDocument[]): number {
  return docs.reduce((n, d) => n + (d.file_size ?? 0), 0);
}

export function ProductNdaDocumentsSection({
  productId,
  pendingDocs = [],
  onPendingDocsChange,
  ndaLocksEnabled,
  variant = "wizard",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [remoteDocs, setRemoteDocs] = useState<ProductNdaDocument[]>([]);
  const [docType, setDocType] = useState("pl_statement");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadRemote = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    const { error, data } = await listProductNdaDocuments(productId);
    if (!error) setRemoteDocs(data);
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    loadRemote();
  }, [loadRemote]);

  const usedBytes = useMemo(() => {
    if (productId) return totalRemoteBytes(remoteDocs);
    return sumPendingDocBytes(pendingDocs);
  }, [productId, remoteDocs, pendingDocs]);

  const atListingLimit = usedBytes >= FINANCIAL_DOC_MAX_LISTING_BYTES;

  if (!ndaLocksEnabled) return null;

  const isWizard = variant === "wizard";
  const selectedLabel =
    DOC_TYPE_OPTIONS.find((o) => o.id === docType)?.label || "Document";

  const hintCls = isWizard
    ? "text-[10px] text-[var(--text-3,#66667a)]"
    : "text-[11px] text-surface-500";
  const boxCls = isWizard
    ? "text-[11px] leading-relaxed rounded-md p-2.5 border border-[var(--border,#2a2a33)] bg-[var(--surface-2,#1c1c22)]"
    : "text-xs leading-relaxed rounded-lg p-3 border border-surface-200 dark:border-dark-border bg-surface-50 dark:bg-dark-surface";

  const validateAndGetName = (file: File) => {
    const check = validateFinancialDocumentFile(file, usedBytes);
    if (!check.ok) {
      toast.error(check.message);
      return null;
    }
    return buildNdaDocumentDisplayName(docType, file.name);
  };

  const addPending = (file: File) => {
    if (!onPendingDocsChange) return;
    const displayName = validateAndGetName(file);
    if (!displayName) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    onPendingDocsChange([
      ...pendingDocs,
      {
        id: `${Date.now()}-${file.name}`,
        file,
        document_type: docType,
        document_name: displayName,
      },
    ]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const displayName = validateAndGetName(file);
    if (!displayName) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (productId) {
      setUploading(true);
      const { error, message } = await uploadProductNdaDocument(
        productId,
        docType,
        displayName,
        file
      );
      setUploading(false);
      if (error) {
        toast.error(message || "Could not upload document.");
        return;
      }
      toast.success(`Uploaded ${displayName}`);
      if (inputRef.current) inputRef.current.value = "";
      loadRemote();
      return;
    }

    addPending(file);
    toast.success(`Added ${displayName} — uploads when you save the listing.`);
  };

  const renderDocList = (
    items: {
      id: string;
      name: string;
      type: string;
      size?: number;
      extra?: string;
      onRemove: () => void;
    }[]
  ) => (
    <ul className={isWizard ? "mt-3 flex flex-col gap-1.5" : "mt-3 flex flex-col gap-2"}>
      {items.map((item) => (
        <li
          key={item.id}
          className={
            isWizard
              ? "flex items-center justify-between gap-2 p-2 rounded-md text-xs border border-[var(--border,#2a2a33)]"
              : "flex items-center justify-between gap-2 p-2 rounded-lg border border-surface-200 dark:border-dark-border text-sm"
          }
        >
          <span className="min-w-0">
            <strong className="break-all">{item.name}</strong>
            <span className={`${hintCls} ml-1.5`}>
              ({item.type})
              {item.size != null ? ` · ${formatFinancialDocBytes(item.size)}` : ""}
              {item.extra ? ` · ${item.extra}` : ""}
            </span>
          </span>
          <button
            type="button"
            className="text-xs text-red-500 font-semibold flex-shrink-0"
            onClick={item.onRemove}
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );

  const usagePct = Math.min(100, (usedBytes / FINANCIAL_DOC_MAX_LISTING_BYTES) * 100);

  return (
    <div
      className={
        isWizard
          ? "mt-4 pt-4 border-t border-[var(--border,#2a2a33)]"
          : "mt-4 pt-4 border-t border-surface-200 dark:border-dark-border"
      }
    >
      <p
        className={
          isWizard
            ? "text-xs font-bold text-[var(--text-2,#b0b0c0)] mb-1"
            : "text-sm font-bold text-surface-900 dark:text-white mb-1"
        }
      >
        📎 Financial documents (locked until NDA)
      </p>

      <div className={`${boxCls} mb-3 grid sm:grid-cols-2 gap-3`}>
        <div>
          <p className={`font-semibold mb-1 ${isWizard ? "text-[var(--text-2,#b0b0c0)]" : "text-surface-700 dark:text-surface-300"}`}>
            Preferred
          </p>
          <ul className={`list-disc pl-4 space-y-0.5 ${hintCls}`}>
            <li>Manual entry in the fields above</li>
            <li>CSV exports</li>
            <li>XLSX / Excel workbooks</li>
            <li>Clean PDF reports (text-based, no scan)</li>
          </ul>
        </div>
        <div>
          <p className={`font-semibold mb-1 ${isWizard ? "text-[var(--text-2,#b0b0c0)]" : "text-surface-700 dark:text-surface-300"}`}>
            Avoid
          </p>
          <ul className={`list-disc pl-4 space-y-0.5 ${hintCls}`}>
            <li>JPG, PNG, HEIC — no photos or screenshots</li>
            <li>Phone pictures or camera scans</li>
            <li>Scanned image dumps</li>
            <li>Files with photos, logos, or watermarks inside</li>
          </ul>
        </div>
      </div>

      <div className={`${hintCls} mb-2`}>
        <div className="flex justify-between mb-1">
          <span>
            Storage: {formatFinancialDocBytes(usedBytes)} / {formatFinancialDocBytes(FINANCIAL_DOC_MAX_LISTING_BYTES)} per listing
          </span>
          <span>Max 10 MB per file</span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden bg-[var(--border,#2a2a33)]"
          style={!isWizard ? { background: "var(--tw-border-opacity)" } : undefined}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${usagePct}%`,
              background: usagePct > 90 ? "#f87171" : "#f0318a",
            }}
          />
        </div>
      </div>

      <div className={isWizard ? "mb-2" : "mb-3"}>
        <label
          className={
            isWizard
              ? "block text-[11px] font-semibold text-[var(--text-2,#b0b0c0)] mb-1"
              : "block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1"
          }
        >
          Document type
        </label>
        <select
          className={
            isWizard
              ? "fs w-full"
              : "w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-dark-border bg-surface-50 dark:bg-dark-input text-sm"
          }
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          disabled={atListingLimit}
        >
          {DOC_TYPE_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <p className={`${hintCls} mt-1`}>
          Auto-named on upload, e.g.{" "}
          <span className="font-mono">{buildNdaDocumentDisplayName(docType, "file.pdf")}</span>
        </p>
      </div>

      <div
        role="button"
        tabIndex={atListingLimit ? -1 : 0}
        onClick={() => !uploading && !atListingLimit && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (atListingLimit) return;
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={
          isWizard
            ? undefined
            : `border-2 border-dashed rounded-xl p-4 text-center text-sm ${
                atListingLimit
                  ? "opacity-50 cursor-not-allowed border-surface-200 text-surface-400"
                  : "cursor-pointer border-pink-300 dark:border-pink-700 text-surface-600 dark:text-surface-400 bg-pink-50/50 dark:bg-pink-950/20"
              }`
        }
        style={
          isWizard
            ? {
                border: "1.5px dashed rgba(240,49,138,.35)",
                borderRadius: 8,
                padding: "16px 12px",
                textAlign: "center",
                cursor: atListingLimit ? "not-allowed" : uploading ? "wait" : "pointer",
                opacity: atListingLimit ? 0.5 : 1,
                fontSize: 12,
                color: "var(--text-2, #b0b0c0)",
                background: "rgba(240,49,138,.04)",
              }
            : undefined
        }
      >
        {uploading
          ? "Uploading…"
          : atListingLimit
          ? "50 MB listing limit reached"
          : `+ Upload ${selectedLabel} (PDF, CSV, XLSX)`}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={FINANCIAL_DOC_ACCEPT}
        className="hidden"
        disabled={atListingLimit}
        onChange={handleFilePick}
      />

      {productId && loading && <p className={`${hintCls} mt-2`}>Loading documents…</p>}

      {productId &&
        remoteDocs.length > 0 &&
        renderDocList(
          remoteDocs.map((d) => ({
            id: d.id,
            name: d.document_name,
            type: d.document_type,
            size: d.file_size,
            onRemove: () => {
              if (!productId) return;
              deleteProductNdaDocument(productId, d.id).then((ok) => {
                if (!ok) toast.error("Could not delete document.");
                else {
                  toast.success("Document removed.");
                  loadRemote();
                }
              });
            },
          }))
        )}

      {!productId &&
        pendingDocs.length > 0 &&
        renderDocList(
          pendingDocs.map((d) => ({
            id: d.id,
            name: d.document_name,
            type: d.document_type,
            size: d.file.size,
            extra: d.file.name,
            onRemove: () => onPendingDocsChange?.(pendingDocs.filter((x) => x.id !== d.id)),
          }))
        )}
    </div>
  );
}
