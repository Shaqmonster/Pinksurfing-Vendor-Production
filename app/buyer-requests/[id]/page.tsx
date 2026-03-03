"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  AlertCircle,
  Shield,
  DollarSign,
  Calendar,
  Camera,
  Clock,
  Tag,
  MapPin,
  BadgeCheck,
  FileText,
  Flag,
  Paperclip,
  MessageSquare,
  Edit3,
  Plus,
  Trash2,
  Upload,
  GripVertical,
  X,
  Save,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import {
  getOpenRequestDetail,
  createBid,
  getMyBids,
  deleteBid,
} from "@/api/buyerRequests";
import { handleError, handleSuccess } from "@/utils/toast";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface VendorBid {
  id: string;
  bid_amount: string;
  delivery_time_days: number;
  proposal: string;
  status: string;
  vendor_store_name: string;
  vendor_email: string;
  image1: string | null;
  image2: string | null;
  image3: string | null;
  image4: string | null;
  created_at: string;
  request?: string;
}

interface BuyerRequest {
  id: string;
  title: string;
  description: string;
  budget: string;
  deadline: string | null;
  category_name: string | null;
  customer_first_name: string;
  customer_last_name: string;
  status: string;
  bids: VendorBid[];
  image1: string | null;
  image2: string | null;
  image3: string | null;
  image4: string | null;
  created_at: string;
}

interface Milestone {
  id: string;
  title: string;
  amount: string;
  description: string;
  dueTiming: string;
}

interface OfferData {
  title: string;
  offerType: "fixed" | "range" | "hourly" | "negotiable";
  summary: string;
  amount: string;
  currency: string;
  depositRequired: boolean;
  taxesIncluded: boolean;
  paymentSchedule: string;
  financingAvailable: boolean;
  startDate: string;
  duration: string;
  deliveryDays: string;
  availability: string;
  expirationDate: string;
  rushFee: boolean;
  scope: string;
  inclusions: string;
  exclusions: string;
  assumptions: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Job Overview", shortLabel: "Overview" },
  { label: "Offer Basics", shortLabel: "Basics" },
  { label: "Price & Payment", shortLabel: "Price" },
  { label: "Timeline", shortLabel: "Timeline" },
  { label: "Scope", shortLabel: "Scope" },
  { label: "Milestones", shortLabel: "Milestones" },
  { label: "Attachments", shortLabel: "Files" },
  { label: "Review & Send", shortLabel: "Review" },
];

const BID_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
  SHORTLISTED: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  ACCEPTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
};

// ─── Helper Components ─────────────────────────────────────────────────────────

const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
      checked ? "bg-primary-500" : "bg-surface-300 dark:bg-surface-600"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
        checked ? "translate-x-4" : "translate-x-0.5"
      }`}
    />
  </button>
);

const StepProgressBar = ({ currentStep }: { currentStep: number }) => (
  <div className="w-full">
    {/* Mobile */}
    <div className="flex items-center justify-between md:hidden">
      <span className="text-sm font-medium text-surface-900 dark:text-white">
        Step {currentStep + 1} of {STEPS.length}
      </span>
      <span className="text-sm text-surface-500 dark:text-surface-400">
        {STEPS[currentStep]?.label}
      </span>
    </div>
    <div className="md:hidden mt-2 h-1 rounded-full bg-surface-200 dark:bg-dark-border overflow-hidden">
      <div
        className="h-full bg-gradient-pink rounded-full transition-all duration-500 ease-out"
        style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
      />
    </div>

    {/* Desktop */}
    <div className="hidden md:flex items-center gap-0.5">
      {STEPS.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={i} className="flex items-center flex-1">
            <div
              className={`flex items-center gap-1.5 text-xs font-medium px-1.5 py-1 rounded-md w-full ${
                done
                  ? "text-primary-500"
                  : active
                  ? "text-surface-900 dark:text-white"
                  : "text-surface-400 dark:text-surface-600"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 transition-all ${
                  done
                    ? "bg-gradient-pink text-white"
                    : active
                    ? "border-2 border-primary-500 text-primary-500"
                    : "border border-light-border dark:border-dark-border text-surface-400 dark:text-surface-600"
                }`}
              >
                {done ? <Check className="w-2.5 h-2.5" /> : i + 1}
              </div>
              <span className="hidden xl:inline truncate text-[11px]">
                {step.shortLabel}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-3 h-px flex-shrink-0 ${
                  done
                    ? "bg-primary-400"
                    : "bg-light-border dark:bg-dark-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  </div>
);

const StickyFooter = ({
  currentStep,
  onBack,
  onNext,
  onSaveDraft,
  isLastStep,
  isLoading,
  nextLabel,
}: {
  currentStep: number;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft?: () => void;
  isLastStep?: boolean;
  isLoading?: boolean;
  nextLabel?: string;
}) => (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-dark-bg/90 backdrop-blur-md border-t border-light-border dark:border-dark-border px-4 py-3">
    <div className="max-w-3xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-2">
        {currentStep > 0 && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-surface-500 dark:text-surface-400 hover:text-surface-800 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-dark-hover text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}
        {onSaveDraft && (
          <button
            type="button"
            onClick={onSaveDraft}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-surface-500 dark:text-surface-400 hover:text-surface-800 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-dark-hover text-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save Draft</span>
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={isLoading}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all min-w-[130px] justify-center disabled:opacity-60 disabled:cursor-not-allowed ${
          isLastStep
            ? "bg-gradient-pink shadow-glow-pink hover:opacity-90"
            : "bg-surface-800 dark:bg-surface-700 hover:bg-surface-700 dark:hover:bg-surface-600"
        }`}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            {nextLabel || (isLastStep ? "Send Offer" : "Continue")}
            {!isLastStep && <ArrowRight className="w-4 h-4" />}
          </>
        )}
      </button>
    </div>
  </div>
);

