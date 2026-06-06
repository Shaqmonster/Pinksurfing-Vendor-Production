"use client";
import "./globals.css";
import "./data-tables-css.css";
import "./satoshi.css";
import "@/utils/setupVendorAxios";
import { useEffect, useContext } from "react";
import Loader from "@/components/common/Loader";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MyProvider from "./providers/ContextProvider";
import { MyContext } from "./providers/context";
import ChunkLoadRecovery from "@/components/ChunkLoadRecovery";
import { redirect, usePathname } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loggedIn, sidebarOpen, setSidebarOpen, authReady } = useContext(MyContext);

  useEffect(() => {
    if (loggedIn && pathname.includes("/auth/signup")) {
      redirect("/Stripe");
    }
  }, [loggedIn, pathname]);

  useEffect(() => {
    if (window.innerWidth >= 1024) setSidebarOpen(true);
  }, [setSidebarOpen]);

  if (!authReady) return <Loader />;

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg transition-colors duration-300">
      <div className="flex h-screen overflow-hidden">
        {loggedIn && (
          <div className="hidden lg:block">
            <Sidebar />
          </div>
        )}
        {loggedIn && sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {loggedIn && (
          <div
            className={`lg:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-out ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar />
          </div>
        )}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <Header loggedIn={loggedIn} />
          <main className="flex-1">
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-8">
              <div className="animate-fadeIn">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>PinkSurfing - Vendor Dashboard</title>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body suppressHydrationWarning className="antialiased">
        <MyProvider>
          <ChunkLoadRecovery />
          <AppShell>{children}</AppShell>
        </MyProvider>
        <ToastContainer position="top-right" autoClose={4000} theme="colored" />
      </body>
    </html>
  );
}
