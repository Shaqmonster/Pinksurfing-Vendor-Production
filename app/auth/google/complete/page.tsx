"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/common/Loader";
import { MyContext } from "@/app/providers/context";
import { signInWithSsoTokens } from "@/api/account";
import {
  completeGoogleSignIn,
  getGoogleSignInErrorMessage,
} from "@/utils/googleAuth";
import { handleError, handleSuccess } from "@/utils/toast";

type VendorLoginResult = {
  status?: number;
  message?: string;
  token?: string;
  refresh?: string;
  detail?: string;
  error?: boolean;
  id?: number;
};

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return { ...JSON.parse(jsonPayload), token };
  } catch {
    return { token };
  }
}

export default function GoogleAuthCompletePage() {
  const router = useRouter();
  const { setIsLoggedIn, setVendor, setAuthpage } = useContext(MyContext);
  const [message, setMessage] = useState("Completing Google sign-in...");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const errorCode = params.get("sso_error");
        if (errorCode) {
          throw new Error(errorCode);
        }

        const session = await completeGoogleSignIn();
        const data = (await signInWithSsoTokens(
          session.access,
          session.refresh
        )) as VendorLoginResult;

        if (cancelled) return;

        if (data?.status === 409 && data.token) {
          handleError(data.message || "Complete vendor registration to continue");
          localStorage.setItem(
            "customer",
            JSON.stringify(parseJwt(data.token))
          );
          setAuthpage("signup");
          router.replace("/");
          return;
        }

        if (data?.token) {
          localStorage.setItem("store", JSON.stringify(data));
          setVendor(data);
          setIsLoggedIn(true);
          handleSuccess("Signed in with Google");
          router.replace("/dashboard");
          return;
        }

        handleError(
          data?.message || data?.detail || "Google sign-in failed"
        );
        setMessage("Redirecting to sign in...");
        router.replace("/auth/signin");
      } catch (error: unknown) {
        if (cancelled) return;
        const code =
          error instanceof Error ? error.message : "google_auth_failed";
        handleError(getGoogleSignInErrorMessage(code));
        setMessage("Redirecting to sign in...");
        router.replace("/auth/signin");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, setAuthpage, setIsLoggedIn, setVendor]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader />
        <p className="text-surface-500 dark:text-surface-400">{message}</p>
      </div>
    </div>
  );
}
