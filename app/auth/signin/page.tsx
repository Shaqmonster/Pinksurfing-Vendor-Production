"use client";
import React, { useState, useContext } from "react";
import { motion } from "framer-motion";
import { persistAuthTokens, signIn } from "@/api/account";
import { useRouter } from "next/navigation";
import { MyContext } from "@/app/providers/context";
import Loader from "@/components/common/Loader";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { handleError, handleSuccess } from "@/utils/toast";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import AuthDivider from "@/components/auth/AuthDivider";
import AuthLayout from "@/components/auth/AuthLayout";
import {
  authBtnPrimary,
  authInputClass,
  authLabelClass,
  authLinkClass,
} from "@/components/auth/authTheme";

const SignIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setIsLoggedIn, setVendor, setAuthpage } = useContext(MyContext);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    if (name === "email") {
      setEmail(value);
      if (value && !emailRegex.test(value)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    }

    if (name === "password") {
      setPassword(value);
    }
  };

  function parseJwt(token: string) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      const payload = JSON.parse(jsonPayload);
      payload.token = token;
      return payload;
    } catch (e) {
      console.error("Error parsing JWT:", e);
      return { token: token, payload: null };
    }
  }

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError(!email ? "Email is required" : "Password is required");
      return;
    }

    setLoading(true);

    try {
      const data = await signIn({ email, password });

      if (data && data.status === 409) {
        handleError(data?.message);
        localStorage.setItem("customer", JSON.stringify(parseJwt(data.token)));
        setAuthpage("signup");
        return;
      }

      if (data && "token" in data && data.token) {
        const { token, refresh } = data;
        const vendorId = data.id ?? data.pk;
        if (typeof window !== "undefined") {
          persistAuthTokens(token, refresh, vendorId);
          localStorage.setItem("store", JSON.stringify(data));
          setVendor(data);
        }
        setIsLoggedIn(true);
        handleSuccess("Welcome back! Login successful");
        router.replace("/dashboard");
        return;
      }

      if (data?.error) {
        handleError(data.message || data.detail || "Sign in failed");
      } else {
        handleError(data?.message || "Invalid email or password");
      }
    } catch (e) {
      handleError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled =
    email.length === 0 || password.length === 0 || !!emailError || loading;

  return (
    <>
      <AuthLayout
        title="Welcome back"
        subtitle="Sign in to your vendor dashboard"
        footer={
          <>
            Don&apos;t have a vendor account?{" "}
            <button
              type="button"
              onClick={() => setAuthpage("signup")}
              className={authLinkClass}
            >
              Create vendor account
            </button>
          </>
        }
      >
        <form onSubmit={login} className="space-y-5">
          <GoogleSignInButton disabled={loading} />
          <AuthDivider label="or sign in with email" />

          <div>
            <label htmlFor="email" className={authLabelClass}>
              Email
            </label>
            <input
              name="email"
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={handleChange}
              className={authInputClass}
              required
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-2">{emailError}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className={authLabelClass}>
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={handleChange}
                className={`${authInputClass} pr-11`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <FiEyeOff size={20} />
                ) : (
                  <FiEye size={20} />
                )}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => setAuthpage("forgot")}
                className={`text-sm ${authLinkClass}`}
              >
                Forgot password?
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium dark:bg-red-500/10 dark:text-red-400"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isButtonDisabled}
            className={authBtnPrimary}
          >
            {loading ? "Signing in..." : "Sign in to vendor dashboard"}
          </button>
        </form>
      </AuthLayout>

      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Loader />
        </div>
      )}
    </>
  );
};

export default SignIn;
