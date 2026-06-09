"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Option = { label: string; value: string };

type SearchableSelectProps = {
  label: string;
  value: string;
  options: Option[];
  loading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string, label: string) => void;
  /** Optional override for the trigger button (e.g. settings page `input-premium`). */
  triggerClassName?: string;
};

const DEFAULT_TRIGGER =
  "w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-dark-input border border-surface-200 dark:border-dark-border text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300";

const MENU_MAX_HEIGHT = 240;

export default function SearchableSelect({
  label,
  value,
  options,
  loading,
  placeholder,
  disabled,
  onChange,
  triggerClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) => {
    const text = typeof o?.label === "string" ? o.label : String(o?.label ?? "");
    return text.toLowerCase().includes(search.toLowerCase());
  });
  const selected = options.find((o) => o.value === value);

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const gap = 4;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const flipUp = spaceBelow < 160 && spaceAbove > spaceBelow;

    setMenuStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(flipUp
        ? {
            bottom: window.innerHeight - rect.top + gap,
            maxHeight: Math.min(MENU_MAX_HEIGHT, spaceAbove),
          }
        : {
            top: rect.bottom + gap,
            maxHeight: Math.min(MENU_MAX_HEIGHT, spaceBelow),
          }),
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const onReposition = () => updateMenuPosition();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="bg-white dark:bg-dark-card rounded-xl border border-light-border dark:border-dark-border shadow-2xl flex flex-col overflow-hidden animate-fadeIn"
          >
            <div className="p-2 border-b border-light-border dark:border-dark-border flex-shrink-0">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${label}…`}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-dark-input border border-surface-200 dark:border-dark-border focus:outline-none focus:border-primary-500 text-surface-900 dark:text-white"
                />
              </div>
            </div>
            <ul className="overflow-y-auto flex-1 min-h-0">
              {filtered.length === 0 ? (
                <li className="px-4 py-3 text-sm text-surface-400 text-center">No results found</li>
              ) : (
                filtered.map((opt) => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-dark-hover transition-colors ${
                        opt.value === value
                          ? "text-primary-500 font-bold bg-primary-50 dark:bg-primary-500/10"
                          : "text-surface-900 dark:text-white"
                      }`}
                      onClick={() => {
                        onChange(opt.value, opt.label);
                        setOpen(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((o) => !o);
          setSearch("");
        }}
        className={triggerClassName ?? DEFAULT_TRIGGER}
      >
        <span
          className={
            selected ? "text-surface-900 dark:text-surface-50" : "text-surface-400 dark:text-surface-500"
          }
        >
          {loading ? "Loading…" : selected?.label ?? placeholder ?? `Select ${label}`}
        </span>
        <svg
          className={`w-4 h-4 text-surface-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {menu}
    </div>
  );
}
