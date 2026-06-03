"use client";
import { useState, useEffect, useCallback } from "react";
import { MyContext } from "./context";
import { ensureSession, resolveVendorSession } from "@/api/account";

const MyProvider = ({ children }: { children: React.ReactNode }) => {
  const [loggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authPage, setAuthpage] = useState("signin");
  const [resetEmail, setResetEmail] = useState("");
  const [vendor, setVendor] = useState<any>();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const refreshAuth = useCallback(async () => {
    const session = await ensureSession();
    const access = session?.access ?? null;

    if (!access) {
      setIsLoggedIn(false);
      return false;
    }

    const vendorSession = await resolveVendorSession(access);
    if (vendorSession.unauthorized) {
      setIsLoggedIn(false);
      return false;
    }

    const vendorId =
      vendorSession.profile?.id ??
      vendorSession.profile?.pk ??
      null;

    if (vendorSession.isVendor && vendorId) {
      localStorage.setItem("vendor_id", String(vendorId));
      setIsLoggedIn(true);
      return true;
    }

    localStorage.removeItem("vendor_id");
    setIsLoggedIn(false);
    return false;
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshAuth();
      setAuthReady(true);
    })();
  }, [refreshAuth]);

  return (
    <MyContext.Provider
      value={{
        loggedIn,
        setIsLoggedIn,
        resetEmail,
        setResetEmail,
        setAuthpage,
        authPage,
        vendor,
        setVendor,
        sidebarOpen,
        setSidebarOpen,
        refreshAuth,
        authReady,
      }}
    >
      {children}
    </MyContext.Provider>
  );
};

export default MyProvider;
