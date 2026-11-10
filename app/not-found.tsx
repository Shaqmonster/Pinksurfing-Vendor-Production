"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { editProductHref } from "@/utils/staticRouteId";

const LEGACY_EDIT_PATH = /^\/inventory\/editProduct\/([^/?#]+)\/?$/;

export default function NotFound() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const match = pathname.match(LEGACY_EDIT_PATH);
    if (!match) return;
    const id = decodeURIComponent(match[1]);
    if (!id || id === "_") return;
    window.location.replace(editProductHref(id));
  }, [pathname]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center px-4">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
        Page not found
      </h1>
      <p className="max-w-md text-surface-500 dark:text-surface-400">
        This link may be outdated. Go back to your listings and open Edit again.
      </p>
      <Link href="/inventory/products" className="btn-gradient inline-flex items-center">
        Back to listings
      </Link>
    </div>
  );
}
