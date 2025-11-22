"use client";
import "./globals.css";
import "./data-tables-css.css";
import "./satoshi.css";
import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import Loader from "@/components/common/Loader";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

import MyProvider from "./providers/ContextProvider";
import { MyContext } from "./providers/context";
import SignIn from "./auth/signin/page";
import { redirect, usePathname } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getTopSellingProducts } from "@/api/products";
import { getCookie } from "@/utils/cookies";
import { getProfile, isVendor } from "@/api/account";

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useContext(MyContext);
  const bodyScrollCallback = useCallback((loggedIn: boolean) => {
    console.log(loggedIn);
    setLoggedIn(loggedIn);
  }, []);
  const checkLoginState = async () => {
    console.log("Checking login state...");
    let access = getCookie("access_token");
    const cookieRefresh = getCookie("refresh_token");

    if (access) {
      // Store cookie values in localStorage for future use
      localStorage.setItem("access", access);
      if (cookieRefresh) {
        localStorage.setItem("refresh", cookieRefresh);
      }
      //storing hardcoded vendor_id for testing SSO
      console.log("SSO: Tokens found in cookies, stored in localStorage");
    }

    if (!access) {
      //clearing localstorage because of the following case(loggout out from ecommerce site but still have localstorage values of access and refresh tokens)
      localStorage.clear();
      setLoggedIn(false);
      return;
    }

    const vendor_access = await isVendor(access);
    if (access && vendor_access.success) {
      const vendor = await getProfile(access);
      localStorage.setItem("vendor_id", vendor.data.id);
      console.log("Vendor profile:", vendor);
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  };
  useEffect(() => {
    checkLoginState();
  }, []);

  useEffect(() => {
    let access: string | null = "",
      vendor_id: string | null = "";
    if (typeof window !== "undefined") {
      access = getCookie("access_token");
      vendor_id = localStorage.getItem("vendor_id");
      if (!access) {
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

  useMemo(() => {
    if (typeof window !== "undefined") {
      let token = getCookie("access_token");
      if (!token) return;
      (async () => {
        const res = await getTopSellingProducts(token);
        if (res.error) {
          setLoggedIn(false);
        }
      })();
    }
  }, []);

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
                {loggedIn && <div>{loggedIn && <Sidebar />}</div>}

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
