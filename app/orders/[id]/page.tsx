"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { getCookie } from "@/utils/cookies";
import { getSingleOrder } from "@/api/products";
import { changeStatus } from "@/api/orders";
import {
  FiArrowLeft,
  FiPackage,
  FiUser,
  FiMapPin,
  FiPhone,
  FiCalendar,
  FiDollarSign,
  FiExternalLink,
  FiTruck,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiHash,
  FiCreditCard,
} from "react-icons/fi";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string | null;
  product_image: string | null;
  quantity: number;
  total_price: string;
  order_status: string;
  tracking_code: string;
  tracking_url: string;
}

interface OrderDetails {
  id: string;
  order_id: string;
  order_number: string | null;
  order_date: string;
  order_total: string;
  quantity: number;
  total_price: string;
  order_status: string;
  customer: string;
  customer_name: string;
  phone: string;
  delivery_address: string;
  paid_with_other: boolean;
  paid_with_escrow: boolean;
  paid_with_wallet: boolean;
  order_items: OrderItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STOREFRONT_URL =
  process.env.NEXT_PUBLIC_ENV === "production"
    ? "https://pinksurfing.com"
    : "http://localhost:5173";

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; icon: React.ElementType }
> = {
  PENDING: { label: "Pending", bg: "bg-warning/10", text: "text-warning", icon: FiClock },
  RECEIVED: { label: "Received", bg: "bg-info/10", text: "text-info", icon: FiCheckCircle },
  PACKED: { label: "Packed", bg: "bg-accent-purple/10", text: "text-accent-purple", icon: FiPackage },
  SHIPPED: { label: "Shipped", bg: "bg-accent-blue/10", text: "text-accent-blue", icon: FiTruck },
  DELIVERED: { label: "Delivered", bg: "bg-success/10", text: "text-success", icon: FiCheckCircle },
  CANCELED: { label: "Canceled", bg: "bg-danger/10", text: "text-danger", icon: FiAlertCircle },
  "RETURN-REQUESTED": { label: "Return Requested", bg: "bg-warning/10", text: "text-warning", icon: FiAlertCircle },
  RETURNED: { label: "Returned", bg: "bg-surface-200", text: "text-surface-500", icon: FiPackage },
  ERROR: { label: "Error", bg: "bg-danger/10", text: "text-danger", icon: FiAlertCircle },
};

const getStatus = (s: string) => STATUS_CONFIG[s] || STATUS_CONFIG.PENDING;

