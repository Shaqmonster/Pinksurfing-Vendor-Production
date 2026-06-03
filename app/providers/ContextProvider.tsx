"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { MyContext } from "./context";
import {
  attachSharedSsoSync,
  ensureSession,
  isSsoLoggedOutGlobally,
  reconcileSharedSession,
} from "@/utils/ssoSession";
import { resolveVendorSession } from "@/api/account";

const MyProvider = ({ children }: { children: React.ReactNode }) => {
  const [loggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authPage, setAuthpage] = useState("signin");
  const [resetEmail, setResetEmail] = useState("");
  const [vendor, setVendor] = useState<any>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const ssoSyncInflightRef = useRef(false);

  const applyVendorSession = useCallback(async (access: string | null) => {
    if (!access) {
      localStorage.removeItem("vendor_id");
      setIsLoggedIn(false);
      return false;
    }

    const vendorSession = await resolveVendorSession(access);
    if (vendorSession.unauthorized) {
      localStorage.removeItem("vendor_id");
      setIsLoggedIn(false);
      return false;
    }

    const vendorId =
      vendorSession.profile?.id ?? vendorSession.profile?.pk ?? null;

    if (vendorSession.isVendor && vendorId) {
      localStorage.setItem("vendor_id", String(vendorId));
      setIsLoggedIn(true);
      return true;
    }

    localStorage.removeItem("vendor_id");
    setIsLoggedIn(false);
    return false;
  }, []);

  const refreshAuth = useCallback(async () => {
    const session = await ensureSession();
    return applyVendorSession(session?.access ?? null);
  }, [applyVendorSession]);

  const syncFromSharedSession = useCallback(async () => {
    if (ssoSyncInflightRef.current) return;
    ssoSyncInflightRef.current = true;
    try {
      if (isSsoLoggedOutGlobally()) {
        if (loggedIn) {
          localStorage.removeItem("vendor_id");
          setIsLoggedIn(false);
        }
        return;
      }

      const session = await reconcileSharedSession();
      await applyVendorSession(session?.access ?? null);
    } finally {
      ssoSyncInflightRef.current = false;
    }
  }, [applyVendorSession, loggedIn]);

  useEffect(() => {
    void (async () => {
      await refreshAuth();
      setAuthReady(true);
    })();
  }, [refreshAuth]);

  useEffect(() => {
    if (!authReady) return undefined;
    return attachSharedSsoSync(() => {
      void syncFromSharedSession();
    });
  }, [authReady, syncFromSharedSession]);

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
