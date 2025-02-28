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
  const checkLoginState = () => {
    let access = localStorage.getItem("access");
    let vendor_id = localStorage.getItem("vendor_id");
    if (access && vendor_id) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  };
  useEffect(() => {
    checkLoginState();
  }, [pathname]);

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

  useMemo(() => {
    if (typeof window !== "undefined") {
      let token = localStorage.getItem("access");
      if (!token) return;
      (async () => {
        const res = await getTopSellingProducts(token);
        if(res.error){
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
