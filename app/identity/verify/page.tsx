"use client";

import React, { useContext, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DiditVerificationGate from "@/components/DiditVerificationGate";
import { MyContext } from "@/app/providers/context";
import { getAccessToken } from "@/utils/cookies";
import { CardSkeleton } from "@/components/common/Loader";

export default function IdentityVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loggedIn } = useContext(MyContext);
  const [token, setToken] = useState("");

  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(getAccessToken() || "");
    }
  }, []);

  useEffect(() => {
    if (!loggedIn && !token) {
      router.replace("/auth/signin");
    }
  }, [loggedIn, token, router]);

  if (!token) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg p-6">
        <div className="max-w-lg mx-auto">
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      <DiditVerificationGate
        accessToken={token}
        onVerified={() => router.replace(returnUrl)}
        title="Identity verification"
        description="Finish verification to continue to your vendor dashboard."
      />
    </div>
  );
}
