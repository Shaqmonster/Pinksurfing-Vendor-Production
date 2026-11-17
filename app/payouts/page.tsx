"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FiDollarSign } from "react-icons/fi";
import { getPayouts, type PayoutStatus, type PayoutsPage } from "@/api/payouts";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { CardSkeleton } from "@/components/common/Loader";
import { money } from "@/utils/money";

const STATUS: Record<PayoutStatus, { label: string; help: string; cls: string }> = {
  PENDING: {
    label: "Pending",
    help: "Sold, still in the 14-day hold after delivery.",
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  CLEARED: {
    label: "Cleared",
    help: "Past the hold and ready to be paid out.",
    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  PAID_OUT: {
    label: "Paid out",
    help: "Sent to your payout account.",
    cls: "bg-surface-100 text-surface-700 dark:bg-dark-border dark:text-surface-300",
  },
};

const FILTERS: { key: "" | PayoutStatus; label: string }[] = [
  { key: "", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "CLEARED", label: "Cleared" },
  { key: "PAID_OUT", label: "Paid out" },
];

/** Read-only earnings (retest N2.8). Moving money is unchanged; this shows what's recorded. */
export default function PayoutsPage() {
  const [data, setData] = useState<PayoutsPage | null>(null);
  const [status, setStatus] = useState<"" | PayoutStatus>("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getPayouts({ status: status || undefined, page }));
    } catch {
      setError("Could not load your earnings.");
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const pages = data ? Math.max(1, Math.ceil(data.count / data.page_size)) : 1;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Payouts"
        description="What you've earned from each sale and where it is. Payouts go to the account you connected in Store Settings."
      />

      {error && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {error}{" "}
          <button type="button" onClick={load} className="font-semibold underline">
            Try again
          </button>
        </div>
      )}

      {data && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {(Object.keys(STATUS) as PayoutStatus[]).map((key) => (
            <div key={key} className="rounded-2xl border border-light-border bg-white p-4 dark:border-dark-border dark:bg-dark-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">{STATUS[key].label}</p>
              <p className="mt-1 text-2xl font-bold text-surface-900 dark:text-white">
                ${money(data.totals[key]?.amount ?? 0)}
              </p>
              <p className="mt-1 text-xs text-surface-500">
                {data.totals[key]?.count ?? 0} item{(data.totals[key]?.count ?? 0) === 1 ? "" : "s"} · {STATUS[key].help}
              </p>
            </div>
          ))}
        </div>
      )}

      <div role="tablist" aria-label="Filter by status" className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key || "all"}
            type="button"
            role="tab"
            aria-selected={status === f.key}
            onClick={() => {
              setStatus(f.key);
              setPage(1);
            }}
            className={`min-h-[40px] rounded-lg px-3.5 text-sm font-medium ${
              status === f.key
                ? "bg-gradient-pink text-white"
                : "border border-surface-200 text-surface-600 dark:border-dark-border dark:text-surface-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <CardSkeleton />
      ) : !data || data.results.length === 0 ? (
        <div className="premium-card">
          <EmptyState
            icon={FiDollarSign}
            title={status ? "Nothing here" : "No earnings yet"}
            description="Each item you sell shows up here with its amount and status."
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-light-border bg-white dark:border-dark-border dark:bg-dark-card">
          <ul className="divide-y divide-surface-100 dark:divide-dark-border">
            {data.results.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-surface-900 dark:text-white">
                    {row.product_name || "Item"} {row.quantity > 1 ? `× ${row.quantity}` : ""}
                  </p>
                  <p className="text-xs text-surface-500">
                    {row.order_number ? `Order #${row.order_number} · ` : ""}
                    {new Date(row.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS[row.status]?.cls || ""}`}>
                    {STATUS[row.status]?.label || row.status}
                  </span>
                  <span className="text-sm font-bold text-surface-900 dark:text-white">${money(row.amount)}</span>
                </div>
              </li>
            ))}
          </ul>
          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-light-border px-4 py-3 text-sm dark:border-dark-border">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">
                Previous
              </button>
              <span className="text-surface-500">
                Page {page} of {pages}
              </span>
              <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-40">
                Next
              </button>
            </div>
          )}
        </div>
      )}

      <p className="mt-6 text-xs text-surface-500">
        Payout account and Square connection are in{" "}
        <Link href="/settings" className="font-semibold text-primary-500 underline">
          Store Settings
        </Link>
        .
      </p>
    </div>
  );
}
