"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { MyContext } from "./context";
import {
  attachSharedSsoSync,
  ensureSession,
  isSsoLoggedOutGlobally,
  reconcileSharedSession,
  startTokenRefreshScheduler,
} from "@/utils/ssoSession";
import { clearAuthStorage } from "@/utils/cookies";
import {
  checkVendorStatus,
  resolveVendorSession,
  storeVendorOnboardingFromJwt,
} from "@/api/account";
import { persistAuthSession } from "@/utils/ssoSession";

const MyProvider = ({ children }: { children: React.ReactNode }) => {
  const [loggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authPage, setAuthpage] = useState("signin");
  const [resetEmail, setResetEmail] = useState("");
  const [vendor, setVendor] = useState<any>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const ssoSyncInflightRef = useRef(false);

  const applyVendorSession = useCallback(async (access: string | null, retried = false) => {
    if (!access) {
      localStorage.removeItem("vendor_id");
      setIsLoggedIn(false);
      return false;
    }

    const vendorSession = await resolveVendorSession(access);
    if (vendorSession.unauthorized) {
      if (!retried) {
        const session = await ensureSession();
        if (session?.access && session.access !== access) {
          return applyVendorSession(session.access, true);
        }
      }
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
    if (isSsoLoggedOutGlobally()) {
      clearAuthStorage();
      setIsLoggedIn(false);
      return false;
    }
    const session = await ensureSession();
    return applyVendorSession(session?.access ?? null);
  }, [applyVendorSession]);

  const bootstrapAuth = useCallback(async () => {
    if (isSsoLoggedOutGlobally()) {
      clearAuthStorage();
      setIsLoggedIn(false);
      return;
    }
    const session = await ensureSession();
    if (!session?.access) {
      setIsLoggedIn(false);
      return;
    }

    persistAuthSession(session.access, session.refresh);
    const vendorStatus = await checkVendorStatus(session.access);

    if (vendorStatus.unauthorized) {
      clearAuthStorage();
      setIsLoggedIn(false);
      return;
    }

    if (vendorStatus.needsOnboarding) {
      storeVendorOnboardingFromJwt(session.access);
      setAuthpage("register-as-vendor");
      setIsLoggedIn(false);
      return;
    }

    if (vendorStatus.isVendor) {
      await applyVendorSession(session.access);
      return;
    }

    setIsLoggedIn(false);
  }, [applyVendorSession]);

  const syncFromSharedSession = useCallback(async () => {
    if (ssoSyncInflightRef.current) return;
    ssoSyncInflightRef.current = true;
    try {
      if (isSsoLoggedOutGlobally()) {
        if (loggedIn) {
          clearAuthStorage();
          setIsLoggedIn(false);
        }
        return;
      }

      const session = await reconcileSharedSession();
      if (!session?.access) {
        setIsLoggedIn(false);
        return;
      }
      persistAuthSession(session.access, session.refresh);
      const vendorStatus = await checkVendorStatus(session.access);
      if (vendorStatus.needsOnboarding) {
        storeVendorOnboardingFromJwt(session.access);
        setAuthpage("register-as-vendor");
        setIsLoggedIn(false);
        return;
      }
      await applyVendorSession(session.access);
    } finally {
      ssoSyncInflightRef.current = false;
    }
  }, [applyVendorSession, loggedIn]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await bootstrapAuth();
      } catch (error) {
        console.error("Vendor auth bootstrap failed:", error);
        if (!cancelled) setIsLoggedIn(false);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bootstrapAuth]);

  useEffect(() => {
    if (!authReady) return undefined;
    return attachSharedSsoSync(() => {
      void syncFromSharedSession();
    });
  }, [authReady, syncFromSharedSession]);

  useEffect(() => {
    if (!authReady) return undefined;

    return startTokenRefreshScheduler((access) => {
      void applyVendorSession(access);
    });
  }, [authReady, applyVendorSession]);

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
