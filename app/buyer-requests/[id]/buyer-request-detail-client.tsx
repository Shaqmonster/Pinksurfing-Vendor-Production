"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  ImagePlus,
  MapPin,
  Package,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { resolveStaticRouteId } from "@/utils/staticRouteId";
import {
  createBid,
  deleteBid,
  getMyBids,
  getOpenRequestDetail,
  listResults,
} from "@/lib/api/buyerRequests";
import { handleError, handleSuccess } from "@/utils/toast";
import { money } from "@/utils/money";
import { resolveVendorApiToken } from "@/utils/vendorAuth";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Condition = "new" | "used" | "any";

interface VendorBid {
  id: string;
  request: string;
  bid_amount: string;
  shipping_cost: string;
  stock_available: boolean;
  condition: Condition;
  delivery_time_days: number;
  proposal: string;
  status: string;
  created_at: string;
}

interface ProductRequest {
  id: string;
  title: string;
  description: string;
  budget: string;
  quantity: number;
  condition: Condition;
  ship_to_zip: string;
  deadline: string | null;
  category_name: string | null;
  customer_first_name: string;
  /** True when the signed-in vendor is also the person who posted this request. */
  is_own?: boolean;
  status: string;
  bids: VendorBid[];
  image1: string | null;
  image2: string | null;
  image3: string | null;
  image4: string | null;
  created_at: string;
}

const CONDITION_LABEL: Record<Condition, string> = {
  any: "Any condition",
  new: "New",
  used: "Used",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  SHORTLISTED: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  ACCEPTED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  REJECTED: "bg-red-500/15 text-red-600 dark:text-red-400",
};


/** The API's own message (e.g. "This request is no longer open.") rather than "status code 400". */
function apiMessage(err: unknown): string | unknown {
  if (!axios.isAxiosError(err)) return err;
  const data = err.response?.data as Record<string, unknown> | string | undefined;
  if (!data) return err;
  if (typeof data === "string") return data;
  const parts = Object.values(data).flat().filter((v) => typeof v === "string");
  return parts.length ? parts.join(" ") : err;
}

const label = "block text-xs font-semibold text-surface-600 dark:text-surface-300 mb-1";
const MAX_PHOTOS = 4;

// ─── Request summary ───────────────────────────────────────────────────────────

