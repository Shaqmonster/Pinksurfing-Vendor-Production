"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getNdaList,
  vendorAcceptNda,
  vendorDeleteDocument,
  vendorRejectNda,
  vendorUploadDocument,
  type NdaDocument,
  type NdaRow,
} from "@/api/ndaSignatures";

const DOCUMENT_TYPE_OPTIONS = [
  { value: "pl_statement",        label: "P&L Statement" },
  { value: "tax_returns",         label: "Tax Returns" },
  { value: "revenue_breakdown",   label: "Revenue Breakdown" },
  { value: "cim",                 label: "CIM / Info Memorandum" },
  { value: "bank_statements",     label: "Bank Statements" },
  { value: "lease_agreement",     label: "Lease Agreement" },
  { value: "franchise_agreement", label: "Franchise / Operating Agreement" },
  { value: "asset_list",          label: "Asset List / Equipment List" },
  { value: "other",               label: "Other" },
];

function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending_payment:  "Awaiting buyer payment",
    pending_vendor:   "Action needed",
    accepted:         "Buyer unlocked — instant access",
    rejected:         "Rejected / refunded",
    disputed:         "Disputed",
    dispute_refunded: "Closed (refunded)",
  };
  return map[s] || s;
}

function statusBadge(s: string) {
  const color: Record<string, string> = {
    pending_payment:  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    pending_vendor:   "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    accepted:         "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    rejected:         "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    disputed:         "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    dispute_refunded: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
  };
  return color[s] || "bg-primary-100 text-primary-700";
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

// ─── Upload drawer ────────────────────────────────────────────────────────────

function UploadDrawer({
  nda,
  onClose,
  onUploaded,
}: {
  nda: NdaRow;
  onClose: () => void;
  onUploaded: (updated: NdaRow) => void;
}) {
  const [docType, setDocType]     = useState("pl_statement");
  const [docName, setDocName]     = useState("");
  const [file, setFile]           = useState<File | null>(null);
  const [busy, setBusy]           = useState(false);
  const [err, setErr]             = useState<string | null>(null);
  const [delBusy, setDelBusy]     = useState<string | null>(null);
  const [docs, setDocs]           = useState<NdaDocument[]>(nda.documents);
  const fileRef                   = useRef<HTMLInputElement>(null);

  async function upload() {
    if (!file) { setErr("Please select a file."); return; }
    if (!docName.trim()) { setErr("Please enter a document name."); return; }
    setBusy(true);
    setErr(null);
    try {
      const doc = await vendorUploadDocument(nda.id, docType, docName.trim(), file);
      setDocs((d) => [...d, doc]);
      setFile(null);
      setDocName("");
      if (fileRef.current) fileRef.current.value = "";
      onUploaded({ ...nda, documents: [...docs, doc] });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteDoc(docId: string) {
    if (!confirm("Remove this document?")) return;
    setDelBusy(docId);
    try {
      await vendorDeleteDocument(nda.id, docId);
      const updated = docs.filter((d) => d.id !== docId);
      setDocs(updated);
      onUploaded({ ...nda, documents: updated });
    } catch {
      setErr("Delete failed.");
    } finally {
      setDelBusy(null);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-light-border bg-surface-50 p-5 dark:border-dark-border dark:bg-dark-hover">
      <h3 className="mb-4 text-sm font-semibold text-surface-800 dark:text-white">
        Upload Documents for {nda.full_name}
      </h3>

      {/* Existing documents */}
      {docs.length > 0 && (
        <div className="mb-4 space-y-2">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-xl border border-light-border bg-white px-3 py-2 dark:border-dark-border dark:bg-dark-card"
            >
              <div>
                <p className="text-sm font-medium text-surface-900 dark:text-white">
                  {doc.document_name}
                </p>
                <p className="text-xs text-surface-500">{doc.document_type} · {fmt(doc.uploaded_at)}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={doc.file}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary-500 hover:underline"
                >
                  View
                </a>
                <button
                  type="button"
                  disabled={delBusy === doc.id}
                  onClick={() => deleteDoc(doc.id)}
                  className="text-xs text-red-500 hover:underline disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload form */}
      <div className="space-y-3">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="w-full rounded-lg border border-light-border bg-white px-3 py-2 text-sm dark:border-dark-border dark:bg-dark-card dark:text-white"
        >
          {DOCUMENT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Document name (e.g. P&L 2023)"
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
          className="w-full rounded-lg border border-light-border bg-white px-3 py-2 text-sm dark:border-dark-border dark:bg-dark-card dark:text-white"
        />

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.xlsx,.xls,.docx,.doc,.csv,.png,.jpg"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-sm text-surface-600 dark:text-surface-400"
        />

        {err && <p className="text-xs text-red-500">{err}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={upload}
            className="rounded-xl bg-gradient-pink px-4 py-2 text-sm font-semibold text-white shadow-glow-pink disabled:opacity-50"
          >
            {busy ? "Uploading…" : "Upload Document"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-surface-200 px-4 py-2 text-sm text-surface-700 dark:border-dark-border dark:text-surface-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NdaRequestsPage() {
  const [rows, setRows]             = useState<NdaRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [busyId, setBusyId]         = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState<string | null>(null);
  const [rejectDraft, setRejectDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { error: err, data } = await getNdaList();
    if (err) setError("Could not load signed NDAs and leads.");
    else setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function onAccept(row: NdaRow) {
    setBusyId(row.id);
    try {
      const updated = await vendorAcceptNda(row.id);
      setRows((r) => r.map((x) => (x.id === row.id ? updated : x)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Accept failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function onReject(row: NdaRow) {
    const reason = rejectDraft[row.id] || "";
    if (!confirm("Decline this buyer's financials request? They will be refunded $1.00.")) return;
    setBusyId(row.id);
    try {
      const updated = await vendorRejectNda(row.id, reason);
      setRows((r) => r.map((x) => (x.id === row.id ? updated : x)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Reject failed.");
    } finally {
      setBusyId(null);
    }
  }

  function onUploaded(updated: NdaRow) {
    setRows((r) => r.map((x) => (x.id === updated.id ? updated : x)));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-5xl px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
          Signed NDAs and Leads List
        </h1>
        <p className="mt-2 text-surface-600 dark:text-surface-400">
          Buyers who signed your NDA and paid to request business financials. Review signed
          agreements, share documents, and track interested leads.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-surface-500">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-light-border bg-white p-10 text-center dark:border-dark-border dark:bg-dark-card">
          <p className="text-2xl">📄</p>
          <p className="mt-2 font-medium text-surface-700 dark:text-surface-300">No signed NDAs or leads yet.</p>
          <p className="mt-1 text-sm text-surface-500">When buyers sign your NDA and request financials, they will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {rows.map((row) => (
            <div
              key={row.id}
              className="relative overflow-hidden rounded-2xl border border-light-border bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card"
            >
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-gradient-pink opacity-10 blur-2xl" />
              <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                {/* Left: buyer + listing info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(row.status)}`}>
                      {statusLabel(row.status)}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-surface-900 dark:text-white">
                    {row.product_name}
                  </h2>

                  <div className="mt-3 grid gap-1 text-sm text-surface-600 dark:text-surface-400">
                    <p>
                      <span className="font-medium text-surface-800 dark:text-surface-200">Buyer: </span>
                      {row.full_name}
                    </p>
                    <p>
                      <span className="font-medium">Email: </span>
                      {row.email}
                    </p>
                    {row.company && (
                      <p><span className="font-medium">Company: </span>{row.company}</p>
                    )}
                    <p>
                      <span className="font-medium">Role: </span>
                      {row.buyer_role}
                    </p>
                    <p className="text-xs text-surface-500 mt-1">
                      Signed: {fmt(row.signed_at)} · ID: {row.id.slice(0, 8)}…
                    </p>
                    {row.rejection_reason && (
                      <p className="text-xs text-red-500 mt-1">
                        Rejection reason: {row.rejection_reason}
                      </p>
                    )}
                    {row.dispute_reason && (
                      <p className="text-xs text-orange-600 mt-1">
                        Dispute: {row.dispute_reason}
                      </p>
                    )}
                    {row.documents.length > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        {row.documents.length} document(s) uploaded
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex min-w-[220px] flex-col gap-2">
                  {row.status === "pending_payment" && (
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      Waiting for the buyer to complete the $1 NDA payment. When payment clears, status becomes &quot;Action needed&quot;
                      and you can accept or reject.
                    </p>
                  )}
                  {row.status === "pending_vendor" && (
                    <>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => onAccept(row)}
                        className="rounded-xl bg-gradient-pink px-4 py-2.5 text-sm font-semibold text-white shadow-glow-pink disabled:opacity-50"
                      >
                        Accept &amp; share documents
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => onReject(row)}
                        className="rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-semibold text-surface-700 hover:bg-surface-50 dark:border-dark-border dark:text-surface-200 dark:hover:bg-dark-hover"
                      >
                        Reject &amp; refund buyer
                      </button>
                      <label className="mt-1 text-xs text-surface-500">
                        Optional rejection reason
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. We are not accepting NDAs at this time."
                        value={rejectDraft[row.id] || ""}
                        onChange={(e) =>
                          setRejectDraft((d) => ({ ...d, [row.id]: e.target.value }))
                        }
                        className="rounded-lg border border-light-border bg-white px-3 py-2 text-xs dark:border-dark-border dark:bg-dark-hover dark:text-white"
                      />
                    </>
                  )}

                  {row.status === "accepted" && (
                    <button
                      type="button"
                      onClick={() =>
                        setUploadOpen(uploadOpen === row.id ? null : row.id)
                      }
                      className="rounded-xl bg-gradient-pink px-4 py-2.5 text-sm font-semibold text-white shadow-glow-pink"
                    >
                      {uploadOpen === row.id ? "Close upload panel" : "Manage documents"}
                    </button>
                  )}

                  {row.status === "rejected" && (
                    <p className="text-xs text-surface-500">
                      Rejected. Buyer has been refunded.
                    </p>
                  )}

                  {row.status === "disputed" && (
                    <div className="rounded-xl border border-orange-300 bg-orange-50 px-3 py-2 text-xs text-orange-800 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-300">
                      Buyer has raised a dispute. Our team will review and may issue a refund.
                    </div>
                  )}
                </div>
              </div>

              {/* Upload drawer (inline) */}
              <AnimatePresence>
                {uploadOpen === row.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <UploadDrawer
                      nda={row}
                      onClose={() => setUploadOpen(null)}
                      onUploaded={(updated) => {
                        onUploaded(updated);
                        setUploadOpen(null);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
