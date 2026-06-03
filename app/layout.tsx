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
import { getCookie } from "@/utils/cookies";
import { resolveVendorSession } from "@/api/account";

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
    const access = getCookie("access_token");
    const cookieRefresh = getCookie("refresh_token");

    if (!access) {
      localStorage.clear();
      setLoggedIn(false);
      return;
    }

    localStorage.setItem("access", access);
    if (cookieRefresh) {
      localStorage.setItem("refresh", cookieRefresh);
    }

    const session = await resolveVendorSession(access);
    if (session.unauthorized) {
      localStorage.clear();
      setLoggedIn(false);
      return;
    }
    if (session.isVendor && session.profile?.id) {
      setLoggedIn(true);
      return;
    }

    localStorage.removeItem("vendor_id");
    setLoggedIn(false);
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

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="PinkSurfing Vendor Dashboard - Manage your store, products, and orders with our premium vendor management system." />
        <meta name="theme-color" content="#E91E63" />
        <title>PinkSurfing - Vendor Dashboard</title>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body suppressHydrationWarning={true} className="antialiased">
        <MyProvider setLoggedIn={bodyScrollCallback}>
          {/* Main Container */}
          <div className="min-h-screen bg-light-bg dark:bg-dark-bg transition-colors duration-300">
            {loading ? (
              <Loader />
            ) : (
              <div className="flex h-screen overflow-hidden">
                {/* Sidebar */}
                {loggedIn && (
                  <div className="hidden lg:block">
                    <Sidebar />
                  </div>
                )}
                
                {/* Mobile Sidebar Overlay */}
                {loggedIn && sidebarOpen && (
                  <div 
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                  />
                )}
                
                {/* Mobile Sidebar */}
                {loggedIn && (
                  <div className={`lg:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-out ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                  }`}>
                    <Sidebar />
                  </div>
                )}

                {/* Main Content Area */}
                <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                  {/* Header */}
                  <Header loggedIn={loggedIn} />

                  {/* Main Content */}
                  <main className="flex-1">
                    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-8">
                      <div className="animate-fadeIn">
                        {children}
                      </div>
                    </div>
                  </main>
                  
                </div>
              </div>
            )}
          </div>
        </MyProvider>
        
        {/* Toast Container with Premium Styling */}
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          toastClassName="!rounded-xl !shadow-premium-md"
        />
      </body>
    </html>
  );
}