function RequestSummary({ request }: { request: ProductRequest }) {
  const images = [request.image1, request.image2, request.image3, request.image4].filter(
    Boolean
  ) as string[];
  return (
    <div className="premium-card p-5 space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold">
          Product request
        </span>
        {request.category_name && (
          <span className="flex items-center gap-1 text-surface-500">
            <Tag className="w-3 h-3" />
            {request.category_name}
          </span>
        )}
        {request.status !== "OPEN" && (
          <span className="px-2 py-0.5 rounded-full bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300">
            {request.status}
          </span>
        )}
      </div>
      <h1 className="text-xl font-bold text-surface-900 dark:text-white">{request.title}</h1>
      {request.description && request.description !== request.title && (
        <p className="text-sm text-surface-600 dark:text-surface-300 whitespace-pre-line">
          {request.description}
        </p>
      )}
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <dt className="text-xs text-surface-500">Budget per item</dt>
          <dd className="font-semibold text-emerald-600 dark:text-emerald-400">${money(request.budget)}</dd>
        </div>
        <div>
          <dt className="text-xs text-surface-500">Quantity</dt>
          <dd className="font-semibold text-surface-900 dark:text-white">{request.quantity || 1}</dd>
        </div>
        <div>
          <dt className="text-xs text-surface-500">Condition</dt>
          <dd className="font-semibold text-surface-900 dark:text-white">
            {CONDITION_LABEL[request.condition] || "Any condition"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-surface-500">Ship to</dt>
          <dd className="font-semibold text-surface-900 dark:text-white flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {request.ship_to_zip || "Not given"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-surface-500">Needed by</dt>
          <dd className="font-semibold text-surface-900 dark:text-white">
            {request.deadline
              ? new Date(request.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
              : "No deadline"}
          </dd>
        </div>
      </dl>
      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" className="w-20 h-20 rounded-lg object-cover border border-surface-200 dark:border-surface-700" />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = resolveStaticRouteId(params?.id as string);

  const [token, setToken] = useState("");
  const [request, setRequest] = useState<ProductRequest | null>(null);
  const [myBid, setMyBid] = useState<VendorBid | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [form, setForm] = useState({
    price: "",
    shipping: "0",
    deliveryDays: "",
    condition: "new" as Condition,
    inStock: true,
    note: "",
  });

  useEffect(() => {
    resolveVendorApiToken()
      .then((t) => {
        setToken(t || "");
        if (!t) setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Wait for the token: loading with an empty token used to fire an unauthenticated request.
  useEffect(() => {
    if (!requestId || !token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const [reqRes, bidsRes] = await Promise.all([
          getOpenRequestDetail(token, requestId),
          getMyBids(token),
        ]);
        if (cancelled) return;
        setRequest(reqRes.data);
        const existing = listResults<VendorBid>(bidsRes.data).find(
          (b) => String(b.request) === String(requestId)
        );
        setMyBid(existing || null);
      } catch (err) {
        if (cancelled) return;
        if (axios.isAxiosError(err) && err.response?.status === 404) setNotFound(true);
        else handleError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestId, token]);

  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const total = (Number(form.price) || 0) + (Number(form.shipping) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request || !requestId) return;
    const price = Number(form.price);
    const days = parseInt(form.deliveryDays, 10);
    if (!Number.isFinite(price) || price <= 0) return handleError("Enter your price per item.");
    if (!Number.isFinite(days) || days < 1) return handleError("Enter delivery time in days.");
    try {
      setSubmitting(true);
      const res = await createBid(
        token,
        {
          request_id: requestId,
          bid_amount: price.toFixed(2),
          shipping_cost: (Number(form.shipping) || 0).toFixed(2),
          delivery_time_days: days,
          condition: form.condition,
          stock_available: form.inStock,
          proposal: form.note.trim() || "Offer sent from the PinkSurfing vendor portal.",
        },
        photos
      );
      setMyBid(res.data);
      handleSuccess("Offer sent. The buyer can accept it from My Bids.");
    } catch (err) {
      handleError(apiMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!myBid || !window.confirm("Withdraw your offer? This cannot be undone.")) return;
    try {
      setDeleting(true);
      await deleteBid(token, myBid.id);
      handleSuccess("Offer withdrawn.");
      setMyBid(null);
    } catch (err) {
      handleError(err);
    } finally {
      setDeleting(false);
    }
  };

  const back = (
    <Link
      href="/buyer-requests"
      className="inline-flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Buyer Requests
    </Link>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-8 h-8 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="premium-card text-center py-16 max-w-xl">
        <p className="text-sm text-surface-500 dark:text-surface-400">Sign in again to view this request.</p>
      </div>
    );
  }

  if (notFound || !request) {
    return (
      <div className="premium-card text-center py-16 max-w-xl space-y-3">
        <p className="font-semibold text-surface-900 dark:text-white">This request is closed</p>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          The buyer has accepted an offer or removed the request, so it no longer takes offers.
        </p>
        <button type="button" onClick={() => router.push("/buyer-requests")} className="btn-gradient px-5 py-2.5 text-sm">
          See open requests
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-3xl">
      {back}
      <RequestSummary request={request} />

      {myBid ? (
        <div className="premium-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Your offer
            </h2>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[myBid.status] || ""}`}>
              {myBid.status === "ACCEPTED" ? "Accepted — the buyer is checking out" : myBid.status}
            </span>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <dt className="text-xs text-surface-500">Price</dt>
              <dd className="font-semibold">${money(myBid.bid_amount)}</dd>
            </div>
            <div>
              <dt className="text-xs text-surface-500">Shipping</dt>
              <dd className="font-semibold">
                {Number(myBid.shipping_cost) > 0 ? `$${money(myBid.shipping_cost)}` : "Free"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-surface-500">Delivery</dt>
              <dd className="font-semibold">{myBid.delivery_time_days} days</dd>
            </div>
            <div>
              <dt className="text-xs text-surface-500">Item</dt>
              <dd className="font-semibold">
                {CONDITION_LABEL[myBid.condition] || "New"}
                {myBid.stock_available === false ? ", not in stock yet" : ", in stock"}
              </dd>
            </div>
          </dl>
          {myBid.proposal && (
            <p className="text-sm text-surface-600 dark:text-surface-300 whitespace-pre-line">{myBid.proposal}</p>
          )}
          {myBid.status === "PENDING" && (
            <button
              type="button"
              onClick={handleWithdraw}
              disabled={deleting}
              className="inline-flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "Withdrawing…" : "Withdraw offer"}
            </button>
          )}
        </div>
      ) : request.is_own ? (
        <div className="premium-card p-5 text-sm text-surface-600 dark:text-surface-300">
          This is your request. Offers from other vendors appear in My Bids on pinksurfing.com.
        </div>
      ) : request.status !== "OPEN" ? (
        <div className="premium-card p-5 text-sm text-surface-600 dark:text-surface-300">
          This request is closed and no longer takes offers.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="premium-card p-5 space-y-4">
          <h2 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-primary-500" />
            Make an offer
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="offer-price" className={label}>
                Price per item ($)
              </label>
              <input
                id="offer-price"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                className="input-premium w-full"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="offer-shipping" className={label}>
                Shipping ($, 0 = free)
              </label>
              <input
                id="offer-shipping"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                className="input-premium w-full"
                value={form.shipping}
                onChange={(e) => setForm({ ...form, shipping: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="offer-days" className={label}>
                Delivery time (days)
              </label>
              <input
                id="offer-days"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                className="input-premium w-full"
                value={form.deliveryDays}
                onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="offer-condition" className={label}>
                Item condition
              </label>
              <select
                id="offer-condition"
                className="input-premium w-full"
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value as Condition })}
              >
                <option value="new">New</option>
                <option value="used">Used</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-200 sm:mt-6">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
              />
              In stock and ready to ship
            </label>
          </div>
          <div>
            <label htmlFor="offer-note" className={label}>
              Note to the buyer <span className="font-normal text-surface-400">(optional)</span>
            </label>
            <textarea
              id="offer-note"
              className="input-premium w-full min-h-[90px]"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Model details, warranty, bundle contents…"
            />
          </div>
          <div>
            <span className={label}>
              Photos <span className="font-normal text-surface-400">(optional, up to {MAX_PHOTOS})</span>
            </span>
            <div className="flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div key={src} className="relative w-16 h-16">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-16 h-16 rounded-lg object-cover border border-surface-200 dark:border-surface-700" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 rounded-full bg-surface-900 text-white p-0.5"
                    aria-label={`Remove photo ${i + 1}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="w-16 h-16 rounded-lg border border-dashed border-surface-300 dark:border-surface-600 flex items-center justify-center text-surface-400 hover:text-primary-500 cursor-pointer">
                  <ImagePlus className="w-5 h-5" />
                  <span className="sr-only">Add photos</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
                      setPhotos((prev) => [...prev, ...files].slice(0, MAX_PHOTOS));
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
          </div>
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            Sending an offer is free. You&apos;re paid when the buyer accepts it and checks out.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-200 dark:border-surface-700">
            <p className="text-sm text-surface-600 dark:text-surface-300 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Buyer pays ${money(total)} per item
              </span>
              {form.deliveryDays && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {form.deliveryDays} days
                </span>
              )}
            </p>
            <button type="submit" disabled={submitting} className="btn-gradient px-5 py-2.5 text-sm disabled:opacity-50">
              {submitting ? "Sending…" : "Send offer"}
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
}
