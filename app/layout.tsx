"use client";
import "./globals.css";
import "./data-tables-css.css";
import "./satoshi.css";
import { useState, useEffect, useContext, useCallback } from "react";
import Loader from "@/components/common/Loader";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

import MyProvider from "./providers/ContextProvider";
import { MyContext } from "./providers/context";
import SignIn from "./auth/signin/page";
import { redirect, usePathname } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const pathname = usePathname();
  const { sidebarOpen ,setSidebarOpen} = useContext(MyContext);
  const bodyScrollCallback = useCallback((loggedIn: boolean) => {
    setLoggedIn(loggedIn);
  }, []);

  useEffect(() => {
    let access: string | null = "",
      vendor_id: string | null = "";
    if (typeof window !== "undefined") {
      access = localStorage.getItem("access");
      vendor_id = localStorage.getItem("vendor_id");
      if (!access || !vendor_id) {
        setLoggedIn(false);
      }
    }
  }, []);

  useEffect(() => {
    loggedIn && pathname.includes("/auth/signup") ? redirect("/Stripe") : null;
  });

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, [setSidebarOpen]);

  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <MyProvider setLoggedIn={bodyScrollCallback}>
          <div className="dark:bg-boxdark-2 dark:text-bodydark">
            {loading ? (
              <Loader />
            ) : (
              <div className="flex h-screen overflow-hidden">
                {/* <!-- ===== Sidebar Start ===== --> */}
                <div
                  // className={`hidden lg:flex ${
                  //   sidebarOpen ? "flex" : "hidden"
                  // }`}
                >
                  {loggedIn ? <Sidebar /> : null}

                  {/* <!-- ===== Sidebar End ===== --> */}
                </div>

                {/* <!-- ===== Content Area Start ===== --> */}
                <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                  {/* <!-- ===== Header Start ===== --> */}
                  <Header loggedIn={loggedIn} />
                  {/* <!-- ===== Header End ===== --> */}

                  {/* <!-- ===== Main Content Start ===== --> */}
                  <main>
                    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                      {children}
                    </div>
                  </main>
                  {/* <!-- ===== Main Content End ===== --> */}
                </div>
                {/* <!-- ===== Content Area End ===== --> */}
              </div>
            )}
          </div>
        </MyProvider>
        <ToastContainer />
      </body>
    </html>
  );
}
