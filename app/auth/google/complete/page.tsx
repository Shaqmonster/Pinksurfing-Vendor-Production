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
          setAuthpage("register-as-vendor");
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
