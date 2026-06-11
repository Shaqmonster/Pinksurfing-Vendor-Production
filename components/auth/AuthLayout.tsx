"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiBarChart2, FiPackage, FiShoppingBag } from "react-icons/fi";
import { getStorefrontUrl } from "@/utils/storefrontUrl";

const features = [
  {
    icon: FiShoppingBag,
    title: "Your storefront",
    description: "List products, gigs, and business listings in one dashboard.",
  },
  {
    icon: FiPackage,
    title: "Orders & inventory",
    description: "Track sales, stock, and fulfillment from a single hub.",
  },
  {
    icon: FiBarChart2,
    title: "Seller tools",
    description: "Analytics, payouts, and vendor settings built for growth.",
  },
];

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
};

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: AuthLayoutProps) {
  const storefrontUrl = getStorefrontUrl();

  return (
    <div className="min-h-screen flex bg-[#f8f9fc] dark:bg-dark-bg">
      <div className="hidden lg:flex lg:w-[46%] xl:w-[50%] relative overflow-hidden bg-[#0c0f1a] text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
          <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 w-fit">
              <Image
                src="/logo.jpg"
                alt="PinkSurfing"
                width={44}
                height={44}
                className="h-11 w-11 rounded-xl object-cover ring-2 ring-white/10"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight leading-tight">
                  PinkSurfing
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">
                  Vendor Portal
                </span>
              </div>
            </Link>
          </div>

          <div className="max-w-md">
            <p className="mb-3 inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-violet-300">
              For sellers &amp; merchants
            </p>
            <h2 className="text-3xl xl:text-4xl font-bold leading-tight mb-4">
              Run your store on PinkSurfing
            </h2>
            <p className="text-white/60 text-base leading-relaxed">
              Manage listings, orders, and payouts — separate from the buyer
              marketplace, built for vendors.
            </p>
          </div>

          <ul className="space-y-4 max-w-md">
            {features.map(({ icon: Icon, title: featureTitle, description }) => (
              <li key={featureTitle} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-violet-300">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-sm">{featureTitle}</p>
                  <p className="text-sm text-white/50">{description}</p>
                </div>
              </li>
            ))}
          </ul>

          <a
            href={storefrontUrl}
            className="text-sm text-white/45 hover:text-white/70 transition-colors w-fit"
          >
            ← Back to marketplace (shop as a buyer)
          </a>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-10 overflow-y-auto">
        <div className="fixed inset-0 pointer-events-none lg:hidden">
          <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`relative w-full ${wide ? "max-w-2xl" : "max-w-md"}`}
        >
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/logo.jpg"
                alt="PinkSurfing"
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl object-cover"
              />
              <div>
                <span className="text-lg font-bold text-slate-900 dark:text-white block leading-tight">
                  PinkSurfing
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                  Vendor Portal
                </span>
              </div>
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-xl shadow-slate-200/50 dark:border-dark-border dark:bg-dark-card dark:shadow-none">
            <div className="mb-2">
              <span className="inline-flex lg:hidden items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
                Vendor account
              </span>
            </div>
            <div className="mb-7">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-slate-500 dark:text-surface-400 text-sm sm:text-base">
                  {subtitle}
                </p>
              )}
            </div>

            {children}

            {footer && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-dark-border text-center text-sm text-slate-500 dark:text-surface-400">
                {footer}
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400 dark:text-surface-500">
            © {new Date().getFullYear()} PinkSurfing Vendor Portal
          </p>
        </motion.div>
      </div>
    </div>
  );
}
