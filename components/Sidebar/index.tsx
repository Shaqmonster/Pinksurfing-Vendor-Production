import React, { useEffect, useRef, useState, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiSettings } from "react-icons/fi";
import Image from "next/image";
import { MyContext } from "@/app/providers/context";
import {
  FaBox,
  FaClipboardList,
  FaPlus,
  FaTachometerAlt,
  FaUser,
} from "react-icons/fa";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();
  const { loggedIn } = useContext(MyContext);

  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  let storedSidebarExpanded = "true";
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === "true"
  );

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

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

  return loggedIn || !pathname.includes("/auth/signUp") ? (
    <aside
      ref={sidebar}
      className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-white duration-300 ease-linear dark:bg-gradient-to-r from-slate-950 to-black lg:static lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* <!-- SIDEBAR HEADER --> */}
      <div className="flex items-center justify-between gap-2 px-6 py-2 pt-5.5 lg:py-2.5 lg:pt-6.5">
        <Link
          href="/"
          className="normal-case text-xl flex flex-row items-center font-bold text-black dark:text-white"
        >
          <Image
            src="/images/bitcoin.png"
            alt=""
            height={40}
            width={40}
            className="mx-4"
          />
          PinkSurfing
        </Link>

        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          className="block lg:hidden"
        >
          <svg
            className="fill-current"
            width="20"
            height="18"
            viewBox="0 0 20 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
              fill=""
            />
          </svg>
        </button>
      </div>
      {/* <!-- SIDEBAR HEADER --> */}

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        {/* <!-- Sidebar Menu --> */}
        <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
          {/* <!-- Menu Group --> */}
          <div>
            <ul className="mb-6 flex flex-col gap-1.5">
              <li>
                <Link
                  href="/dashboard"
                  className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-black duration-300 ease-in-out hover:bg-gray dark:hover:bg-primary dark:text-white ${
                    pathname === "/" || pathname.includes("dashboard")
                      ? "bg-gray dark:bg-primary"
                      : ""
                  }`}
                >
                  <FaTachometerAlt className="fill-current" size={18} />
                  Dashboard
                </Link>
              </li>

              <li>
                <Link
                  href="/inventory/products"
                  className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-black duration-300 ease-in-out hover:bg-gray dark:hover:bg-primary dark:text-white ${
                    pathname === "/inventory/products"
                      ? "bg-gray dark:bg-primary"
                      : ""
                  }`}
                >
                  <FaBox className="fill-current" size={18} />
                  Products
                </Link>
              </li>

              <li>
                <Link
                  href="/inventory/add_products"
                  className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-black duration-300 ease-in-out hover:bg-gray dark:hover:bg-primary dark:text-white ${
                    pathname === "/inventory/add_products"
                      ? "bg-gray dark:bg-primary"
                      : ""
                  }`}
                >
                  <FaPlus className="fill-current" size={18} />
                  Add Products
                </Link>
              </li>

              <li>
                <Link
                  href="/orders"
                  className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-black duration-300 ease-in-out hover:bg-gray dark:hover:bg-primary dark:text-white ${
                    pathname.includes("orders")
                      ? "bg-gray dark:bg-primary"
                      : ""
                  }`}
                >
                  <FaClipboardList className="fill-current" size={18} />
                  Orders
                </Link>
              </li>

              <li>
                <Link
                  href="/profile"
                  className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-black duration-300 ease-in-out hover:bg-gray dark:hover:bg-primary dark:text-white ${
                    pathname.includes("profile")
                      ? "bg-gray dark:bg-primary"
                      : ""
                  }`}
                >
                  <FaUser className="fill-current" size={18} />
                  Profile
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-black duration-300 ease-in-out hover:bg-gray dark:hover:bg-primary dark:text-white ${
                    pathname.includes("settings")
                      ? "bg-gray dark:bg-primary"
                      : ""
                  }`}
                >
                  <FiSettings className="fill-current" size={18} />
                  Settings
                </Link>
              </li>
              {/* <!-- Menu Item Settings --> */}
            </ul>
          </div>

          {/* <!-- Others Group --> */}

          {/* <!-- Menu Item Auth Pages --> */}
        </nav>
        {/* <!-- Sidebar Menu --> */}
      </div>
    </aside>
  ) : (
    <></>
  );
};

export default Sidebar;
