import React, { useEffect, useRef, useState, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { MyContext } from "@/app/providers/context";
import {
  FaArrowLeft,
  FaBox,
  FaClipboardList,
  FaCog,
  FaPlus,
  FaTachometerAlt,
  FaUser,
} from "react-icons/fa";

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
    const clickHandler = ({ target }) => {
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
  }, [sidebarOpen]);

  // Close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }) => {
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

  return loggedIn || !pathname.includes("/auth/signUp") ? (
    <aside
      ref={sidebar}
      className={`fixed inset-y-0 left-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-white duration-300 ease-linear dark:bg-gradient-to-r from-slate-950 to-black lg:w-72.5 lg:translate-x-0 lg:relative ${
        sidebarOpen == true
          ? "translate-x-0"
          : "-translate-x-full lg:translate-x-0"
      }`}
    >
      {/* <!-- SIDEBAR HEADER --> */}
      <div className="flex items-center justify-between gap-2 px-6 py-2 pt-5.5 lg:py-2.5 lg:pt-6.5">
        <Link
          href="/"
          className="normal-case text-xl flex flex-row items-center font-bold text-black dark:text-white"
        >
          <Image
            src="/images/bitcoin.jpg"
            alt=""
            height={40}
            width={40}
            className="mx-4"
          />
          PinkSurfing
        </Link>

        {/* Toggle button only for small screens */}
        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          className="block lg:hidden"
        >
          <FaArrowLeft size={20} />
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
                    pathname.includes("orders") ? "bg-gray dark:bg-primary" : ""
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
                  <FaCog className="fill-current" size={18} />
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
