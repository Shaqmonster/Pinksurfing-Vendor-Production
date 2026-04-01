"use client";
import React, { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { getSingleOrder, changeOrderStatus } from "@/api/products";
import { toast } from "react-toastify";
import {
  buyShipmentLabel,
  getParcelDetails,
  getShipmentDetails,
  disputeReturn,
} from "@/api/orders";
import { getCookie } from "@/utils/cookies";
import {
  FiPackage,
  FiTruck,
  FiDownload,
  FiUser,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiHash,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
} from "react-icons/fi";

// ─── Status badge helper ─────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:           { label: "Pending",         bg: "bg-warning-light dark:bg-warning/20",         text: "text-warning-dark dark:text-warning" },
  RECEIVED:          { label: "Received",         bg: "bg-accent-blue/10 dark:bg-accent-blue/20",    text: "text-accent-blue" },
  PACKED:            { label: "Packed",           bg: "bg-accent-purple/10 dark:bg-accent-purple/20",text: "text-accent-purple" },
  SHIPPED:           { label: "Shipped",          bg: "bg-accent-cyan/10 dark:bg-accent-cyan/20",    text: "text-accent-cyan" },
  DELIVERED:         { label: "Delivered",        bg: "bg-success-light dark:bg-success/20",         text: "text-success-dark dark:text-success" },
  CANCELED:          { label: "Canceled",         bg: "bg-danger-light dark:bg-danger/20",           text: "text-danger" },
  "RETURN-REQUESTED":{ label: "Return Requested", bg: "bg-warning-light dark:bg-warning/20",         text: "text-warning-dark dark:text-warning" },
  "RETURN-DELIVERED":{ label: "Return Delivered", bg: "bg-accent-amber/10 dark:bg-accent-amber/20",  text: "text-accent-amber" },
  "RETURN-DISPUTED": { label: "Disputed",         bg: "bg-danger-light dark:bg-danger/20",           text: "text-danger" },
  RETURNED:          { label: "Returned",         bg: "bg-surface-100 dark:bg-surface-700",          text: "text-surface-600 dark:text-surface-400" },
  ERROR:             { label: "Error",            bg: "bg-danger-light dark:bg-danger/20",           text: "text-danger" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

// ─── Field display component ─────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">{label}</span>
      <span className="text-sm text-surface-900 dark:text-white font-medium break-all">{value}</span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
const Page = ({ params }: { params: { id: string } }) => {
  const [token] = useState<string | null>(
    typeof window !== "undefined" ? getCookie("access_token") : null
  );
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  // Dimensions for packing
  const [dimensions, setDimensions] = useState({ length: "", width: "", height: "", weight: "" });

  // Action button states
  const [showShipmentButton, setShowShipmentButton] = useState(false);
  const [showDownloadLabel, setShowDownloadLabel] = useState(false);
  const [parcelId, setParcelId] = useState<string | null>(null);
  const [isPacking, setIsPacking] = useState(false);
  const [isShipping, setIsShipping] = useState(false);
  const [isDownloadingLabel, setIsDownloadingLabel] = useState(false);
  const [isDisputeFiling, setIsDisputeFiling] = useState(false);

  // ── Data fetching ───────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await getSingleOrder(token, params.id);
        if (!error) {
          const details = data["Order Details"];
          setOrderData(details);
          setOrderStatus(details?.order_status ?? null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [token, params.id]);

  useEffect(() => {
    if (orderData?.order_status === "PACKED") {
      getParcelId();
      setShowShipmentButton(true);
    }
    if (orderData?.order_status === "SHIPPED") {
      setShowDownloadLabel(true);
    }
  }, [orderData]);

  const getParcelId = async () => {
    try {
      const response = await getParcelDetails(params.id, token);
      if (!response.error) setParcelId(response.data.parcel_id);
    } catch {}
  };

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handlePack = async () => {
    const { length, width, height, weight } = dimensions;
    if (!length || !width || !height || !weight) {
      toast.error("Please fill in all dimensions before packing.");
      return;
    }
    setIsPacking(true);
    try {
      await changeOrderStatus(token, params.id, "PACKED", { length, width, height, weight });
      toast.success("Order marked as PACKED!");
      setOrderStatus("PACKED");
      setOrderData((p: any) => ({ ...p, order_status: "PACKED" }));
      await getParcelId();
      setShowShipmentButton(true);
    } catch (e: any) {
      toast.error(e.message || "Failed to update order status.");
    } finally {
      setIsPacking(false);
    }
  };

  const handleShip = async () => {
    if (!parcelId) { toast.error("Parcel ID is missing!"); return; }
    setIsShipping(true);
    try {
      const response = await buyShipmentLabel(parcelId, token);
      if (response.error) {
        toast.error(response.message || "Failed to buy shipment label.");
      } else {
        toast.success("Order marked as Shipped!");
        setShowDownloadLabel(true);
        setShowShipmentButton(false);
        setOrderStatus("SHIPPED");
        setOrderData((p: any) => ({ ...p, order_status: "SHIPPED" }));
      }
    } finally {
      setIsShipping(false);
    }
  };

  const handleDownloadLabel = async () => {
    const orderId = orderData?.id;
    if (!orderId) { toast.error("Order ID is missing!"); return; }
    setIsDownloadingLabel(true);
    try {
      const response = await getShipmentDetails(orderId, token);
      if (response?.postage_label_url) {
        const proxyUrl = `/api/download-label?url=${encodeURIComponent(response.postage_label_url)}&filename=shipment_label_${orderId}.png`;
        const link = document.createElement("a");
        link.href = proxyUrl;
        link.download = `shipment_label_${orderId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Shipment label downloaded!");
      } else {
        toast.info(
          "Label generation is still in progress. Please wait and try again. If this persists, contact admin@pinksurfing.com",
          { autoClose: 8000 }
        );
      }
    } catch {
      toast.info(
        "Could not retrieve the label right now — it may still be generating. Please try again shortly.",
        { autoClose: 8000 }
      );
    } finally {
      setIsDownloadingLabel(false);
    }
  };

  const handleDisputeReturn = async () => {
    if (!params.id) return;
    setIsDisputeFiling(true);
    try {
      const result = await disputeReturn(params.id, token);
      if (!result.error) {
        toast.success("Dispute filed. The 48-hour auto-refund clock is now frozen. Admin has been notified.");
        setOrderStatus("RETURN-DISPUTED");
        setOrderData((p: any) => ({ ...p, order_status: "RETURN-DISPUTED" }));
      } else {
        toast.error(result.message || "Failed to file dispute.");
      }
    } catch {
      toast.error("Unexpected error filing dispute.");
    } finally {
      setIsDisputeFiling(false);
    }
  };

  const dimField = (key: keyof typeof dimensions, label: string, unit: string) => (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1.5">
        {label} <span className="normal-case font-normal">({unit})</span>
        <span className="text-danger ml-0.5">*</span>
      </label>
      <input
        type="number"
        min="0"
        step="0.1"
        value={dimensions[key]}
        onChange={e => setDimensions(p => ({ ...p, [key]: e.target.value }))}
        placeholder={`e.g. 10`}
        className="input-premium text-sm"
      />
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumb pageName="Order Details" />

      {loading ? (
        <div className="premium-card p-12 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !orderData ? (
        <div className="premium-card p-12 text-center text-surface-500 dark:text-surface-400">
          Order not found.
        </div>
      ) : (
        <>
          {/* ── Header ── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <FiPackage className="w-6 h-6 text-primary-500" />
                Order{" "}
                {orderData.order_number
                  ? <span className="text-primary-500">#{orderData.order_number}</span>
                  : <span className="text-sm text-surface-400 font-normal">{orderData.id?.slice(0, 8)}…</span>}
              </h1>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                {orderData.product || "Product details below"}
              </p>
            </div>
            <StatusBadge status={orderStatus ?? ""} />
          </div>

          {/* ── RETURN-DELIVERED: 48-hour dispute panel ── */}
          {orderStatus === "RETURN-DELIVERED" && (
            <div className="premium-card p-5 border-l-4 border-accent-amber">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-amber/20 flex items-center justify-center flex-shrink-0">
                  <FiClock className="w-5 h-5 text-accent-amber" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-surface-900 dark:text-white">
                    Return Delivered — 48-Hour Inspection Window Active
                  </p>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    You have <strong className="text-surface-900 dark:text-white">48 hours</strong> to inspect the returned package before the system issues an automatic refund to the buyer. If the return is fraudulent or the item is damaged, click <strong>Dispute Return</strong> to freeze the refund clock and alert the Pinksurfing admin team.
                  </p>
                  <button
                    type="button"
                    onClick={handleDisputeReturn}
                    disabled={isDisputeFiling}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-danger text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDisputeFiling ? (
                      <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" /></svg> Filing…</>
                    ) : (
                      <><FiAlertTriangle className="w-4 h-4" /> Dispute Return</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── RETURN-DISPUTED ── */}
          {orderStatus === "RETURN-DISPUTED" && (
            <div className="premium-card p-5 border-l-4 border-danger">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
                  <FiAlertCircle className="w-5 h-5 text-danger" />
                </div>
                <div>
                  <p className="font-bold text-surface-900 dark:text-white">Dispute Filed — Auto-Refund Clock Frozen</p>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    Your dispute has been received and the automatic refund has been halted. A high-priority alert has been sent to the Pinksurfing admin team. Please prepare your unboxing evidence for manual arbitration.
                  </p>
                </div>
              </div>
            </div>
          )}


          <div className="premium-card p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-light-border dark:border-dark-border">
              <div className="w-9 h-9 rounded-xl bg-gradient-pink flex items-center justify-center">
                <FiTruck className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">Fulfillment Actions</h2>
            </div>

            {orderStatus === "RECEIVED" && !showShipmentButton && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">
                  Step 1 — Enter package dimensions, then mark as Packed
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {dimField("length", "Length", "in")}
                  {dimField("width",  "Width",  "in")}
                  {dimField("height", "Height", "in")}
                  {dimField("weight", "Weight", "oz")}
                </div>
                <button
                  type="button"
                  onClick={handlePack}
                  disabled={isPacking || !dimensions.length || !dimensions.width || !dimensions.height || !dimensions.weight}
                  className="btn-gradient flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPacking ? (
                    <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" /></svg> Packing…</>
                  ) : (
                    <><FiPackage className="w-4 h-4" /> Mark as Packed</>
                  )}
                </button>
              </div>
            )}

            {/* STEP 2: Buy shipment label / Mark as Shipped */}
            {(showShipmentButton || orderStatus === "PACKED") && !showDownloadLabel && orderStatus !== "SHIPPED" && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">
                  Step 2 — Purchase shipment label &amp; mark as Shipped
                </p>
                <button
                  type="button"
                  onClick={handleShip}
                  disabled={isShipping}
                  className="btn-gradient flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isShipping ? (
                    <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" /></svg> Processing…</>
                  ) : (
                    <><FiTruck className="w-4 h-4" /> Mark as Shipped</>
                  )}
                </button>
              </div>
            )}

            {/* STEP 3: Download label */}
            {(showDownloadLabel || orderStatus === "SHIPPED") && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">
                  Step 3 — Download shipment label
                </p>
                <button
                  type="button"
                  onClick={handleDownloadLabel}
                  disabled={isDownloadingLabel}
                  className="btn-gradient flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloadingLabel ? (
                    <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" /></svg> Checking label…</>
                  ) : (
                    <><FiDownload className="w-4 h-4" /> Download Shipment Label</>
                  )}
                </button>
              </div>
            )}

            {/* Idle state — nothing to do */}
            {!["RECEIVED", "PACKED"].includes(orderStatus ?? "") && !showShipmentButton && !showDownloadLabel && orderStatus !== "SHIPPED" && (
              <p className="text-sm text-surface-500 dark:text-surface-400 flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-success" />
                No fulfillment actions required for this order status.
              </p>
            )}
          </div>

          {/* ── ORDER DETAILS CARD ── */}
          <div className="premium-card p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-light-border dark:border-dark-border">
              <div className="w-9 h-9 rounded-xl bg-gradient-purple flex items-center justify-center">
                <FiHash className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">Order Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Order IDs */}
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Order Number</span>
                <p className="text-lg font-bold text-primary-500">
                  {orderData.order_number ? `#${orderData.order_number}` : "—"}
                </p>
              </div>
              <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">Internal UUID</span>
                <p className="text-xs text-surface-400 dark:text-surface-500 font-mono break-all">{orderData.id}</p>
              </div>

              <InfoRow label="Product"          value={orderData.product} />
              <InfoRow label="Quantity"          value={orderData.quantity} />
              <InfoRow label="Total Price"       value={orderData.total_price ? `$${orderData.total_price}` : undefined} />
              <InfoRow label="Customer Name"     value={orderData.customer_name} />
              <InfoRow label="Customer Email"    value={orderData.customer} />
              <InfoRow label="Mobile Number"     value={orderData.phone} />
              <InfoRow label="Vendor"            value={orderData.vendor} />
              <InfoRow label="Delivery Address"  value={orderData.delivery_address} />
              <InfoRow label="Order Date"        value={orderData.order_date} />
              <InfoRow label="Shipping Speed"    value={orderData.shipping_speed} />
              <InfoRow label="Tracking Code"     value={orderData.tracking_code} />
            </div>

            {/* Payment status note */}
            {orderStatus === "RECEIVED" && (
              <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-success-light dark:bg-success/10 border border-success/30">
                <FiCheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                <span className="text-sm font-medium text-success-dark dark:text-success">
                  Payment completed — ready to pack
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Page;
