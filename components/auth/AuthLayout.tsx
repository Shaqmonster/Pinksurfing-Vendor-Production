"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { FiBarChart2, FiPackage, FiShoppingBag } from "react-icons/fi";
import { getStorefrontUrl } from "@/utils/storefrontUrl";
import { PS_MOTION } from "@/lib/motion-tokens";

const features = [
  {
    icon: FiShoppingBag,
    title: "Your storefront",
    description: "List products and business listings in one dashboard.",
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
  const reduced = useReducedMotion();

  return (
    <div className="min-h-screen flex bg-light-bg dark:bg-dark-bg">
      <div className="hidden lg:flex lg:w-[46%] xl:w-[50%] relative overflow-hidden bg-[#0e0f13] text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl opacity-30"
            style={{ background: "var(--ps-primary)" }}
          />
          <div
            className="absolute top-1/3 -right-20 h-80 w-80 rounded-full blur-3xl opacity-20"
            style={{ background: "var(--ps-cyan)" }}
          />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 w-fit min-h-[44px]">
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
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-300">
                  Vendor Portal
                </span>
              </div>
            </Link>
          </div>

          <div className="max-w-md">
            <p className="mb-3 inline-flex items-center rounded-lg border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-300">
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
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-primary-300">
                  <Icon className="h-4 w-4" aria-hidden />
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
            className="text-sm text-white/45 hover:text-white/70 transition-colors w-fit min-h-[44px] inline-flex items-center"
          >
            ← Back to marketplace (shop as a buyer)
          </a>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-10 overflow-y-auto safe-pad-x">
        <div className="fixed inset-0 pointer-events-none lg:hidden">
          <div
            className="absolute -top-24 right-0 h-64 w-64 rounded-full blur-3xl opacity-15"
            style={{ background: "var(--ps-primary)" }}
          />
        </div>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: PS_MOTION.duration.normal,
            ease: PS_MOTION.easing.enter,
          }}
          className={`relative w-full ${wide ? "max-w-2xl" : "max-w-md"}`}
        >
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link href="/" className="inline-flex items-center gap-3 min-h-[44px]">
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
                <span className="text-[9px] font-bold uppercase tracking-widest text-primary-500 dark:text-primary-300">
                  Vendor Portal
                </span>
              </div>
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-premium-md dark:border-dark-border dark:bg-dark-card dark:shadow-none">
            <div className="mb-2">
              <span className="inline-flex lg:hidden items-center rounded-lg border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300">
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