const NEXT_STATUSES: Record<string, string[]> = {
  RECEIVED: ["PACKED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const token = getCookie("access_token");
    if (!token) {
      router.push("/auth/signin");
      return;
    }

    getSingleOrder(token, orderId)
      .then((res: any) => {
        if (!res.error && res.data?.["Order Details"]) {
          setOrder(res.data["Order Details"]);
        } else {
          toast.error("Failed to load order details.");
        }
      })
      .finally(() => setLoading(false));
  }, [orderId, router]);

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    const token = getCookie("access_token");
    if (!token) return;

    setUpdatingStatus(itemId);
    try {
      const res = await changeStatus(token, itemId, newStatus);
      if (res?.data) {
        toast.success(`Status updated to ${newStatus}`);
        // Refresh
        const updated = await getSingleOrder(token, orderId);
        if (updated?.data?.["Order Details"]) {
          setOrder(updated.data["Order Details"]);
        }
      } else {
        toast.error("Failed to update status.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-xl bg-surface-200 dark:bg-dark-surface animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="premium-card p-6 space-y-3">
              <div className="h-4 w-24 rounded bg-surface-200 dark:bg-dark-surface animate-pulse" />
              <div className="h-6 w-full rounded bg-surface-200 dark:bg-dark-surface animate-pulse" />
              <div className="h-6 w-3/4 rounded bg-surface-200 dark:bg-dark-surface animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <FiAlertCircle className="w-16 h-16 text-danger" />
        <h2 className="text-xl font-semibold text-surface-900 dark:text-white">
          Order not found
        </h2>
        <Link
          href="/orders"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-pink text-white font-semibold"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
      </div>
    );
  }

  const paymentMethod = order.paid_with_other
    ? "PayPal / Card"
    : order.paid_with_escrow
    ? "Escrow"
    : order.paid_with_wallet
    ? "Crypto Wallet"
    : "Pending";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-10"
    >
      {/* ---- Back + Header ---- */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-100 dark:bg-dark-surface text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-dark-hover transition-colors font-medium text-sm"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">
            Order Details
          </h1>
          {order.order_number && (
            <p className="text-sm text-surface-500 dark:text-surface-400 flex items-center gap-1 mt-0.5">
              <FiHash className="w-3.5 h-3.5" />
              {order.order_number}
            </p>
          )}
        </div>
      </div>

      {/* ---- Summary Cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date */}
        <div className="premium-card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
            <FiCalendar className="w-4 h-4 text-primary-500" />
          </div>
          <div>
            <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">Order Date</p>
            <p className="text-sm font-semibold text-surface-900 dark:text-white mt-0.5">
              {order.order_date}
            </p>
          </div>
        </div>

        {/* Total */}
        <div className="premium-card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
            <FiDollarSign className="w-4 h-4 text-success" />
          </div>
          <div>
            <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">Order Total</p>
            <p className="text-sm font-bold text-surface-900 dark:text-white mt-0.5">
              ${parseFloat(order.order_total || order.total_price).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Customer */}
        <div className="premium-card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-purple/10 flex items-center justify-center flex-shrink-0">
            <FiUser className="w-4 h-4 text-accent-purple" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">Customer</p>
            <p className="text-sm font-semibold text-surface-900 dark:text-white mt-0.5 truncate">
              {order.customer_name || order.customer}
            </p>
            <p className="text-xs text-surface-400 dark:text-surface-500 truncate">
              {order.customer}
            </p>
          </div>
        </div>

        {/* Payment */}
        <div className="premium-card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
            <FiCreditCard className="w-4 h-4 text-accent-blue" />
          </div>
          <div>
            <p className="text-xs text-surface-500 dark:text-surface-400 font-medium">Payment</p>
            <p className="text-sm font-semibold text-surface-900 dark:text-white mt-0.5">
              {paymentMethod}
            </p>
          </div>
        </div>
      </div>

      {/* ---- Main content: products + sidebar ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ---- Products list (2/3 width) ---- */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <FiPackage className="w-4 h-4 text-primary-500" />
            Products in this Order
            <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-primary-500/10 text-primary-500">
              {(order.order_items ?? []).length}
            </span>
          </h2>

          {(order.order_items ?? []).length === 0 ? (
            <div className="premium-card p-8 text-center text-surface-400 dark:text-surface-500">
              No items found for this order.
            </div>
          ) : (
            (order.order_items ?? []).map((item) => {
              const statusCfg = getStatus(item.order_status);
              const StatusIcon = statusCfg.icon;
              const nextStatuses = NEXT_STATUSES[item.order_status] ?? [];
              const productHref = item.product_slug
                ? `${STOREFRONT_URL}/product/productDetail/${item.product_slug}`
                : null;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="premium-card p-5 flex flex-col sm:flex-row gap-4"
                >
                  {/* Product Image */}
                  <div className="w-full sm:w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-surface-100 dark:bg-dark-surface">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiPackage className="w-8 h-8 text-surface-300 dark:text-surface-600" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        {productHref ? (
                          <a
                            href={productHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-base font-semibold text-surface-900 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition-colors group"
                          >
                            <span className="truncate max-w-[280px]">{item.product_name}</span>
                            <FiExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ) : (
                          <p className="text-base font-semibold text-surface-900 dark:text-white truncate">
                            {item.product_name}
                          </p>
                        )}
                        <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                          Item ID: {item.id.slice(0, 12)}…
                        </p>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusCfg.bg} ${statusCfg.text}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Price & Qty */}
                    <div className="flex items-center gap-6 mt-3">
                      <div>
                        <p className="text-xs text-surface-400 dark:text-surface-500">Qty</p>
                        <p className="text-sm font-bold text-surface-900 dark:text-white">
                          {item.quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-surface-400 dark:text-surface-500">Total</p>
                        <p className="text-sm font-bold text-success">
                          ${parseFloat(item.total_price).toFixed(2)}
                        </p>
                      </div>
                      {item.tracking_code && (
                        <div>
                          <p className="text-xs text-surface-400 dark:text-surface-500">Tracking</p>
                          {item.tracking_url ? (
                            <a
                              href={item.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-mono text-primary-500 hover:underline"
                            >
                              {item.tracking_code}
                            </a>
                          ) : (
                            <p className="text-xs font-mono text-surface-600 dark:text-surface-300">
                              {item.tracking_code}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Status action buttons */}
                    {nextStatuses.length > 0 && (
                      <div className="flex items-center gap-2 mt-4">
                        <span className="text-xs text-surface-500 dark:text-surface-400">
                          Move to:
                        </span>
                        {nextStatuses.map((ns) => {
                          const nsCfg = getStatus(ns);
                          const NsIcon = nsCfg.icon;
                          return (
                            <button
                              key={ns}
                              disabled={updatingStatus === item.id}
                              onClick={() => handleStatusChange(item.id, ns)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${nsCfg.bg} ${nsCfg.text} border-current/20 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {updatingStatus === item.id ? (
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                              ) : (
                                <NsIcon className="w-3.5 h-3.5" />
                              )}
                              {nsCfg.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* ---- Sidebar: Customer & Delivery ---- */}
        <div className="space-y-4">
          {/* Customer Info */}
          <div className="premium-card p-5">
            <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
              <FiUser className="w-4 h-4 text-primary-500" />
              Customer
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-surface-400 dark:text-surface-500 mb-0.5">Name</p>
                <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                  {order.customer_name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-surface-400 dark:text-surface-500 mb-0.5">Email</p>
                <p className="text-sm text-surface-700 dark:text-surface-300 break-all">
                  {order.customer}
                </p>
              </div>
              {order.phone && (
                <div className="flex items-center gap-2">
                  <FiPhone className="w-3.5 h-3.5 text-surface-400" />
                  <p className="text-sm text-surface-700 dark:text-surface-300">
                    {order.phone}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          {order.delivery_address && (
            <div className="premium-card p-5">
              <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-primary-500" />
                Delivery Address
              </h3>
              <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-line">
                {order.delivery_address}
              </p>
            </div>
          )}

          {/* Order Summary */}
          <div className="premium-card p-5">
            <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
              <FiDollarSign className="w-4 h-4 text-success" />
              Order Summary
            </h3>
            <div className="space-y-2">
              {(order.order_items ?? []).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-surface-600 dark:text-surface-400 truncate max-w-[140px]">
                    {item.product_name} ×{item.quantity}
                  </span>
                  <span className="font-semibold text-surface-800 dark:text-surface-100 flex-shrink-0">
                    ${parseFloat(item.total_price).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-surface-200 dark:border-dark-border pt-2 flex items-center justify-between text-sm">
                <span className="font-bold text-surface-900 dark:text-white">Total</span>
                <span className="font-bold text-success">
                  ${parseFloat(order.order_total || order.total_price).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
