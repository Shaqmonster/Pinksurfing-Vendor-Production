"use client";

import React, { useCallback, useEffect, useState } from "react";
import { FiKey } from "react-icons/fi";
import {
  listDealUnlocks,
  sellerTransitionDealRoom,
  type DealUnlockRow,
} from "@/lib/api/offMarketDeals";
import EmptyState from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/common/Loader";

const STATE_LABEL: Record<string, string> = {
  unlocked: "Unlocked, not in room yet",
  in_deal_room: "In deal room",
  under_contract: "Under contract",
  in_escrow: "In escrow",
  closed: "Closed",
  cancelled: "Cancelled",
};

// The seller's next forward step for each room state (the API enforces this too).
const SELLER_NEXT: Record<string, { state: string; label: string }> = {
  in_deal_room: { state: "under_contract", label: "Mark under contract" },
  under_contract: { state: "in_escrow", label: "Open escrow" },
  in_escrow: { state: "closed", label: "Mark closed" },
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

export default function DealUnlocksList() {
  const [rows, setRows] = useState<DealUnlockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { error: err, data } = await listDealUnlocks();
    if (err) setError("Could not load deal unlocks.");
    else setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function move(row: DealUnlockRow, newState: string) {
    if (!row.deal_room_id) return;
    if (newState === "cancelled" && !confirm("Cancel this deal with the buyer? This can't be undone.")) {
      return;
    }
    setBusyId(row.unlock_id);
    const { error: err, state } = await sellerTransitionDealRoom(row.deal_room_id, newState);
    setBusyId(null);
    if (err) {
      setError(err);
      return;
    }
    setRows((r) => r.map((x) => (x.unlock_id === row.unlock_id ? { ...x, deal_room_state: state } : x)));
  }


  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </div>
      )}
      {rows.length === 0 ? (
        <div className="premium-card">
          <EmptyState
            icon={FiKey}
            title="No deal unlocks yet"
            description="When a buyer pays to unlock one of your off-market deals, they appear here with a chat to talk to them."
          />
        </div>
      ) : (
        rows.map((row) => {
          const state = row.deal_room_state || "unlocked";
          const next = SELLER_NEXT[state];
          const open = state !== "closed" && state !== "cancelled";
          return (
            <div
              key={row.unlock_id}
              className="rounded-2xl border border-light-border bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-card"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <span className="inline-block rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                    {STATE_LABEL[state] || state}
                  </span>
                  <h2 className="mt-1 truncate text-lg font-semibold text-surface-900 dark:text-white">
                    {row.listing_title}
                  </h2>
                  <div className="mt-2 grid gap-1 text-sm text-surface-600 dark:text-surface-400">
                    <p>
                      <span className="font-medium text-surface-800 dark:text-surface-200">Buyer: </span>
                      {row.buyer_name}
                    </p>
                    <p>
                      <span className="font-medium">Email: </span>
                      {row.buyer_email}
                    </p>
                    {row.buyer_company && (
                      <p>
                        <span className="font-medium">Company: </span>
                        {row.buyer_company}
                      </p>
                    )}
                    <p className="text-xs text-surface-500">Unlocked {fmtDate(row.paid_at)}</p>
                  </div>
                </div>
                <div className="flex min-w-[220px] flex-col gap-2">
                  {row.conversation_id && (
                    <a
                      href={`/messages?c=${row.conversation_id}`}
                      className="rounded-xl bg-gradient-pink px-4 py-2.5 text-center text-sm font-semibold text-white shadow-glow-pink"
                    >
                      Open conversation
                    </a>
                  )}
                  {!row.conversation_id && (
                    <p className="text-xs text-surface-500">No conversation yet. It starts when the buyer messages you.</p>
                  )}
                  {next && row.deal_room_id && (
                    <button
                      type="button"
                      disabled={busyId === row.unlock_id}
                      onClick={() => move(row, next.state)}
                      className="rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-semibold text-surface-700 hover:bg-surface-50 disabled:opacity-50 dark:border-dark-border dark:text-surface-200 dark:hover:bg-dark-hover"
                    >
                      {next.label}
                    </button>
                  )}
                  {open && row.deal_room_id && (
                    <button
                      type="button"
                      disabled={busyId === row.unlock_id}
                      onClick={() => move(row, "cancelled")}
                      className="rounded-xl px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
                    >
                      Cancel deal
                    </button>
                  )}
                  {state === "unlocked" && (
                    <p className="text-xs text-surface-500">
                      Waiting for the buyer to enter the deal room. You can message them now.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
