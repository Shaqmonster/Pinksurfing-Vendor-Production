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
} from "@/utils/cookies";
import {
  bootstrapAccessFromSsoCookies,
  persistAuthTokens,
  resolveVendorSession,
} from "@/api/account";

const MyProvider = ({ children }: { children: React.ReactNode }) => {
  const [loggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authPage, setAuthpage] = useState("signin");
  const [resetEmail, setResetEmail] = useState("");
  const [vendor, setVendor] = useState<any>();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const refreshAuth = useCallback(async () => {
    let access = getAccessToken();
    let refresh = getRefreshToken();

    if (!access) {
      const boot = await bootstrapAccessFromSsoCookies();
      if (boot?.access) {
        access = boot.access;
        refresh = boot.refresh ?? refresh ?? undefined;
        persistAuthTokens(access, refresh);
      }
    }

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

    const session = await resolveVendorSession(access);
    if (session.unauthorized) {
      clearAuthStorage();
      setIsLoggedIn(false);
      return false;
    }

    const vendorId =
      session.profile?.id ??
      session.profile?.pk ??
      localStorage.getItem("vendor_id");

    if (session.isVendor && vendorId) {
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
