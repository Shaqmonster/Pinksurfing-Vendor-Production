"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteProductNdaDocument,
  listProductNdaDocuments,
  ProductNdaDocument,
  uploadProductNdaDocument,
} from "@/api/productNdaDocuments";
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
  const [docName, setDocName] = useState("");
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

  if (!ndaLocksEnabled) return null;

  const isWizard = variant === "wizard";

  const addPending = (file: File) => {
    if (!onPendingDocsChange) return;
    const name = docName.trim() || file.name;
    onPendingDocsChange([
      ...pendingDocs,
      {
        id: `${Date.now()}-${file.name}`,
        file,
        document_type: docType,
        document_name: name,
      },
    ]);
    setDocName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (productId) {
      setUploading(true);
      const name = docName.trim() || file.name;
      const { error } = await uploadProductNdaDocument(productId, docType, name, file);
      setUploading(false);
      if (error) {
        toast.error("Could not upload document.");
        return;
      }
      toast.success("Document uploaded.");
      setDocName("");
      if (inputRef.current) inputRef.current.value = "";
      loadRemote();
      return;
    }

    addPending(file);
    toast.success("Document added — will upload when you save the listing.");
  };

  const renderDocList = (
    items: { id: string; name: string; type: string; extra?: string; onRemove: () => void }[]
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
          <span>
            <strong>{item.name}</strong>
            <span className="text-surface-500 ml-1.5">
              ({item.type}){item.extra ? ` · ${item.extra}` : ""}
            </span>
          </span>
          <button type="button" className="text-xs text-red-500 font-semibold" onClick={item.onRemove}>
            Remove
          </button>
        </li>
      ))}
    </ul>
  );

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
        📎 Upload financial documents (locked until NDA)
      </p>
      <p
        className={
          isWizard
            ? "text-[11px] text-[var(--text-3,#66667a)] mb-3 leading-relaxed"
            : "text-xs text-surface-500 mb-3 leading-relaxed"
        }
      >
        Upload PDFs or spreadsheets now. Buyers unlock them instantly after they sign the NDA and pay the $1 fee — no manual approval needed.
      </p>

      <div className={isWizard ? "grid grid-cols-2 gap-2 mb-2" : "grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2"}>
        <select
          className={
            isWizard
              ? "fs"
              : "w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-dark-border bg-surface-50 dark:bg-dark-input text-sm"
          }
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
        >
          {DOC_TYPE_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          className={
            isWizard
              ? "fi"
              : "w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-dark-border bg-surface-50 dark:bg-dark-input text-sm"
          }
          placeholder="Display name (optional)"
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
        />
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={
          isWizard
            ? undefined
            : "border-2 border-dashed border-pink-300 dark:border-pink-700 rounded-xl p-4 text-center cursor-pointer text-sm text-surface-600 dark:text-surface-400 bg-pink-50/50 dark:bg-pink-950/20"
        }
        style={
          isWizard
            ? {
                border: "1.5px dashed rgba(240,49,138,.35)",
                borderRadius: 8,
                padding: "16px 12px",
                textAlign: "center",
                cursor: uploading ? "wait" : "pointer",
                fontSize: 12,
                color: "var(--text-2, #b0b0c0)",
                background: "rgba(240,49,138,.04)",
              }
            : undefined
        }
      >
        {uploading ? "Uploading…" : "+ Choose file to upload"}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,image/*"
        className="hidden"
        onChange={handleFilePick}
      />

      {productId && loading && <p className="text-xs text-surface-500 mt-2">Loading documents…</p>}

      {productId &&
        remoteDocs.length > 0 &&
        renderDocList(
          remoteDocs.map((d) => ({
            id: d.id,
            name: d.document_name,
            type: d.document_type,
            onRemove: () => {
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
            extra: d.file.name,
            onRemove: () => onPendingDocsChange?.(pendingDocs.filter((x) => x.id !== d.id)),
          }))
        )}
    </div>
  );
}
