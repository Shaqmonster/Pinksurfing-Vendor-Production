"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  getPropertyVisitList,
  vendorAcceptVisit,
  vendorRejectVisit,
  vendorRescheduleVisit,
} from "@/api/propertyVisits";

type VisitRow = {
  id: string;
  status: string;
  scheduled_at: string;
  pending_reschedule_at: string | null;
  buyer_email: string;
  buyer_phone: string;
  buyer_first_name: string;
  buyer_last_name: string;
  product_name: string;
  visit_kind: string;
  amount: string;
  currency: string;
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending_vendor: "Action needed",
    vendor_reschedule_pending: "Awaiting buyer",
    buyer_reschedule_pending: "You: accept or decline new time",
    accepted: "Confirmed",
    rejected: "Declined / refunded",
    disputed: "Disputed",
    dispute_refunded: "Closed (refunded)",
  };
  return map[s] || s;
}

export default function VisitRequestsPage() {
  const [rows, setRows] = useState<VisitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rescheduleDraft, setRescheduleDraft] = useState<Record<string, string>>(
    {}
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { error: err, data } = await getPropertyVisitList();
    if (err) setError("Could not load visit requests.");
    else setRows((data as VisitRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onAccept(v: VisitRow) {
    setBusyId(v.id);
    try {
      await vendorAcceptVisit(v.id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Accept failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onReject(v: VisitRow) {
    if (!confirm("Reject this visit? The buyer will be refunded.")) return;
    setBusyId(v.id);
    try {
      await vendorRejectVisit(v.id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onSubmitReschedule(v: VisitRow) {
    const iso = rescheduleDraft[v.id];
    if (!iso) {
      setError("Pick a new date and time first.");
      return;
    }
    setBusyId(v.id);
    try {
      await vendorRescheduleVisit(v.id, new Date(iso).toISOString());
      setRescheduleDraft((d) => ({ ...d, [v.id]: "" }));
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Reschedule failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-5xl px-4 py-8"
    >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
            Visit requests
          </h1>
          <p className="mt-2 text-surface-600 dark:text-surface-400">
            Paid scheduling from buyers on your real-estate and business listings.
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
          <p className="text-surface-500">No visit requests yet.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {rows.map((v) => (
              <div
                key={v.id}
                className="relative overflow-hidden rounded-2xl border border-light-border bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card"
              >
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-gradient-pink opacity-10 blur-2xl" />
                <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">
                      {statusLabel(v.status)}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-surface-900 dark:text-white">
                      {v.product_name}
                    </h2>
                    <p className="mt-2 text-sm text-surface-600 dark:text-surface-400">
                      <span className="font-medium text-surface-800 dark:text-surface-200">
                        When:
                      </span>{" "}
                      {formatWhen(v.scheduled_at)}
                    </p>
                    {v.pending_reschedule_at && (
                      <p className="mt-1 text-sm text-accent-violet dark:text-primary-300">
                        <span className="font-medium">Proposed change:</span>{" "}
                        {formatWhen(v.pending_reschedule_at)}
                      </p>
                    )}
                    <div className="mt-4 grid gap-1 text-sm text-surface-600 dark:text-surface-400">
                      <p>
                        <span className="font-medium text-surface-800 dark:text-surface-200">
                          Visitor:
                        </span>{" "}
                        {v.buyer_first_name} {v.buyer_last_name}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span> {v.buyer_email}
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span> {v.buyer_phone}
                      </p>
                      <p className="text-xs text-surface-500">
                        Fee paid: {v.amount} {v.currency} · Request {v.id.slice(0, 8)}…
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-[220px] flex-col gap-2">
                    {v.status === "pending_vendor" && (
                      <>
                        <button
                          type="button"
                          disabled={busyId === v.id}
                          onClick={() => onAccept(v)}
                          className="rounded-xl bg-gradient-pink px-4 py-2.5 text-sm font-semibold text-white shadow-glow-pink disabled:opacity-50"
                        >
                          Accept visit
                        </button>
                        <button
                          type="button"
                          disabled={busyId === v.id}
                          onClick={() => onReject(v)}
                          className="rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-semibold text-surface-700 hover:bg-surface-50 dark:border-dark-border dark:text-surface-200 dark:hover:bg-dark-hover"
                        >
                          Reject &amp; refund
                        </button>
                        <label className="mt-2 text-xs font-medium text-surface-500">
                          Propose different time
                        </label>
                        <input
                          type="datetime-local"
                          step={1800}
                          className="rounded-lg border border-light-border bg-white px-3 py-2 text-sm dark:border-dark-border dark:bg-dark-hover"
                          value={rescheduleDraft[v.id] || ""}
                          onChange={(e) =>
                            setRescheduleDraft((d) => ({
                              ...d,
                              [v.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          disabled={busyId === v.id}
                          onClick={() => onSubmitReschedule(v)}
                          className="rounded-xl border border-primary-500/40 px-4 py-2 text-sm font-semibold text-primary-600 dark:text-primary-300"
                        >
                          Send proposal
                        </button>
                      </>
                    )}
                    {v.status === "buyer_reschedule_pending" && (
                      <>
                        <button
                          type="button"
                          disabled={busyId === v.id}
                          onClick={() => onAccept(v)}
                          className="rounded-xl bg-gradient-pink px-4 py-2.5 text-sm font-semibold text-white"
                        >
                          Accept new time
                        </button>
                        <button
                          type="button"
                          disabled={busyId === v.id}
                          onClick={() => onReject(v)}
                          className="rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-semibold dark:border-dark-border"
                        >
                          Reject &amp; refund
                        </button>
                      </>
                    )}
                    {(v.status === "vendor_reschedule_pending" ||
                      v.status === "accepted") && (
                      <p className="text-xs text-surface-500">
                        {v.status === "vendor_reschedule_pending"
                          ? "Waiting for the buyer to respond to your proposed time."
                          : "Visit confirmed. The buyer may request another time."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </motion.div>
  );
}
