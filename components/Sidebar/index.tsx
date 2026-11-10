"use client";
import React, { useEffect, useRef, useState, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { MyContext } from "@/app/providers/context";
import { motion, useReducedMotion } from "framer-motion";
import {
  FaArrowLeft,
  FaBox,
  FaClipboardList,
  FaCog,
  FaPlus,
  FaTachometerAlt,
  FaUser,
  FaStore,
  FaCalendarAlt,
  FaFileContract,
  FaHandshake,
  FaUserFriends,
} from "react-icons/fa";
import { getPropertyVisitCount } from "@/api/propertyVisits";
import { getNdaCount } from "@/api/ndaSignatures";
import { getStorefrontUrl } from "@/utils/storefrontUrl";
import { PS_MOTION, staggerDelay } from "@/lib/motion-tokens";

const Sidebar = () => {
  const pathname = usePathname();
  const { loggedIn, sidebarOpen, setSidebarOpen } = useContext(MyContext);
  const reduced = useReducedMotion();

  const trigger = useRef(null);
  const sidebar = useRef(null);

  const [visitRequestCount, setVisitRequestCount] = useState(0);
  const [ndaRequestCount, setNdaRequestCount] = useState(0);

  useEffect(() => {
    if (!loggedIn) {
      setVisitRequestCount(0);
      setNdaRequestCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      const [visits, ndas] = await Promise.all([
        getPropertyVisitCount(),
        getNdaCount(),
      ]);
      if (!cancelled) {
        setVisitRequestCount(visits);
        setNdaRequestCount(ndas);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  useEffect(() => {
    const clickHandler = ({ target }: { target: EventTarget | null }) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        (sidebar.current as HTMLElement).contains(target as Node) ||
        (trigger.current as HTMLElement).contains(target as Node)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  }, [sidebarOpen, setSidebarOpen]);

  useEffect(() => {
    const keyHandler = ({ keyCode }: { keyCode: number }) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [sidebarOpen, setSidebarOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("sidebar-expanded", "true");
    document.querySelector("body")?.classList.add("sidebar-expanded");
  }, []);

  const requestItems = [
    {
      name: "Visit requests",
      href: "/visit-requests",
      icon: FaCalendarAlt,
      count: visitRequestCount,
      show: visitRequestCount > 0,
    },
    {
      name: "Signed NDAs & Leads",
      href: "/nda-requests",
      icon: FaFileContract,
      count: ndaRequestCount,
      show: true,
    },
    {
      name: "Buyer requests",
      href: "/buyer-requests",
      icon: FaUserFriends,
      count: null as number | null,
      show: true,
    },
  ];

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: FaTachometerAlt },
    { name: "Products", href: "/inventory/products", icon: FaBox },
    { name: "Add Listing", href: "/inventory/add_products", icon: FaPlus },
    { name: "Deal Supply", href: "/inventory/deal-supply", icon: FaHandshake },
    { name: "Orders", href: "/orders", icon: FaClipboardList },
    { name: "Profile", href: "/profile", icon: FaUser },
    { name: "Store Settings", href: "/settings", icon: FaCog },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname.includes("dashboard");
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const linkClass = (active: boolean) =>
    `group relative flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-xl font-medium transition-colors
      ${
        active
          ? "sidebar-item-active"
          : "text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-dark-hover hover:text-primary-500 dark:hover:text-primary-300"
      }`;

  if (!(loggedIn || !pathname.includes("/auth/signUp"))) {
    return null;
  }

  return (
    <motion.aside
      ref={sidebar}
      initial={reduced ? false : { x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{
        duration: PS_MOTION.duration.moderate,
        ease: PS_MOTION.easing.enter,
      }}
      className={`fixed lg:relative inset-y-0 left-0 z-50 flex h-screen w-72 flex-col overflow-hidden
        bg-white dark:bg-dark-card
        border-r border-light-border dark:border-dark-border
        shadow-premium-lg lg:shadow-none
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      aria-label="Vendor navigation"
    >
      <div
        className="absolute top-0 right-0 w-40 h-40 opacity-[0.08] blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"
        style={{ background: "var(--ps-blur-orb)" }}
        aria-hidden
      />

      <div className="flex items-center justify-between gap-2 px-6 py-6 safe-pad-top">
        <a
          href={getStorefrontUrl()}
          className="flex items-center gap-3 group min-h-[44px]"
          title="Back to PinkSurfing marketplace"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 overflow-hidden">
            <Image
              src="/logo.jpg"
              alt="PinkSurfing Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain p-1"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-surface-900 dark:text-white group-hover:text-primary-400 transition-colors">
              PinkSurfing
            </span>
            <span className="text-xs text-surface-500 dark:text-surface-400">
              Vendor Portal
            </span>
          </div>
        </a>

        <button
          ref={trigger}
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          className="hit-target flex lg:hidden items-center justify-center rounded-xl hover:bg-surface-100 dark:hover:bg-dark-hover transition-colors"
        >
          <FaArrowLeft className="w-5 h-5 text-surface-600 dark:text-surface-400" />
        </button>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto flex-1 px-4 pb-4">
        <nav className="mt-2">
          {(visitRequestCount > 0 || true) && (
            <>
              <p className="px-4 mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                Requests
              </p>
              <ul className="flex flex-col gap-1 mb-6">
                {requestItems
                  .filter((item) => item.show)
                  .map((item, index) => {
                    const active = isActive(item.href);
                    return (
                      <motion.li
                        key={item.href}
                        initial={reduced ? false : { opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: staggerDelay(index, !!reduced),
                          duration: PS_MOTION.duration.fast,
                        }}
                      >
                        <Link href={item.href} className={linkClass(active)}>
                          {active && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-primary-500 rounded-r-full"
                              transition={PS_MOTION.spring}
                            />
                          )}
                          <item.icon className="w-5 h-5 shrink-0" aria-hidden />
                          <span className="flex-1">{item.name}</span>
                          {typeof item.count === "number" && item.count > 0 ? (
                            <span
                              className={`px-2 py-0.5 text-xs font-bold rounded-lg ${
                                active
                                  ? "bg-primary-500/25 text-primary-200"
                                  : "bg-primary-500/15 text-primary-400"
                              }`}
                            >
                              {item.count}
                            </span>
                          ) : null}
                        </Link>
                      </motion.li>
                    );
                  })}
              </ul>
            </>
          )}

          <p className="px-4 mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
            Main Menu
          </p>
          <ul className="flex flex-col gap-1">
            {menuItems.map((item, index) => {
              const active = isActive(item.href);
              return (
                <motion.li
                  key={item.href}
                  initial={reduced ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: staggerDelay(index, !!reduced),
                    duration: PS_MOTION.duration.fast,
                  }}
                >
                  <Link href={item.href} className={linkClass(active)}>
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-primary-500 rounded-r-full"
                        transition={PS_MOTION.spring}
                      />
                    )}
                    <item.icon className="w-5 h-5 shrink-0" aria-hidden />
                    <span className="flex-1">{item.name}</span>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        <div className="flex-1" />

        <a
          href={getStorefrontUrl()}
          className="mt-4 flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-xl text-sm text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-dark-hover hover:text-primary-400 transition-colors"
        >
          <FaStore className="w-4 h-4" aria-hidden />
          <span>View marketplace</span>
        </a>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
