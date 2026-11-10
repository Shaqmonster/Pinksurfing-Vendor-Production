"use client";
import "./globals.css";
import "./data-tables-css.css";
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
import { PS_MOTION } from "@/lib/motion-tokens";

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loggedIn, sidebarOpen, setSidebarOpen, authReady } = useContext(MyContext);
  const isGoogleComplete = pathname === "/auth/google/complete";
  const isAuthRoute =
    isGoogleComplete ||
    pathname.startsWith("/auth") ||
    (pathname === "/" && !loggedIn);

  useEffect(() => {
    if (loggedIn && pathname.includes("/auth/signup")) {
      redirect("/Stripe");
    }
  }, [loggedIn, pathname]);

  useEffect(() => {
    if (window.innerWidth >= 1024) setSidebarOpen(true);
  }, [setSidebarOpen]);

  // Authenticated app: noindex. Public auth/marketing: indexable.
  useEffect(() => {
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute(
      "content",
      loggedIn ? "noindex, nofollow" : "index, follow"
    );
  }, [loggedIn]);

  if (!authReady) return <Loader />;

  if (isAuthRoute) {
    return <>{children}</>;
  }

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
            aria-hidden="true"
          />
        )}
        {loggedIn && (
          <div
            className={`lg:hidden fixed inset-y-0 left-0 z-50 transform transition-transform ease-out safe-pad-top ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{ transitionDuration: `${PS_MOTION.duration.moderate * 1000}ms` }}
          >
            <Sidebar />
          </div>
        )}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {!isGoogleComplete && <Header loggedIn={loggedIn} />}
          {isGoogleComplete ? (
            children
          ) : (
            <main className="flex-1">
              <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-8 safe-pad-x">
                <div className="animate-fadeIn">{children}</div>
              </div>
            </main>
          )}
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
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0e0f13" />
        <title>PinkSurfing Vendor Portal</title>
        <meta
          name="description"
          content="Sign in to the PinkSurfing Vendor Portal to manage listings, orders, and payouts for your store."
        />
        <meta
          name="keywords"
          content="PinkSurfing, vendor portal, seller dashboard, marketplace seller"
        />
        <meta property="og:title" content="PinkSurfing Vendor Portal" />
        <meta
          property="og:description"
          content="Manage listings, orders, and payouts for your PinkSurfing store."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="robots" content="index, follow" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body suppressHydrationWarning className="font-jakarta antialiased">
        <MyProvider>
          <ChunkLoadRecovery />
          <AppShell>{children}</AppShell>
        </MyProvider>
        <ToastContainer
          position="top-right"
          autoClose={4000}
          theme="dark"
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable={false}
        />
      </body>
    </html>
  );
}
