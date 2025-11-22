"use client";
import "./globals.css";
import "./data-tables-css.css";
import "./satoshi.css";
import { useState, useEffect, useContext, useCallback,useMemo } from "react";
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
import { isVendor } from "@/api/account";

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  // const [loggedIn, setIsLoggedIn] = useState<boolean>(false);
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen,setIsLoggedIn,loggedIn } = useContext(MyContext);
  const bodyScrollCallback = useCallback((loggedIn: boolean) => {
    console.log(loggedIn);
    setIsLoggedIn(loggedIn);
  }, []);
  const checkLoginState = async () => {
    let access = getCookie("access_token");
    let vendor_id = localStorage.getItem("vendor_id");

    console.log("Layout auth check - access:", access ? "found" : "not found");
    
    // If vendor_id not in localStorage but we have access token, get from cookie
    if (access && !vendor_id) {
      const cookieUserId = getCookie("user_id");
      if (cookieUserId) {
        vendor_id = cookieUserId;
        localStorage.setItem("vendor_id", cookieUserId);
        console.log("Layout: Stored user_id from cookie");
      }
    }
    
    // Store access token in localStorage if not already there
    if (access && !localStorage.getItem("access")) {
      localStorage.setItem("access", access);
      console.log("Layout: Stored access token");
    }
    
    const refresh = getCookie("refresh_token");
    if (refresh && !localStorage.getItem("refresh")) {
      localStorage.setItem("refresh", refresh);
      console.log("Layout: Stored refresh token");
    }
    
    if (!access) {
      console.log("Layout: No access token, user not logged in");
      setIsLoggedIn(false);
      return;
    }
    
    console.log("Layout: Checking vendor status...");
    const vendor_access = await isVendor(access);
    console.log("Layout: Vendor check result:", vendor_access);
    
    if (vendor_access.success && vendor_access.isVendor) {
      console.log("Layout: User is verified vendor");
      setIsLoggedIn(true);
    } else {
      console.log("Layout: User is not a vendor");
      setIsLoggedIn(false);
    }
  };
  
  // Only run checkLoginState once on initial mount, not on pathname changes
  useEffect(() => {
    checkLoginState();
  }, []); // Empty dependency array - runs only once

  useEffect(() => {
    let access: string | null = "",
      vendor_id: string | null = "";
    if (typeof window !== "undefined") {
      access = getCookie("access_token");
      vendor_id = localStorage.getItem("vendor_id");
      if (!access || !vendor_id) {
        setIsLoggedIn(false);
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
        if(res.error){
          setIsLoggedIn(false);
        }
      })();
    }
  }, []);

  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <MyProvider setIsLoggedIn={bodyScrollCallback}>
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
