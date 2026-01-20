"use client";
import { useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MyContext } from "@/app/providers/context";
import { getVendorProfile } from "@/api/products";
import { logout as logoutAPI } from "@/api/account";
import { deleteCookie, getCookie } from "@/utils/cookies";
import { 
  FiUser, 
  FiSettings, 
  FiLogOut, 
  FiChevronDown, 
  FiExternalLink,
  FiCopy,
  FiCheck,
  FiPackage,
  FiShoppingCart
} from "react-icons/fi";

interface DropdownUserProps {
  setLogged: (logged: boolean) => void;
  profile?: any;
}

const DropdownUser = ({ setLogged, profile }: DropdownUserProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { setIsLoggedIn } = useContext(MyContext);
  const router = useRouter();
  const trigger = useRef<HTMLButtonElement>(null);
  const dropdown = useRef<HTMLDivElement>(null);

  const tokenFromLocalStorage =
    typeof window !== "undefined" ? getCookie("access_token") : null;
  const [token, setToken] = useState(tokenFromLocalStorage);

  const [user, setUser] = useState({
    contact_person_name: "",
    store_name: "",
    profile_picture: "",
    slug: "",
    store_image: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await getVendorProfile(token);
        if (!error) {
          const storedData = localStorage.getItem("store");
          if (!storedData) {
            localStorage.setItem("store", JSON.stringify(data));
          }
          setUser({
            contact_person_name: data.contact_person_name || "",
            store_name: data.store_name || "",
            profile_picture: data.profile_picture || "",
            slug: data.slug || "",
            store_image: data.store_image || "",
          });
        } else {
          console.error("Error fetching profile:", error);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    };

    fetchProfile();
  }, [token]);

  const signout = async () => {
    if (typeof window !== "undefined") {
      const token = getCookie("access_token");

      if (token) {
        try {
          await logoutAPI(token);
          console.log("Successfully logged out from server");
        } catch (error) {
          console.error("Error logging out from server:", error);
        }
      }

      localStorage.removeItem("access");
      localStorage.removeItem("vendor_id");
      localStorage.removeItem("store");
      localStorage.removeItem("refresh");

      const domain = window.location.hostname.includes("localhost")
        ? undefined
        : ".pinksurfing.com";

      deleteCookie("access_token", domain);
      deleteCookie("refresh_token", domain);
      deleteCookie("user_id", domain);
    }

    setIsLoggedIn(false);
    setLogged(false);
    window.location.href = "/";
  };

  // Close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!dropdown.current) return;
      if (
        !dropdownOpen ||
        dropdown.current.contains(target as Node) ||
        trigger.current?.contains(target as Node)
      )
        return;
      setDropdownOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // Close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!dropdownOpen || keyCode !== 27) return;
      setDropdownOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  const menuItems = [
    {
      icon: FiUser,
      label: "My Profile",
      href: "/profile",
      description: "View your vendor profile",
    },
    {
      icon: FiSettings,
      label: "Store Settings",
      href: "/settings",
      description: "Manage your store",
    },
  ];

  return (
    <div className="relative">
      {/* Trigger Button */}
      <motion.button
        ref={trigger}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-3 p-1.5 pl-4 rounded-full bg-surface-100 dark:bg-dark-surface hover:bg-surface-200 dark:hover:bg-dark-hover transition-colors"
      >
        {/* User Info - Desktop */}
        <div className="hidden lg:block text-right">
          <p className="text-sm font-semibold text-surface-900 dark:text-white line-clamp-1">
            {user.store_name || "Store Name"}
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400 line-clamp-1">
            {user.contact_person_name || "Vendor"}
          </p>
        </div>

        {/* Avatar */}
        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-dark-border shadow-sm">
          <Image
            width={40}
            height={40}
            src={user.store_image || user.profile_picture || "/images/user/ic_dummy_user.png"}
            className="w-full h-full object-cover"
            alt="User"
          />
          {/* Online indicator */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white dark:border-dark-surface" />
        </div>

        {/* Arrow */}
        <motion.div
          animate={{ rotate: dropdownOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FiChevronDown className="w-4 h-4 text-surface-500 dark:text-surface-400" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            ref={dropdown}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-72 rounded-2xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-premium-lg overflow-hidden z-50"
          >
            {/* User Header */}
            <div className="p-4 border-b border-light-border dark:border-dark-border bg-surface-50/50 dark:bg-dark-surface/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-surface-200 dark:border-dark-border shadow-sm">
                  <Image
                    width={48}
                    height={48}
                    src={user.store_image || user.profile_picture || "/images/user/ic_dummy_user.png"}
                    className="w-full h-full object-cover"
                    alt="User"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-surface-900 dark:text-white truncate">
                    {user.store_name || "Store Name"}
                  </p>
                  <p className="text-xs font-medium text-surface-500 dark:text-surface-400 truncate">
                    {user.contact_person_name || "Vendor"}
                  </p>
                </div>
              </div>

              {/* Store Link - Interactive Pill */}
              {user.slug && (
                <div className="mt-4">
                  <div className="group relative flex items-center justify-between p-2 pl-3 rounded-xl bg-white dark:bg-dark-card border border-surface-200 dark:border-dark-border hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-all shadow-sm">
                    {/* Link Text */}
                     <a
                      href={`https://pinksurfing.com/store/${user.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 mr-2"
                    >
                      <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider mb-0.5">
                        Your Store Link
                      </p>
                      <p className="text-xs font-medium text-primary-600 dark:text-primary-400 truncate hover:underline decoration-primary-500/30 underline-offset-2">
                        pinksurfing.com/store/{user.slug}
                      </p>
                    </a>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigator.clipboard.writeText(
                            `https://pinksurfing.com/store/${user.slug}`
                          );
                          setCopied(true);
                          setTimeout(() => setCopied(false), 3000);
                        }}
                        className="p-1.5 rounded-lg text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
                        title={copied ? "Copied!" : "Copy link"}
                      >
                        {copied ? (
                          <FiCheck className="w-3.5 h-3.5" />
                        ) : (
                          <FiCopy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={`https://pinksurfing.com/store/${user.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
                        title="Visit store"
                      >
                        <FiExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="p-2">
              {menuItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-50 dark:hover:bg-dark-hover transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-surface-100 dark:bg-dark-surface flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-500/20 transition-colors">
                    <item.icon className="w-4 h-4 text-surface-500 dark:text-surface-400 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-white">
                      {item.label}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                      {item.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-light-border dark:bg-dark-border mx-4" />

            {/* Sign Out */}
            <div className="p-2">
              <button
                onClick={signout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-danger-light dark:hover:bg-danger/10 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-surface-100 dark:bg-dark-surface flex items-center justify-center group-hover:bg-danger-light dark:group-hover:bg-danger/20 transition-colors">
                  <FiLogOut className="w-4 h-4 text-surface-500 dark:text-surface-400 group-hover:text-danger transition-colors" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-surface-900 dark:text-white group-hover:text-danger transition-colors">
                    Sign Out
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    End your session
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DropdownUser;