// ─── Job Sidebar (desktop) ─────────────────────────────────────────────────────

const JobSidebar = ({ request }: { request: BuyerRequest }) => {
  const reqImages = [request.image1, request.image2, request.image3, request.image4].filter(
    Boolean
  ) as string[];

  return (
    <div className="sticky top-6 premium-card space-y-4">
      <p className="text-xs font-mono text-primary-500 font-semibold tracking-wider uppercase">
        Job Request
      </p>
      {request.category_name && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-500 bg-primary-500/10 px-2.5 py-0.5 rounded-full">
          <Tag className="w-3 h-3" />
          {request.category_name}
        </span>
      )}
      <h3 className="text-base font-bold text-surface-900 dark:text-white leading-snug">
        {request.title}
      </h3>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400">
          <DollarSign className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">
            ${request.budget}
          </span>
        </div>
        {request.deadline && (
          <div className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400">
            <Calendar className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
            <span className="text-xs truncate">
              {new Date(request.deadline).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400 col-span-2">
          <BadgeCheck className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
          <span className="text-xs">
            {request.customer_first_name} {request.customer_last_name}
          </span>
        </div>
      </div>

      {reqImages.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {reqImages.map((src, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg overflow-hidden bg-surface-100 dark:bg-dark-hover"
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed line-clamp-4">
        {request.description}
      </p>

      <div className="pt-2 border-t border-light-border dark:border-dark-border">
        <div className="grid grid-cols-2 gap-2">
          {[
            { Icon: Shield, text: "Secure Escrow" },
            { Icon: BadgeCheck, text: "Verified Buyer" },
          ].map(({ Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400"
            >
              <Icon className="w-3 h-3 text-primary-500 flex-shrink-0" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Step Components ────────────────────────────────────────────────────────────

const JobOverviewStep = ({
  request,
  onContinue,
}: {
  request: BuyerRequest;
  onContinue: () => void;
}) => {
  const reqImages = [request.image1, request.image2, request.image3, request.image4].filter(
    Boolean
  ) as string[];

  return (
    <div className="space-y-6">
      {/* Mobile-only job card */}
      <div className="md:hidden premium-card space-y-4">
        <span className="text-xs font-mono text-primary-500 font-semibold tracking-wider uppercase">
          Job Request
        </span>
        <h2 className="text-xl font-bold text-surface-900 dark:text-white">
          {request.title}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {[
            { Icon: Tag, text: request.category_name || "General" },
            {
              Icon: DollarSign,
              text: `$${request.budget}`,
              className: "text-emerald-600 dark:text-emerald-400",
            },
            ...(request.deadline
              ? [
                  {
                    Icon: Calendar,
                    text: `Due ${new Date(request.deadline).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}`,
                  },
                ]
              : []),
          ].map(({ Icon, text, className }: any) => (
            <div
              key={text}
              className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400"
            >
              <Icon className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
              <span className={className}>{text}</span>
            </div>
          ))}
        </div>

        {reqImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {reqImages.map((src, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg overflow-hidden bg-surface-100 dark:bg-dark-hover"
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
          {request.description}
        </p>

        <div className="flex items-center gap-2 pt-2 border-t border-light-border dark:border-dark-border">
          <div className="w-8 h-8 rounded-full bg-gradient-pink flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {request.customer_first_name?.[0] ?? "B"}
          </div>
          <div>
            <p className="text-sm font-medium text-surface-900 dark:text-white">
              {request.customer_first_name} {request.customer_last_name}
            </p>
            <div className="flex items-center gap-1">
              <BadgeCheck className="w-3 h-3 text-primary-500" />
              <span className="text-xs text-primary-500">Verified Buyer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop prompt */}
      <div className="hidden md:block space-y-2">
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
          Ready to Submit Your Offer?
        </h2>
        <p className="text-surface-500 dark:text-surface-400">
          Review the job details on the left, then create a professional offer in just a few steps.
        </p>
      </div>

      {/* Pay-to-bid notice */}
      <div className="premium-card border-primary-200 dark:border-primary-800/40 bg-primary-50/50 dark:bg-primary-900/10">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-surface-900 dark:text-white">
              Pay-to-bid notice
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
              A small bid fee may apply to reach verified buyers. You&apos;ll only be charged upon
              submission.
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="w-full py-3.5 rounded-xl bg-gradient-pink text-white font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-glow-pink"
      >
        Create Offer
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

const OfferBasicsStep = ({
  data,
  onChange,
}: {
  data: OfferData;
  onChange: (f: string, v: string | boolean) => void;
}) => {
  const offerTypes = [
    { value: "fixed", label: "Fixed Price", desc: "Single set price" },
    { value: "range", label: "Price Range", desc: "Min to max" },
    { value: "hourly", label: "Hourly", desc: "Per-hour rate" },
    { value: "negotiable", label: "Negotiable", desc: "Open to discuss" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-surface-900 dark:text-white">Offer Basics</h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Start with the essentials
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
            Offer Title
          </label>
          <input
            value={data.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="e.g. Full Kitchen Renovation \u2014 Premium Package"
            className="w-full px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-900 dark:text-white text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all placeholder-surface-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
            Offer Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {offerTypes.map((type) => (
              <label
                key={type.value}
                className={`flex items-center gap-3 premium-card cursor-pointer transition-all duration-200 p-3.5 ${
                  data.offerType === type.value
                    ? "border-primary-400 dark:border-primary-600 shadow-glow-pink"
                    : "hover:border-primary-300 dark:hover:border-primary-700"
                }`}
              >
                <input
                  type="radio"
                  name="offerType"
                  value={type.value}
                  checked={data.offerType === type.value}
                  onChange={() => onChange("offerType", type.value)}
                  className="accent-primary-500"
                />
                <div>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">
                    {type.label}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">{type.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
            Summary Message
          </label>
          <textarea
            value={data.summary}
            onChange={(e) => onChange("summary", e.target.value)}
            placeholder="Keep it simple. You can add details later."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-900 dark:text-white text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all resize-none placeholder-surface-400"
          />
          <p className="text-xs text-surface-400 dark:text-surface-500">
            Clear offers close faster.
          </p>
        </div>
      </div>
    </div>
  );
};

const PricePaymentStep = ({
  data,
  onChange,
}: {
  data: OfferData;
  onChange: (f: string, v: string | boolean) => void;
}) => {
  const deposit = data.depositRequired && data.amount
    ? (parseFloat(data.amount) * 0.25).toFixed(2)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-surface-900 dark:text-white">Price &amp; Payment</h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Set your pricing and terms
        </p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 font-mono text-sm">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={data.amount}
                onChange={(e) => onChange("amount", e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-900 dark:text-white text-sm font-mono outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
              Currency
            </label>
            <select
              value={data.currency}
              onChange={(e) => onChange("currency", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-700 dark:text-surface-300 text-sm outline-none focus:border-primary-400 transition-all"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
            </select>
          </div>
        </div>

        <div className="premium-card space-y-4">
          {[
            {
              field: "depositRequired",
              label: "Deposit Required",
              desc: "25% deposit upfront",
            },
            { field: "taxesIncluded", label: "Taxes Included", desc: "Include tax in price" },
            {
              field: "financingAvailable",
              label: "Financing Available",
              desc: "Offer payment plans",
            },
          ].map((pref, i) => (
            <React.Fragment key={pref.field}>
              {i > 0 && (
                <div className="border-t border-light-border dark:border-dark-border" />
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">
                    {pref.label}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">{pref.desc}</p>
                </div>
                <Toggle
                  checked={data[pref.field as keyof OfferData] as boolean}
                  onChange={(v) => onChange(pref.field, v)}
                />
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
            Payment Schedule
          </label>
          <select
            value={data.paymentSchedule}
            onChange={(e) => onChange("paymentSchedule", e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-700 dark:text-surface-300 text-sm outline-none focus:border-primary-400 transition-all"
          >
            <option value="upfront">Upfront</option>
            <option value="milestones">Milestones</option>
            <option value="completion">Upon Completion</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Price summary */}
        {data.amount && (
          <div className="premium-card bg-surface-50/50 dark:bg-dark-hover/50 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <p className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                Price Summary
              </p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500 dark:text-surface-400">Offer Amount</span>
              <span className="font-mono font-semibold text-surface-900 dark:text-white">
                ${parseFloat(data.amount || "0").toLocaleString()}
              </span>
            </div>
            {deposit && (
              <div className="flex justify-between text-sm">
                <span className="text-surface-500 dark:text-surface-400">Deposit (25%)</span>
                <span className="font-mono text-surface-700 dark:text-surface-300">${deposit}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-surface-400 dark:text-surface-500 pt-1 border-t border-light-border dark:border-dark-border">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-500" />
                Funds held securely via escrow
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TimelineStep = ({
  data,
  onChange,
}: {
  data: OfferData;
  onChange: (f: string, v: string | boolean) => void;
}) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-surface-900 dark:text-white">
        Timeline &amp; Delivery
      </h2>
      <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
        When can you start and deliver?
      </p>
    </div>

    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
            Start Date
          </label>
          <input
            type="date"
            value={data.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-900 dark:text-surface-300 text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
            Duration
          </label>
          <input
            value={data.duration}
            onChange={(e) => onChange("duration", e.target.value)}
            placeholder="e.g. 4-6 weeks"
            className="w-full px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-900 dark:text-white text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all placeholder-surface-400"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
          Delivery Days <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="number"
            min="1"
            value={data.deliveryDays}
            onChange={(e) => onChange("deliveryDays", e.target.value)}
            placeholder="e.g. 30"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-900 dark:text-white text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all"
          />
        </div>
        <p className="text-xs text-surface-400 dark:text-surface-500">
          Number of days to complete the project
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
          Availability
        </label>
        <select
          value={data.availability}
          onChange={(e) => onChange("availability", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-700 dark:text-surface-300 text-sm outline-none focus:border-primary-400 transition-all"
        >
          <option value="immediate">Immediately Available</option>
          <option value="1week">Available in 1 Week</option>
          <option value="2weeks">Available in 2 Weeks</option>
          <option value="1month">Available in 1 Month</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
          Offer Expires
        </label>
        <input
          type="date"
          value={data.expirationDate}
          onChange={(e) => onChange("expirationDate", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-900 dark:text-surface-300 text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all [color-scheme:light] dark:[color-scheme:dark]"
        />
        <p className="text-xs text-surface-400 dark:text-surface-500">
          After this date, the offer auto-expires
        </p>
      </div>

      <div className="premium-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-surface-900 dark:text-white">
              Rush Fee Available
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Offer expedited delivery for extra cost
            </p>
          </div>
          <Toggle checked={data.rushFee} onChange={(v) => onChange("rushFee", v)} />
        </div>
      </div>
    </div>
  </div>
);

const ScopeStep = ({
  data,
  onChange,
}: {
  data: OfferData;
  onChange: (f: string, v: string) => void;
}) => {
  const fields = [
    {
      field: "scope",
      label: "Scope of Work / Deliverables",
      placeholder: "Describe what you will deliver...",
      rows: 4,
    },
    {
      field: "inclusions",
      label: "Included Items",
      placeholder: "Materials, labor, warranties...",
      rows: 3,
    },
    {
      field: "exclusions",
      label: "Excluded Items",
      placeholder: "What's NOT included...",
      rows: 3,
    },
    {
      field: "assumptions",
      label: "Assumptions & Conditions",
      placeholder: "Any conditions or assumptions...",
      rows: 3,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white">
            Scope &amp; Inclusions
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Define what&apos;s covered
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Assist
        </button>
      </div>

      <div className="space-y-4">
        {fields.map(({ field, label, placeholder, rows }) => (
          <div key={field} className="space-y-1.5">
            <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
              {label}
            </label>
            <textarea
              value={data[field as keyof OfferData] as string}
              onChange={(e) => onChange(field, e.target.value)}
              placeholder={placeholder}
              rows={rows}
              className="w-full px-4 py-3 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-900 dark:text-white text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all resize-none placeholder-surface-400"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const MilestonesStep = ({
  milestones,
  onAdd,
  onChange,
  onRemove,
  totalPrice,
}: {
  milestones: Milestone[];
  onAdd: () => void;
  onChange: (id: string, field: keyof Milestone, value: string) => void;
  onRemove: (id: string) => void;
  totalPrice: string;
}) => {
  const milestoneTotal = milestones.reduce(
    (sum, m) => sum + (parseFloat(m.amount) || 0),
    0
  );
  const offerTotal = parseFloat(totalPrice) || 0;
  const mismatch = offerTotal > 0 && Math.abs(milestoneTotal - offerTotal) > 0.01;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-surface-900 dark:text-white">Milestones</h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Break your project into escrow-protected phases
        </p>
      </div>

      <div className="premium-card border-primary-200 dark:border-primary-800/40 bg-primary-50/50 dark:bg-primary-900/10">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-surface-600 dark:text-surface-400">
            Funds are held securely and released when milestones are approved by the buyer.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {milestones.map((milestone, index) => (
          <div key={milestone.id} className="premium-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-surface-400 cursor-grab" />
                <span className="text-xs font-mono font-semibold text-primary-500 uppercase tracking-wider">
                  Milestone {index + 1}
                </span>
              </div>
              {milestones.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(milestone.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <input
              value={milestone.title}
              onChange={(e) => onChange(milestone.id, "title", e.target.value)}
              placeholder="Milestone title"
              className="w-full px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-900 dark:text-white text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all placeholder-surface-400"
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={milestone.amount}
                  onChange={(e) => onChange(milestone.id, "amount", e.target.value)}
                  placeholder="Amount"
                  className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-900 dark:text-white text-sm font-mono outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all"
                />
              </div>
              <input
                value={milestone.dueTiming}
                onChange={(e) => onChange(milestone.id, "dueTiming", e.target.value)}
                placeholder="e.g. Week 1"
                className="w-full px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-900 dark:text-white text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all placeholder-surface-400"
              />
            </div>

            <textarea
              value={milestone.description}
              onChange={(e) => onChange(milestone.id, "description", e.target.value)}
              placeholder="Describe this milestone..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-surface-50 dark:bg-dark-hover text-surface-900 dark:text-white text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all resize-none placeholder-surface-400"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="w-full py-3 rounded-xl border-2 border-dashed border-light-border dark:border-dark-border text-surface-500 dark:text-surface-400 text-sm font-medium flex items-center justify-center gap-2 hover:border-primary-400 hover:text-primary-500 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Milestone
      </button>

      {/* Price summary */}
      {totalPrice && (
        <div className="premium-card bg-surface-50/50 dark:bg-dark-hover/50 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-surface-500 dark:text-surface-400">Offer Amount</span>
            <span className="font-mono font-semibold text-surface-900 dark:text-white">
              ${offerTotal.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-surface-500 dark:text-surface-400">Milestone Total</span>
            <span
              className={`font-mono font-semibold ${
                mismatch
                  ? "text-red-500"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              ${milestoneTotal.toLocaleString()}
            </span>
          </div>
          {mismatch && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Milestone total doesn&apos;t match offer amount
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const AttachmentsStep = ({
  attachments,
  onAdd,
  onRemove,
}: {
  attachments: File[];
  onAdd: (files: File[]) => void;
  onRemove: (i: number) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = 4 - attachments.length;
    const toAdd = Array.from(files).slice(0, remaining);
    onAdd(toAdd);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-surface-900 dark:text-white">Attachments</h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Add supporting files to your offer
        </p>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-light-border dark:border-dark-border rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-all"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={attachments.length >= 4}
        />
        <Upload className="w-8 h-8 text-surface-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
          {attachments.length >= 4
            ? "Maximum 4 files reached"
            : "Click to upload files"}
        </p>
        <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
          Photos, documents, licenses, insurance, specs, contracts
        </p>
      </div>

      {/* File list */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((file, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 premium-card"
            >
              <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                {file.type.startsWith("image/") ? (
                  <Camera className="w-4 h-4 text-primary-500" />
                ) : (
                  <FileText className="w-4 h-4 text-primary-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-surface-400">{formatSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const ReviewStep = ({
  offerData,
  milestones,
  onEdit,
}: {
  offerData: OfferData;
  milestones: Milestone[];
  onEdit: (step: number) => void;
}) => {
  const sections = [
    {
      Icon: DollarSign,
      title: "Pricing",
      step: 2,
      content: (
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-surface-500 dark:text-surface-400">Amount: </span>
            <span className="font-mono font-semibold text-surface-900 dark:text-white">
              ${parseFloat(offerData.amount || "0").toLocaleString()}
            </span>
          </p>
          <p>
            <span className="text-surface-500 dark:text-surface-400">Type: </span>
            <span className="text-surface-700 dark:text-surface-300">{offerData.offerType}</span>
          </p>
          <p>
            <span className="text-surface-500 dark:text-surface-400">Payment: </span>
            <span className="text-surface-700 dark:text-surface-300">
              {offerData.paymentSchedule}
            </span>
          </p>
          {offerData.depositRequired && (
            <p>
              <span className="text-surface-500 dark:text-surface-400">Deposit: </span>
              <span className="text-surface-700 dark:text-surface-300">25% required</span>
            </p>
          )}
        </div>
      ),
    },
    {
      Icon: Calendar,
      title: "Timeline",
      step: 3,
      content: (
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-surface-500 dark:text-surface-400">Start: </span>
            <span className="text-surface-700 dark:text-surface-300">
              {offerData.startDate || "Not set"}
            </span>
          </p>
          <p>
            <span className="text-surface-500 dark:text-surface-400">Delivery: </span>
            <span className="text-surface-700 dark:text-surface-300">
              {offerData.deliveryDays ? `${offerData.deliveryDays} days` : "Not set"}
            </span>
          </p>
          {offerData.duration && (
            <p>
              <span className="text-surface-500 dark:text-surface-400">Duration: </span>
              <span className="text-surface-700 dark:text-surface-300">{offerData.duration}</span>
            </p>
          )}
        </div>
      ),
    },
    {
      Icon: FileText,
      title: "Scope",
      step: 4,
      content: (
        <div className="text-sm text-surface-500 dark:text-surface-400">
          {offerData.scope ? (
            <p className="line-clamp-3">{offerData.scope}</p>
          ) : (
            <p className="italic">No scope defined</p>
          )}
        </div>
      ),
    },
    {
      Icon: Flag,
      title: "Milestones",
      step: 5,
      content: (
        <div className="space-y-1 text-sm">
          {milestones.length > 0 ? (
            milestones.map((m, i) => (
              <div key={m.id} className="flex justify-between">
                <span className="text-surface-500 dark:text-surface-400">
                  {m.title || `Milestone ${i + 1}`}
                </span>
                <span className="font-mono text-surface-700 dark:text-surface-300">
                  ${parseFloat(m.amount || "0").toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <p className="text-surface-500 dark:text-surface-400 italic">No milestones</p>
          )}
        </div>
      ),
    },
    {
      Icon: Paperclip,
      title: "Attachments",
      step: 6,
      content: (
        <p className="text-sm text-surface-500 dark:text-surface-400">
          Click to add or review files
        </p>
      ),
    },
    {
      Icon: MessageSquare,
      title: "Message",
      step: 1,
      content: (
        <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2">
          {offerData.summary || "No message added"}
        </p>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-surface-900 dark:text-white">
          Review Your Offer
        </h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          {offerData.title || "Untitled Offer"}
        </p>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <div key={section.title} className="premium-card group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <section.Icon className="w-4 h-4 text-primary-500" />
                <h4 className="text-sm font-semibold text-surface-900 dark:text-white">
                  {section.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onEdit(section.step)}
                className="text-xs text-primary-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit3 className="w-3 h-3" />
                Edit
              </button>
            </div>
            {section.content}
          </div>
        ))}
      </div>
    </div>
  );
};

const ConfirmationStep = ({ onGoBack }: { onGoBack: () => void }) => (
  <div className="flex flex-col items-center justify-center text-center space-y-6 py-12">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
    >
      <div className="w-20 h-20 rounded-full bg-gradient-pink flex items-center justify-center shadow-glow-pink">
        <CheckCircle2 className="w-10 h-10 text-white" />
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-2"
    >
      <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
        Offer Sent Successfully!
      </h2>
      <p className="text-surface-500 dark:text-surface-400 max-w-sm">
        Your offer has been sent to the buyer. You&apos;ll be notified when they respond.
      </p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="premium-card w-full max-w-sm space-y-3"
    >
      <h4 className="text-xs font-mono text-primary-500 font-semibold tracking-wider uppercase">
        Next Steps
      </h4>
      <div className="space-y-3">
        {[
          {
            Icon: Clock,
            title: "Expected Response",
            desc: "Typically within 24\u201348 hours",
          },
          {
            Icon: MessageCircle,
            title: "Message Thread",
            desc: "Chat directly with the buyer",
          },
        ].map(({ Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3 text-left">
            <Icon className="w-4 h-4 text-surface-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-surface-900 dark:text-white">{title}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
    >
      <button
        type="button"
        onClick={onGoBack}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-pink text-white font-semibold text-sm shadow-glow-pink hover:opacity-90 transition-opacity"
      >
        View All Requests
        <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  </div>
);

// ─── Existing Bid View ─────────────────────────────────────────────────────────

const ExistingBidView = ({
  bid,
  onWithdraw,
  deleting,
}: {
  bid: VendorBid;
  onWithdraw: () => void;
  deleting: boolean;
}) => (
  <div className="premium-card space-y-4">
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="text-emerald-500 w-5 h-5" />
        <h2 className="text-surface-900 dark:text-white font-semibold text-base">Your Bid</h2>
      </div>
      <span
        className={`text-xs font-semibold px-3 py-1 rounded-full ${
          BID_STATUS_STYLES[bid.status] ?? "bg-surface-100 text-surface-600"
        }`}
      >
        {bid.status}
      </span>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="bg-surface-50 dark:bg-dark-hover rounded-xl p-3">
        <p className="text-xs text-surface-400 dark:text-surface-500">Bid Amount</p>
        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
          ${bid.bid_amount}
        </p>
      </div>
      <div className="bg-surface-50 dark:bg-dark-hover rounded-xl p-3">
        <p className="text-xs text-surface-400 dark:text-surface-500">Delivery</p>
        <p className="text-base font-semibold text-surface-800 dark:text-white">
          {bid.delivery_time_days} days
        </p>
      </div>
    </div>

    <div className="bg-surface-50 dark:bg-dark-hover rounded-xl p-4">
      <p className="text-xs text-surface-400 dark:text-surface-500 mb-1">Proposal</p>
      <p className="text-surface-700 dark:text-surface-300 text-sm leading-relaxed">
        {bid.proposal}
      </p>
    </div>

    {bid.status === "ACCEPTED" && (
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4 text-sm font-medium">
        <CheckCircle2 className="w-5 h-5 shrink-0" />
        Congratulations! Your bid was accepted. The buyer will complete checkout to proceed.
      </div>
    )}

    {bid.status === "PENDING" && (
      <button
        type="button"
        onClick={onWithdraw}
        disabled={deleting}
        className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
      >
        <X className="w-4 h-4" />
        {deleting ? "Withdrawing\u2026" : "Withdraw Bid"}
      </button>
    )}
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.id as string;

  const token =
    typeof window !== "undefined" ? (localStorage.getItem("access") ?? "") : "";

  // Data state
  const [request, setRequest] = useState<BuyerRequest | null>(null);
  const [myBid, setMyBid] = useState<VendorBid | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [offerData, setOfferData] = useState<OfferData>({
    title: "",
    offerType: "fixed",
    summary: "",
    amount: "",
    currency: "USD",
    depositRequired: false,
    taxesIncluded: false,
    paymentSchedule: "milestones",
    financingAvailable: false,
    startDate: "",
    duration: "",
    deliveryDays: "",
    availability: "immediate",
    expirationDate: "",
    rushFee: false,
    scope: "",
    inclusions: "",
    exclusions: "",
    assumptions: "",
  });

  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: crypto.randomUUID(),
      title: "Project Kickoff",
      amount: "",
      description: "",
      dueTiming: "Week 1",
    },
  ]);

  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    if (!requestId) return;
    const load = async () => {
      try {
        setLoading(true);
        const [reqRes, bidsRes] = await Promise.all([
          getOpenRequestDetail(token, requestId),
          getMyBids(token),
        ]);
        setRequest(reqRes.data);
        const existing = bidsRes.data.find(
          (b: VendorBid & { request: string }) => b.request === requestId
        );
        if (existing) setMyBid(existing);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [requestId]);

  const updateOfferData = useCallback((field: string, value: string | boolean) => {
    setOfferData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addMilestone = useCallback(() => {
    setMilestones((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: "",
        amount: "",
        description: "",
        dueTiming: "",
      },
    ]);
  }, []);

  const updateMilestone = useCallback(
    (id: string, field: keyof Milestone, value: string) => {
      setMilestones((prev) =>
        prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
      );
    },
    []
  );

  const removeMilestone = useCallback((id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const handleNext = () => {
    if (currentStep === STEPS.length - 1) {
      handleSendOffer();
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));
  const handleSaveDraft = () => {};

  const handleSendOffer = async () => {
    if (!offerData.amount) {
      handleError("Please fill in your bid amount in the Price & Payment step.");
      setCurrentStep(2);
      return;
    }
    if (!offerData.deliveryDays) {
      handleError("Please fill in the delivery days in the Timeline step.");
      setCurrentStep(3);
      return;
    }

    const proposalParts = [
      offerData.title,
      offerData.summary && `\n${offerData.summary}`,
      offerData.scope && `\n\nScope of Work:\n${offerData.scope}`,
      offerData.inclusions && `\n\nIncluded:\n${offerData.inclusions}`,
      offerData.exclusions && `\n\nExcluded:\n${offerData.exclusions}`,
      offerData.assumptions && `\n\nAssumptions:\n${offerData.assumptions}`,
      milestones.some((m) => m.title) &&
        `\n\nMilestones:\n${milestones
          .filter((m) => m.title)
          .map((m, i) => `${i + 1}. ${m.title}${m.amount ? ` ($${m.amount})` : ""}`)
          .join("\n")}`,
    ].filter(Boolean);
    const proposal =
      proposalParts.join("").trim() || "Offer submitted via PinkSurfing Vendor Portal";

    try {
      setSubmitting(true);
      await createBid(
        token,
        {
          request_id: requestId,
          bid_amount: offerData.amount,
          delivery_time_days: offerData.deliveryDays,
          proposal,
        },
        attachments.slice(0, 4)
      );
      setIsConfirmed(true);
      handleSuccess("Offer sent successfully!");
    } catch (err: any) {
      handleError(err?.response?.data?.detail ?? err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBid = async () => {
    if (!myBid) return;
    if (!confirm("Withdraw your bid? This cannot be undone.")) return;
    try {
      setDeleting(true);
      await deleteBid(token, myBid.id);
      handleSuccess("Bid withdrawn.");
      setMyBid(null);
    } catch (err) {
      handleError(err);
    } finally {
      setDeleting(false);
    }
  };

  // ── Loading / Error states ──
  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-8 h-8 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="premium-card text-center py-20">
        <p className="text-surface-500 dark:text-surface-400">Request not found.</p>
        <Link
          href="/buyer-requests"
          className="mt-4 text-primary-500 text-sm hover:underline block"
        >
          Back to Buyer Requests
        </Link>
      </div>
    );
  }

  // ── Confirmed state ──
  if (isConfirmed) {
    return (
      <div className="max-w-md mx-auto">
        <ConfirmationStep onGoBack={() => router.push("/buyer-requests")} />
      </div>
    );
  }

  // ── Existing bid ──
  if (myBid) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-2xl"
      >
        <Link
          href="/buyer-requests"
          className="inline-flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Buyer Requests
        </Link>

        {/* Request summary */}
        <div className="premium-card space-y-3">
          {request.category_name && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-500 bg-primary-500/10 px-2.5 py-0.5 rounded-full">
              <Tag className="w-3 h-3" />
              {request.category_name}
            </span>
          )}
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">{request.title}</h1>
          <p className="text-sm text-surface-600 dark:text-surface-400">{request.description}</p>
        </div>

        <ExistingBidView bid={myBid} onWithdraw={handleDeleteBid} deleting={deleting} />

        {/* Other bids (read-only) */}
        {request.bids?.length > 0 && (
          <div className="premium-card space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
              All Bids ({request.bids.length})
            </p>
            {request.bids.map((bid) => (
              <div
                key={bid.id}
                className="flex items-center justify-between gap-3 p-3 bg-surface-50 dark:bg-dark-hover rounded-xl text-sm"
              >
                <span className="text-surface-700 dark:text-surface-300 truncate">
                  {bid.vendor_store_name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ${bid.bid_amount}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      BID_STATUS_STYLES[bid.status] ?? "bg-surface-100 text-surface-600"
                    }`}
                  >
                    {bid.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  // ── Multi-step offer creation flow ──
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <JobOverviewStep request={request} onContinue={handleNext} />;
      case 1:
        return <OfferBasicsStep data={offerData} onChange={updateOfferData} />;
      case 2:
        return <PricePaymentStep data={offerData} onChange={updateOfferData} />;
      case 3:
        return <TimelineStep data={offerData} onChange={updateOfferData} />;
      case 4:
        return (
          <ScopeStep
            data={offerData}
            onChange={(f, v) => updateOfferData(f, v)}
          />
        );
      case 5:
        return (
          <MilestonesStep
            milestones={milestones}
            onAdd={addMilestone}
            onChange={updateMilestone}
            onRemove={removeMilestone}
            totalPrice={offerData.amount}
          />
        );
      case 6:
        return (
          <AttachmentsStep
            attachments={attachments}
            onAdd={(files) =>
              setAttachments((prev) => [...prev, ...files].slice(0, 4))
            }
            onRemove={(i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
          />
        );
      case 7:
        return (
          <ReviewStep
            offerData={offerData}
            milestones={milestones}
            onEdit={(step) => setCurrentStep(step)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-28"
    >
      {/* Back link */}
      <Link
        href="/buyer-requests"
        className="inline-flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Buyer Requests
      </Link>

      {/* Progress bar */}
      <StepProgressBar currentStep={currentStep} />

      {/* Layout: sidebar + main */}
      <div className="flex gap-8">
        {/* Job sidebar — desktop only, steps 1+ */}
        {currentStep > 0 && (
          <div className="hidden lg:block w-72 flex-shrink-0">
            <JobSidebar request={request} />
          </div>
        )}

        {/* Main step content */}
        <div className="flex-1 max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Sticky footer — for steps 1–7 */}
      {currentStep > 0 && (
        <StickyFooter
          currentStep={currentStep}
          onBack={handleBack}
          onNext={handleNext}
          onSaveDraft={handleSaveDraft}
          isLastStep={currentStep === STEPS.length - 1}
          isLoading={submitting}
          nextLabel={currentStep === STEPS.length - 1 ? "Send Offer" : undefined}
        />
      )}
    </motion.div>
  );
}
