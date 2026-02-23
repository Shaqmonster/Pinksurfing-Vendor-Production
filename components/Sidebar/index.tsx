"use client";
import React, { useEffect, useRef, useState, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { MyContext } from "@/app/providers/context";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaBox,
  FaClipboardList,
  FaCog,
  FaPlus,
  FaTachometerAlt,
  FaUser,
  FaChevronRight,
  FaStore,
  FaGavel,
} from "react-icons/fa";
import { HiOutlineSparkles } from "react-icons/hi";

const Sidebar = () => {
  const pathname = usePathname();
  const { loggedIn, sidebarOpen, setSidebarOpen } = useContext(MyContext);

  const trigger = useRef(null);
  const sidebar = useRef(null);

  let storedSidebarExpanded = "true";
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === "true"
  );

  // Close on click outside
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
  }, [sidebarOpen]);

  // Close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: { keyCode: number }) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [sidebarOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-expanded", sidebarExpanded.toString());
      if (sidebarExpanded) {
        document.querySelector("body")?.classList.add("sidebar-expanded");
      } else {
        document.querySelector("body")?.classList.remove("sidebar-expanded");
      }
    }
  }, [sidebarExpanded]);

  const menuItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: FaTachometerAlt,
      badge: null,
    },
    {
      name: "Products",
      href: "/inventory/products",
      icon: FaBox,
      badge: null,
    },
    {
      name: "Add Products",
      href: "/inventory/add_products",
      icon: FaPlus,
      badge:null,
    },
    {
      name: "Orders",
      href: "/orders",
      icon: FaClipboardList,
      badge: null,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: FaUser,
      badge: null,
    },
    {
      name: "Buyer Requests",
      href: "/buyer-requests",
      icon: FaGavel,
      badge: null,
    },
    {
      name: "Store Settings",
      href: "/settings",
      icon: FaCog,
      badge: null,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname.includes("dashboard");
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return loggedIn || !pathname.includes("/auth/signUp") ? (
    <motion.aside
      ref={sidebar}
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`fixed lg:relative inset-y-0 left-0 z-50 flex h-screen w-72 flex-col overflow-hidden
        bg-white dark:bg-dark-card
        border-r border-light-border dark:border-dark-border
        shadow-premium-lg lg:shadow-none
        transition-transform duration-300 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      {/* Decorative Gradient Orb */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-pink opacity-10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
      
      {/* Sidebar Header */}
      <div className="flex items-center justify-between gap-2 px-6 py-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 group"
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
            <span className="text-lg font-bold text-surface-900 dark:text-white group-hover:text-primary-500 transition-colors">
              PinkSurfing
            </span>
            <span className="text-xs text-surface-500 dark:text-surface-400">
              Vendor Portal
            </span>
          </div>
        </Link>

        {/* Toggle button only for small screens */}
        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          className="block lg:hidden p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-dark-hover transition-colors"
        >
          <FaArrowLeft className="w-5 h-5 text-surface-600 dark:text-surface-400" />
        </button>
      </div>

      {/* Navigation */}
      <div className="no-scrollbar flex flex-col overflow-y-auto flex-1 px-4 pb-4">
        {/* Main Menu */}
        <nav className="mt-2">
          <p className="px-4 mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
            Main Menu
          </p>
          <ul className="flex flex-col gap-1">
            {menuItems.map((item, index) => {
              const active = isActive(item.href);
              return (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                      ${
                        active
                          ? "bg-gradient-pink text-white shadow-glow-pink"
                          : "text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-dark-hover hover:text-primary-500 dark:hover:text-primary-400"
                      }`}
                  >
                    <item.icon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        active ? "" : "group-hover:scale-110"
                      }`}
                    />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-accent-emerald/20 text-accent-emerald">
                        {item.badge}
                      </span>
                    )}
                    {active && (
                      <FaChevronRight className="w-3 h-3 opacity-60" />
                    )}
                    
                    {/* Active indicator line */}
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />


      </div>
    </motion.aside>
  ) : (
    <></>
  );
};

export default Sidebar;
