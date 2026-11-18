"use client";

import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { FiCheckCircle, FiCircle, FiArrowRight } from "react-icons/fi";
import { getAllOrders, getProducts, getVendorProfile } from "@/lib/api/products";
import { getSquareStatus } from "@/lib/api/square";
import { resolveVendorApiToken } from "@/utils/vendorAuth";
import { MyContext } from "@/app/providers/context";

type Overview = {
  live: number;
  drafts: number;
  orders: number | null;
  profileComplete: boolean;
  squareConnected: boolean | null;
};

/**
 * Headline totals and a "getting started" checklist for the vendor dashboard (UAT note:
 * the dashboard had neither). Every source is optional: a failed call leaves that figure
 * out instead of breaking the dashboard.
 */
export default function VendorOverview({
  onLoaded,
}: {
  /** Called once the figures are known, so the page can tell "no listings yet" from "still loading". */
  onLoaded?: (counts: { live: number; drafts: number }) => void;
}) {
  const [data, setData] = useState<Overview | null>(null);
  // The session may still be settling on the first visit; load again once it is ready.
  const { loggedIn, authReady } = useContext(MyContext);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // A first load can race the sign-in bootstrap and get no token: retry a few times instead of
      // silently showing no cards until the next reload.
      let token = await resolveVendorApiToken();
      for (let i = 0; !token && i < 3 && !cancelled; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        token = await resolveVendorApiToken();
      }
      if (!token || cancelled) return;

      const profileRes = await getVendorProfile(token).catch(() => ({ error: true, data: null }));
      const profile: any = profileRes?.data || {};

      const [productsRes, ordersRes, square] = await Promise.all([
        // The backend returns the signed-in vendor's full inventory regardless of slug.
        getProducts(token, profile.slug || "inventory").catch(() => null),
        getAllOrders(token).catch(() => null),
        getSquareStatus(token).catch(() => null),
      ]);

      const products: any[] = (productsRes as any)?.data?.Products || [];
      const orderList: any[] | null = Array.isArray((ordersRes as any)?.data?.["Order Request"])
        ? (ordersRes as any).data["Order Request"]
        : null;

      if (cancelled) return;
      onLoaded?.({
        live: products.filter((p) => p.is_active && !p.is_off_market).length,
        drafts: products.filter((p) => !p.is_active).length,
      });
      setData({
        live: products.filter((p) => p.is_active && !p.is_off_market).length,
        drafts: products.filter((p) => !p.is_active).length,
        // Same rule as OrderTable: PENDING orders are unpaid checkouts, not real orders.
        orders: orderList ? orderList.filter((o) => o.order_status !== "PENDING").length : null,
        profileComplete: Boolean(
          profile.store_name && profile.phone_number && (profile.city || profile.street1)
        ),
        squareConnected: square ? Boolean(square.connected) : null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [loggedIn, authReady]);

  if (!data) {
    // Placeholder cards while loading, so the dashboard never looks empty.
    return (
      <div aria-hidden className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-100 dark:bg-dark-surface" />
        ))}
      </div>
    );
  }

  const steps = [
    { done: data.profileComplete, label: "Complete your store profile", href: "/settings" },
    {
      done: data.squareConnected === true,
      label: "Connect Square to get paid",
      href: "/settings",
      hidden: data.squareConnected === null,
    },
    { done: data.live + data.drafts > 0, label: "Add your first listing", href: "/inventory/add_products" },
    { done: data.live > 0, label: "Publish a listing", href: "/inventory/products" },
  ].filter((s) => !s.hidden);
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  const tiles = [
    { label: "Live listings", value: data.live, href: "/inventory/products" },
    { label: "Drafts awaiting payment", value: data.drafts, href: "/inventory/products" },
    ...(data.orders !== null ? [{ label: "Orders", value: data.orders, href: "/orders" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="premium-card p-5 hover:border-primary-500/40 transition-colors"
          >
            <p className="text-3xl font-bold text-surface-900 dark:text-white">{t.value}</p>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">{t.label}</p>
          </Link>
        ))}
      </div>

      {!allDone && (
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-surface-900 dark:text-white">Getting started</h2>
            <span className="text-sm text-surface-500 dark:text-surface-400">
              {doneCount} of {steps.length} done
            </span>
          </div>
          <ul className="space-y-2">
            {steps.map((s) => (
              <li key={s.label}>
                <Link
                  href={s.href}
                  className="flex items-center gap-3 min-h-[44px] px-3 rounded-xl hover:bg-surface-50 dark:hover:bg-dark-hover transition-colors"
                >
                  {s.done ? (
                    <FiCheckCircle className="w-5 h-5 text-success shrink-0" aria-label="Done" />
                  ) : (
                    <FiCircle className="w-5 h-5 text-surface-400 shrink-0" aria-label="Not done" />
                  )}
                  <span
                    className={`flex-1 text-sm ${
                      s.done ? "text-surface-400 line-through" : "text-surface-900 dark:text-white"
                    }`}
                  >
                    {s.label}
                  </span>
                  {!s.done && <FiArrowRight className="w-4 h-4 text-surface-400" />}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
