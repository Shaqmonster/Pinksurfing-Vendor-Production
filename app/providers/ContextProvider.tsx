"use client";
import { useState, useEffect, useCallback } from "react";
import { MyContext } from "./context";
import {
  getAccessToken,
  getRefreshToken,
  getCookie,
  setCookie,
  getAuthCookieDomain,
  clearAuthStorage,
  isSsoLoggedOutGlobally,
} from "@/utils/cookies";
import { resolveSharedSession, resolveVendorSession } from "@/api/account";

const MyProvider = ({ children }: { children: React.ReactNode }) => {
  const [loggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authPage, setAuthpage] = useState("signin");
  const [resetEmail, setResetEmail] = useState("");
  const [vendor, setVendor] = useState<any>();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const refreshAuth = useCallback(async () => {
    if (isSsoLoggedOutGlobally()) {
      clearAuthStorage();
      setIsLoggedIn(false);
      return false;
    }

    const sharedSession = await resolveSharedSession();
    let access = sharedSession?.access ?? null;
    let refresh = sharedSession?.refresh ?? getRefreshToken();

    if (!access) {
      setIsLoggedIn(false);
      return false;
    }

    localStorage.setItem("access", access);
    if (refresh) localStorage.setItem("refresh", refresh);

    if (!getCookie("access_token")) {
      setCookie("access_token", access, 7);
      const sharedDomain = getAuthCookieDomain();
      if (sharedDomain) setCookie("access_token", access, 7, sharedDomain);
    }

    const vendorSession = await resolveVendorSession(access);
    if (vendorSession.unauthorized) {
      clearAuthStorage();
      setIsLoggedIn(false);
      return false;
    }

    const vendorId =
      vendorSession.profile?.id ??
      vendorSession.profile?.pk ??
      localStorage.getItem("vendor_id");

    if (vendorSession.isVendor && vendorId) {
      localStorage.setItem("vendor_id", String(vendorId));
      setIsLoggedIn(true);
      return true;
    }

    if (localStorage.getItem("vendor_id")) {
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

  useEffect(() => {
    const syncOnFocus = () => {
      void refreshAuth();
    };
    window.addEventListener("focus", syncOnFocus);
    return () => window.removeEventListener("focus", syncOnFocus);
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
