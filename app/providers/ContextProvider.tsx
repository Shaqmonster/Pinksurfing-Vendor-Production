"use client";
import { useState, useEffect, useCallback } from "react";
import { MyContext } from "./context";
import { getCookie } from "@/utils/cookies";
import { resolveVendorSession } from "@/api/account";

const MyProvider = ({ children }: { children: React.ReactNode }) => {
  const [loggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authPage, setAuthpage] = useState("signin");
  const [resetEmail, setResetEmail] = useState("");
  const [vendor, setVendor] = useState<any>();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const refreshAuth = useCallback(async () => {
    const access = getCookie("access_token");
    const cookieRefresh = getCookie("refresh_token");

    if (!access) {
      localStorage.clear();
      setIsLoggedIn(false);
      return false;
    }

    localStorage.setItem("access", access);
    if (cookieRefresh) localStorage.setItem("refresh", cookieRefresh);

    const session = await resolveVendorSession(access);
    if (session.unauthorized) {
      localStorage.clear();
      setIsLoggedIn(false);
      return false;
    }
    const vendorId = session.profile?.id ?? session.profile?.pk;
    if (session.isVendor && vendorId) {
      localStorage.setItem("vendor_id", String(vendorId));
      setIsLoggedIn(true);
      return true;
    }

    if (getCookie("access_token") && localStorage.getItem("vendor_id")) {
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
