"use client";
import Link from "next/link";
import DarkModeSwitcher from "./DarkModeSwitcher";
import DropdownUser from "./DropdownUser";
import Image from "next/image";
import { MyContext } from "@/app/providers/context";
import { usePathname } from "next/navigation";
import { getProfile, refreshToken } from "@/api/account";
import { useContext, useEffect, useMemo, useState } from "react";
import { getProducts } from "@/api/products";
import { useRouter } from "next/navigation";
import { FiMenu, FiSearch, FiBell, FiMessageSquare } from "react-icons/fi";
import { FaStore } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../Sidebar";
import { getCookie } from "@/utils/cookies";

const Header = (props: { loggedIn: boolean | undefined }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { setAuthpage, authPage, vendor, setSidebarOpen, sidebarOpen } =
    useContext(MyContext);
  const [profile, setProfile] = useState<any>();
  const [Logged, setLogged] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tokens, setTokens] = useState({
    access: "" || null,
    vendor_id: "" || null,
    refresh: "" || null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const access = getCookie("access_token");
    const isPublicRoute =
      pathname === "/" || pathname.startsWith("/auth");

    if (isPublicRoute) {
      setLogged(false);
      return;
    }

    if (!access) {
      if (!props.loggedIn) {
        router.push("/");
      }
      setLogged(false);
      return;
    }

    let vendor_id = localStorage.getItem("vendor_id");

    const syncSession = async () => {
      if (!vendor_id) {
        const profileRes = await getProfile(access);
        if (profileRes.ok && profileRes.data?.id) {
          vendor_id = String(profileRes.data.id);
          localStorage.setItem("vendor_id", vendor_id);
        }
      }

      if (!vendor_id) {
        if (!props.loggedIn) {
          router.push("/");
        }
        setLogged(false);
        return;
      }

      setLogged(true);
      setTokens({ access, vendor_id, refresh: getCookie("refresh_token") });
    };

    void syncSession();
  }, [pathname, router, props.loggedIn]);

  useMemo(() => {
    if (!tokens.access) return;

    getProfile(tokens.access).then(async (profileRes) => {
      if (profileRes.ok && profileRes.data) {
        setProfile(profileRes.data);
        return;
      }

      if (profileRes.status === 401 || profileRes.status === 403) {
        if (props.loggedIn) return;
        const refresh = getCookie("refresh_token");
        if (!refresh) {
          setLogged(false);
          router.push("/");
          return;
        }
        try {
          const token = await refreshToken(String(tokens.access), refresh);
          if (token?.access) {
            localStorage.setItem("access", token.access);
            setTokens((prev) => ({ ...prev, access: token.access }));
            setLogged(true);
          }
        } catch {
          setLogged(false);
          router.push("/");
        }
      }
    });
  }, [tokens.access, tokens.vendor_id, router]);

  // Get page title based on current route
  const getPageTitle = () => {
    if (pathname.includes("dashboard")) return "Dashboard";
    if (pathname.includes("products")) return "Listings";
    if (pathname.includes("add_products")) return "Add Listing";
    if (pathname.includes("orders")) return "Orders";
    if (pathname.includes("profile")) return "Profile";
    if (pathname.includes("settings")) return "Store Settings";
    return "Welcome";
  };

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-40 w-full"
      >
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-xl border-b border-light-border dark:border-dark-border" />
        
        <div className="relative flex items-center justify-between px-4 py-3 md:px-6 lg:px-8">
          {/* Left Section */}
          {Logged ? (
            <>
              <div className="flex items-center gap-4">
                {/* Mobile Menu Toggle */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-controls="sidebar"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSidebarOpen(!sidebarOpen);
                  }}
                  className="flex lg:hidden items-center justify-center w-10 h-10 rounded-xl bg-surface-100 dark:bg-dark-surface hover:bg-surface-200 dark:hover:bg-dark-hover transition-colors"
                >
                  <FiMenu className="w-5 h-5 text-surface-700 dark:text-surface-300" />
                </motion.button>

                {/* Logo for mobile */}
                <Link href="/dashboard" className="flex lg:hidden items-center gap-2">
                   <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                    <Image 
                      src="/logo.jpg" 
                      alt="Logo" 
                      width={32} 
                      height={32} 
                      className="w-full h-full object-contain p-0.5"
                    />
                  </div>
                </Link>

                {/* Page Title & Breadcrumb */}
                <div className="hidden md:block">
                  <h1 className="text-xl font-bold text-surface-900 dark:text-white">
                    {getPageTitle()}
                  </h1>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {profile?.store_name ? `Welcome back, ${profile.contact_person_name || profile.store_name}` : "Manage your store"}
                  </p>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-2 md:gap-4">

                {/* Dark Mode Toggle */}
                <DarkModeSwitcher />

                {/* User Dropdown */}
                {Logged && <DropdownUser setLogged={setLogged} profile={profile} />}
              </div>
            </>
          ) : (
            /* Auth Header */
            <div className="flex w-full items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                   <Image 
                      src="/logo.jpg" 
                      alt="Logo" 
                      width={40} 
                      height={40} 
                      className="w-full h-full object-contain p-1"
                    />
                </div>
                <span className="text-xl font-bold text-surface-900 dark:text-white">
                  PinkSurfing
                </span>
              </Link>
              
              <div className="flex items-center gap-4">
                <DarkModeSwitcher />
                {authPage === "signin" ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setAuthpage("signup")}
                    className="btn-gradient px-5 py-2.5 text-sm"
                  >
                    Sign Up
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setAuthpage("signin")}
                    className="btn-outline px-5 py-2.5 text-sm"
                  >
                    Sign In
                  </motion.button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.header>
    </>
  );
};

export default Header;
