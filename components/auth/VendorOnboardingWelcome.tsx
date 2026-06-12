"use client";

import { useContext, useEffect, useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import { MyContext } from "@/app/providers/context";
import { authBtnPrimary, authLinkClass } from "@/components/auth/authTheme";
import { getStoredAccessToken } from "@/utils/cookies";
import { decodeJwt } from "@/utils/ssoSession";

export default function VendorOnboardingWelcome() {
  const { setAuthpage } = useContext(MyContext);
  const [name, setName] = useState("");

  useEffect(() => {
    const token = getStoredAccessToken();
    const claims = decodeJwt(token);
    const first = (claims?.first_name as string) || "";
    const last = (claims?.last_name as string) || "";
    const full = `${first} ${last}`.trim();
    if (full) setName(full);
  }, []);

  return (
    <AuthLayout
      title={name ? `Hi, ${firstNameOnly(name)}` : "You're signed in"}
      subtitle="You have a PinkSurfing account. To sell products and manage orders, set up your vendor store — it only takes a few minutes."
    >
      <div className="space-y-6">
        <p className="text-sm text-slate-600 dark:text-surface-400 leading-relaxed">
          List products, receive orders, and run your shop from the vendor
          dashboard. Your buyer account stays the same.
        </p>

        <button
          type="button"
          onClick={() => setAuthpage("register-as-vendor")}
          className={authBtnPrimary}
        >
          Join us as a Vendor
        </button>

        <p className="text-center text-sm text-slate-500 dark:text-surface-400">
          Not ready yet?{" "}
          <button
            type="button"
            onClick={() => setAuthpage("signin")}
            className={authLinkClass}
          >
            Back to sign in
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}

function firstNameOnly(full: string) {
  return full.split(/\s+/)[0] || full;
}
