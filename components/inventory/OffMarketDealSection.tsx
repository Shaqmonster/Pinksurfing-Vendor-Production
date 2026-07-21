"use client";

import React from "react";

export const OFF_MARKET_TAG_OPTIONS = [
  "Estate Sale",
  "Motivated Seller",
  "Fix & Flip",
  "Below Comps",
  "ADU",
  "Probate",
  "Pre-Foreclosure",
  "Cash Flow",
  "30-Day Close",
  "No MLS",
  "Owner Finance",
  "Pool",
];

export type OffMarketDealFormState = {
  is_off_market: boolean;
  property_class: string;
  listing_intent: string;
  arv: string;
  asking_price: string;
  city: string;
  state: string;
  beds: string;
  verification_score: string;
  teaser_summary: string;
  popular_tags: string[];
  unlock_fee: string;
  max_unlock_slots: string;
  deadline_type: string;
  deadline_at: string;
  full_address: string;
};

export const defaultOffMarketDealForm = (): OffMarketDealFormState => ({
  is_off_market: true,
  property_class: "residential",
  listing_intent: "for_sale",
  arv: "",
  asking_price: "",
  city: "",
  state: "",
  beds: "",
  verification_score: "85",
  teaser_summary: "",
  popular_tags: [],
  unlock_fee: "50",
  max_unlock_slots: "20",
  deadline_type: "close_of_escrow",
  deadline_at: "",
  full_address: "",
});

type Props = {
  value: OffMarketDealFormState;
  onChange: (next: OffMarketDealFormState) => void;
};

export function OffMarketDealSection({ value, onChange }: Props) {
  const set = (patch: Partial<OffMarketDealFormState>) =>
    onChange({ ...value, ...patch });

  const toggleTag = (tag: string) => {
    const tags = value.popular_tags.includes(tag)
      ? value.popular_tags.filter((t) => t !== tag)
      : [...value.popular_tags, tag];
    set({ popular_tags: tags });
  };

  return (
    <div className="rounded-xl border border-pink-500/30 bg-pink-500/5 p-5 mb-6">
      <div className="text-sm font-bold text-surface-900 dark:text-white mb-1">
        Off-Market Deal Settings
      </div>
      <p className="text-xs text-surface-500 mb-4">
        ARV and spread are shown publicly; full address unlocks after buyer pays the unlock fee.
      </p>

      <label className="flex items-center gap-2 mb-4 text-sm">
        <input
          type="checkbox"
          checked={value.is_off_market}
          onChange={(e) => set({ is_off_market: e.target.checked })}
        />
        List as off-market deal (Deals Home)
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-surface-600">Property class</label>
          <select
            className="input-premium w-full mt-1"
            value={value.property_class}
            onChange={(e) => set({ property_class: e.target.value })}
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="multi_family">Multi-Family</option>
            <option value="land">Land</option>
            <option value="industrial">Industrial</option>
            <option value="wholesale">Wholesale</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-surface-600">Listing intent</label>
          <select
            className="input-premium w-full mt-1"
            value={value.listing_intent}
            onChange={(e) => set({ listing_intent: e.target.value })}
          >
            <option value="for_sale">For Sale</option>
            <option value="for_lease">For Lease</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-surface-600">ARV (After Repair Value) *</label>
          <input
            type="number"
            className="input-premium w-full mt-1"
            value={value.arv}
            onChange={(e) => set({ arv: e.target.value })}
            placeholder="1650000"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-surface-600">Asking price *</label>
          <input
            type="number"
            className="input-premium w-full mt-1"
            value={value.asking_price}
            onChange={(e) => set({ asking_price: e.target.value })}
            placeholder="1250000"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-surface-600">City *</label>
          <input
            className="input-premium w-full mt-1"
            value={value.city}
            onChange={(e) => set({ city: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-surface-600">State *</label>
          <input
            className="input-premium w-full mt-1"
            value={value.state}
            onChange={(e) => set({ state: e.target.value })}
            placeholder="CA"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-surface-600">Beds</label>
          <input
            type="number"
            className="input-premium w-full mt-1"
            value={value.beds}
            onChange={(e) => set({ beds: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-surface-600">Unlock fee ($)</label>
          <input
            type="number"
            className="input-premium w-full mt-1"
            value={value.unlock_fee}
            onChange={(e) => set({ unlock_fee: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-surface-600">Max unlock slots</label>
          <input
            type="number"
            className="input-premium w-full mt-1"
            value={value.max_unlock_slots}
            onChange={(e) => set({ max_unlock_slots: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-surface-600">Deadline</label>
          <input
            type="date"
            className="input-premium w-full mt-1"
            value={value.deadline_at}
            onChange={(e) => set({ deadline_at: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-surface-600">
            Full address (locked until unlock)
          </label>
          <input
            className="input-premium w-full mt-1"
            value={value.full_address}
            onChange={(e) => set({ full_address: e.target.value })}
            placeholder="123 Main St, Los Angeles, CA 90025"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-surface-600">Teaser summary</label>
          <textarea
            className="input-premium w-full mt-1 min-h-[80px]"
            value={value.teaser_summary}
            onChange={(e) => set({ teaser_summary: e.target.value })}
            placeholder="Estate sale — executor needs close in 60 days…"
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold text-surface-600 mb-2">Tags</div>
        <div className="flex flex-wrap gap-2">
          {OFF_MARKET_TAG_OPTIONS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-2 py-1 rounded text-xs border ${
                value.popular_tags.includes(tag)
                  ? "border-pink-500 text-pink-600 bg-pink-50"
                  : "border-surface-200 text-surface-600"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function buildOffMarketPayload(
  productId: string,
  form: OffMarketDealFormState,
  dealActiveUntil?: string
) {
  const deadline =
    form.deadline_at ||
    (dealActiveUntil ? dealActiveUntil.split("T")[0] : "") ||
    new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0];

  return {
    product_id: productId,
    is_off_market: form.is_off_market,
    property_class: form.property_class,
    listing_intent: form.listing_intent,
    arv: form.arv,
    asking_price: form.asking_price,
    city: form.city,
    state: form.state,
    beds: form.beds ? Number(form.beds) : null,
    verification_score: Number(form.verification_score) || 0,
    verification_label: Number(form.verification_score) >= 80 ? "verified" : "pending",
    teaser_summary: form.teaser_summary,
    popular_tags: form.popular_tags,
    unlock_fee: form.unlock_fee,
    max_unlock_slots: Number(form.max_unlock_slots) || 20,
    deadline_type: form.deadline_type,
    deadline_at: `${deadline}T23:59:59Z`,
    full_address: form.full_address,
  };
}
