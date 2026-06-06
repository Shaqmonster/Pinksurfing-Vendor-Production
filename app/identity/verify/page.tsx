"use client";

import React, { useContext, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DiditVerificationGate from "@/components/DiditVerificationGate";
import { MyContext } from "@/app/providers/context";
import { getAccessToken } from "@/utils/cookies";

export default function IdentityVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn } = useContext(MyContext);
  const [token, setToken] = useState("");

  const returnUrl = searchParams.get("returnUrl") || "/dashboard";
  const context =
    searchParams.get("context") === "gig_seller" ? "gig_seller" : "vendor";

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(getAccessToken() || "");
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn && !token) {
      router.replace("/auth/signin");
    }
  }, [isLoggedIn, token, router]);

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DiditVerificationGate
        context={context}
        accessToken={token}
        onVerified={() => router.replace(returnUrl)}
        title="Identity verification"
        description="Finish verification to continue to your vendor dashboard."
      />
    </div>
  );
}
