"use client";

import React from "react";
import Link from "next/link";
import { IconType } from "react-icons";
import { FiInbox } from "react-icons/fi";

type EmptyStateProps = {
  icon?: IconType;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
};

export default function EmptyState({
  icon: Icon = FiInbox,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = "",
}: EmptyStateProps) {
  const actionClass =
    "inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl font-semibold text-white bg-gradient-pink shadow-glow-pink hover:opacity-90 transition-opacity";

  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 py-12 ${className}`}
      role="status"
    >
      <div className="w-14 h-14 rounded-2xl bg-primary-500/15 border border-primary-500/25 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-primary-400" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">
        {title}
      </h3>
      {description ? (
        <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm mb-5">
          {description}
        </p>
      ) : (
        <div className="mb-2" />
      )}
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={actionClass}>
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction && !actionHref ? (
        <button type="button" onClick={onAction} className={actionClass}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
