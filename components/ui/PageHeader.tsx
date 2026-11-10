"use client";

import React from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export default function PageHeader({
  title,
  description,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6 ${className}`}
    >
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-surface-900 dark:text-white">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
