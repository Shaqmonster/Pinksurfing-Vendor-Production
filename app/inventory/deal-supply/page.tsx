"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
// @ts-ignore
import "react-toastify/dist/ReactToastify.css";
import { resolveVendorApiToken } from "@/utils/vendorAuth";
import {
  approveSupplySubmission,
  createSupplyInvite,
  listSupplyInvites,
  listSupplySubmissions,
  rejectSupplySubmission,
} from "@/api/offMarketDeals";

type Invite = {
  id: string;
  label: string;
  share_url: string;
  uses_count: number;
  max_uses: number;
  is_active: boolean;
  is_usable: boolean;
  created_at?: string;
};

type Submission = {
  id: string;
  title: string;
  submitter_name: string;
  submitter_email: string;
  city: string;
  state: string;
  arv: string;
  asking_price: string;
  status: string;
  product_id?: string | null;
  product_active?: boolean;
  created_at?: string;
};

export default function DealSupplyPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await resolveVendorApiToken();
    if (!token) {
      toast.error("Session expired. Please sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    const [invRes, subRes] = await Promise.all([
      listSupplyInvites(token),
      listSupplySubmissions(token, statusFilter),
    ]);
    setInvites(invRes.data || []);
    setSubmissions(subRes.data || []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const onCreateInvite = async () => {
    const token = await resolveVendorApiToken();
    if (!token) return;
    setBusyId("create");
    const res = await createSupplyInvite(token, {
      label: label.trim() || undefined,
      max_uses: 50,
    });
    setBusyId(null);
    if (res.error) {
      toast.error(res.data?.detail || "Could not create invite.");
      return;
    }
    setLabel("");
    toast.success("Invite created — copy the share link.");
    if (res.data?.share_url && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(res.data.share_url);
        toast.info("Share link copied to clipboard.");
      } catch {
        /* ignore */
      }
    }
    load();
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied.");
    } catch {
      toast.info(url);
    }
  };

  const onApprove = async (id: string) => {
    const token = await resolveVendorApiToken();
    if (!token) return;
    setBusyId(id);
    const res = await approveSupplySubmission(token, id);
    setBusyId(null);
    if (res.error) {
      toast.error(res.data?.detail || "Approve failed.");
      return;
    }
    toast.success("Approved — draft listing created. Pay listing fee to go live.");
    load();
  };

  const onReject = async (id: string) => {
    const reason = window.prompt("Rejection reason (optional)") || "";
    const token = await resolveVendorApiToken();
    if (!token) return;
    setBusyId(id);
    const res = await rejectSupplySubmission(token, id, reason);
    setBusyId(null);
    if (res.error) {
      toast.error(res.data?.detail || "Reject failed.");
      return;
    }
    toast.success("Submission rejected.");
    load();
  };

  return (
    <div className="space-y-6 p-1">
      <ToastContainer position="top-right" autoClose={3000} />
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Deal supply</h1>
        <p className="text-sm text-surface-500 mt-1 max-w-2xl">
          Invite external wholesalers to submit off-market deals. Approve to create an inactive Real
          Estate listing under your store, then activate with the listing fee.
        </p>
      </div>

      <div className="premium-card p-5 space-y-4">
        <h2 className="text-sm font-bold text-surface-900 dark:text-white">Create invite</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="input-premium flex-1"
            placeholder="Label (e.g. Spring wholesaler partners)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <button
            type="button"
            onClick={onCreateInvite}
            disabled={busyId === "create"}
            className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50"
          >
            {busyId === "create" ? "Creating…" : "Create invite link"}
          </button>
        </div>
      </div>

      <div className="premium-card p-5">
        <h2 className="text-sm font-bold text-surface-900 dark:text-white mb-3">Your invites</h2>
        {loading && invites.length === 0 ? (
          <p className="text-sm text-surface-500">Loading…</p>
        ) : invites.length === 0 ? (
          <p className="text-sm text-surface-500">No invites yet.</p>
        ) : (
          <ul className="space-y-3">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-surface-200 dark:border-dark-border rounded-lg p-3"
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm text-surface-900 dark:text-white">
                    {inv.label || "Invite"}
                  </div>
                  <div className="text-xs text-surface-500 truncate">{inv.share_url}</div>
                  <div className="text-xs text-surface-400 mt-1">
                    {inv.uses_count}/{inv.max_uses} uses ·{" "}
                    {inv.is_usable ? "Active" : "Closed"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyLink(inv.share_url)}
                  className="text-sm font-semibold text-primary-500 whitespace-nowrap"
                >
                  Copy link
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="premium-card p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-bold text-surface-900 dark:text-white">Submissions</h2>
          <select
            className="input-premium text-sm py-1"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
        {submissions.length === 0 ? (
          <p className="text-sm text-surface-500">No submissions in this filter.</p>
        ) : (
          <ul className="space-y-3">
            {submissions.map((sub) => (
              <li
                key={sub.id}
                className="border border-surface-200 dark:border-dark-border rounded-lg p-3 space-y-2"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <div className="font-semibold text-surface-900 dark:text-white">
                      {sub.title}
                    </div>
                    <div className="text-xs text-surface-500">
                      {sub.submitter_name} · {sub.submitter_email}
                    </div>
                    <div className="text-xs text-surface-500 mt-1">
                      {sub.city}, {sub.state} · Ask ${sub.asking_price} · ARV ${sub.arv}
                    </div>
                  </div>
                  <span className="text-xs font-bold uppercase text-surface-400">
                    {sub.status}
                  </span>
                </div>
                {sub.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === sub.id}
                      onClick={() => onApprove(sub.id)}
                      className="px-3 py-1.5 rounded-md bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === sub.id}
                      onClick={() => onReject(sub.id)}
                      className="px-3 py-1.5 rounded-md border border-red-300 text-red-600 text-xs font-semibold disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {sub.status === "approved" && sub.product_id && (
                  <div className="text-xs">
                    {sub.product_active ? (
                      <span className="text-emerald-600">Live on Deals Home</span>
                    ) : (
                      <Link
                        href={`/inventory/editProduct/${sub.product_id}`}
                        className="text-primary-500 font-semibold"
                      >
                        Open product → activate listing fee
                      </Link>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
