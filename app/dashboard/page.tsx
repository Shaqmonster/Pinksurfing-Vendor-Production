"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  FiShoppingBag,
  FiDollarSign,
  FiPackage,
  FiUsers,
  FiArrowRight,
} from "react-icons/fi";
import { checkProductLiveStatus, getTopSellingProducts } from "@/api/products";
import OrderTable from "@/components/Tables/OrderTable";
import EmptyState from "@/components/ui/EmptyState";
import { getAccessToken } from "@/utils/cookies";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { removePendingListing, updatePendingListingState } from "@/utils/pendingListings";
import { PS_MOTION, staggerDelay } from "@/lib/motion-tokens";

const Dashboard: React.FC = () => {
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [listingNotice, setListingNotice] = useState<string>("");
  const [listingNoticeType, setListingNoticeType] = useState<"info" | "success" | "warning">("info");
  const listingHandledRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduced = useReducedMotion();

  useMemo(() => {
    if (typeof window !== "undefined") {
      const token = getAccessToken();
      if (!token) return;
      (async () => {
        const res = await getTopSellingProducts(token);
        setTopProducts(res.data || []);
      })();
    }
  }, []);

  useEffect(() => {
    const listingPaid = searchParams.get("listing_paid");
    const productId = searchParams.get("product_id");

    if (listingHandledRef.current || listingPaid !== "pending" || !productId) {
      return;
    }

    listingHandledRef.current = true;
    setListingNotice("Payment submitted, waiting for confirmation.");
    setListingNoticeType("info");
    updatePendingListingState(productId, "AWAITING_WEBHOOK");

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 30;

    const pollUntilLive = async () => {
      if (cancelled) return;

      attempts += 1;
      const result = await checkProductLiveStatus(productId);

      if (cancelled) return;

      if (result.live) {
        removePendingListing(productId);
        setListingNotice("Published.");
        setListingNoticeType("success");
        router.replace(`/inventory/products?listing_live=true&product_id=${productId}`);
        return;
      }

      if (attempts >= maxAttempts) {
        setListingNotice("Still pending confirmation, refresh later.");
        setListingNoticeType("warning");
        return;
      }

      window.setTimeout(pollUntilLive, 5000);
    };

    void pollUntilLive();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: reduced ? 0 : PS_MOTION.stagger.step,
      },
    },
  };

  const itemVariants = {
    hidden: reduced ? { opacity: 1 } : { opacity: 0, y: PS_MOTION.distance.medium },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: PS_MOTION.duration.normal,
        ease: PS_MOTION.easing.enter,
      },
    },
  };

  const quickActions = [
    { icon: FiPackage, label: "Add Listing", href: "/inventory/add_products" },
    { icon: FiShoppingBag, label: "View Orders", href: "/orders" },
    { icon: FiUsers, label: "Edit Profile", href: "/profile" },
    { icon: FiDollarSign, label: "Payouts & Settings", href: "/settings" },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {listingNotice && (
        <motion.div
          variants={itemVariants}
          className={`premium-card p-4 border ${
            listingNoticeType === "success"
              ? "border-success/30 bg-success/10"
              : listingNoticeType === "warning"
                ? "border-warning/30 bg-warning/10"
                : "border-primary-500/20 bg-primary-500/10"
          }`}
        >
          <p className="text-sm font-medium text-surface-900 dark:text-white">
            {listingNotice}
          </p>
        </motion.div>
      )}

      {!topProducts?.length && (
        <motion.div variants={itemVariants} className="premium-card">
          <EmptyState
            icon={FiPackage}
            title="Get your store ready"
            description="Add a listing to start selling. Connect Square under Store Settings when you are ready to take payments."
            actionLabel="Add listing"
            actionHref="/inventory/add_products"
          />
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <div className="premium-card h-full">
            <div className="p-6 border-b border-light-border dark:border-dark-border">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">
                Top products
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Best performing items
              </p>
            </div>
            <div className="p-6 space-y-4">
              {topProducts && topProducts.length > 0 ? (
                topProducts.slice(0, 5).map((product: any, index: number) => (
                  <motion.div
                    key={product.id || index}
                    initial={reduced ? false : { opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: staggerDelay(index, !!reduced) }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-dark-hover transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-primary-500/15 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-400">
                          {index + 1}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-surface-900 dark:text-white line-clamp-1">
                          {product.name}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          {product.category?.name || "Product"}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-success shrink-0 ml-2">
                      ${product.unit_price}
                    </p>
                  </motion.div>
                ))
              ) : (
                <EmptyState
                  icon={FiPackage}
                  title="No products yet"
                  description="Add your first listing to see top performers here."
                  actionLabel="Add listing"
                  actionHref="/inventory/add_products"
                  className="py-6"
                />
              )}
            </div>
            {topProducts && topProducts.length > 0 && (
              <div className="p-6 pt-0">
                <Link
                  href="/inventory/products"
                  className="flex items-center justify-center gap-2 w-full min-h-[44px] py-3 rounded-xl border border-surface-200 dark:border-dark-border text-surface-500 dark:text-surface-400 hover:border-primary-500 hover:text-primary-400 transition-colors"
                >
                  View all products
                  <FiArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="premium-card overflow-hidden">
            <OrderTable recentOrders={true} />
          </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <div className="premium-card p-6">
          <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-4">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-3 p-4 min-h-[44px] rounded-xl border border-surface-200 dark:border-dark-border hover:border-primary-500/50 hover:bg-primary-500/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-dark-surface flex items-center justify-center group-hover:bg-primary-500 transition-colors">
                  <action.icon className="w-6 h-6 text-surface-600 dark:text-surface-400 group-hover:text-white" />
                </div>
                <span className="text-sm font-medium text-surface-600 dark:text-surface-400 group-hover:text-primary-400 text-center">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
