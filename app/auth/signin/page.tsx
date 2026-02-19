"use client";
import React, { useState, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { signIn } from "@/api/account";
import { useRouter } from "next/navigation";
import { MyContext } from "@/app/providers/context";
import Loader from "@/components/common/Loader";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import { handleError, handleSuccess } from "@/utils/toast";
import { setCookie } from "@/utils/cookies";

const SignIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setIsLoggedIn, setVendor, setAuthpage } = useContext(MyContext);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleChange = (event: any) => {
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
      if (passwordError) setPasswordError("");
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

  const login = async () => {
    setError("");
    setLoading(true);

    if (email && password) {
      let data = await signIn({ email, password })
        .then((res) => res)
        .catch((e) => {
          console.log(e);
          if (e.response?.status == 401) {
            handleError("Invalid email or password");
          } else {
            handleError("Invalid email or password");
          }
        });
      setLoading(false);
      setError("");
      console.log(data);
      if (data && data.status === 409) {
        handleError(data?.message);
        localStorage.setItem("customer", JSON.stringify(parseJwt(data.token)));
        setAuthpage("signup");
      } else if (data && "token" in data) {
        let { token, refresh } = data;
        if (typeof window !== "undefined") {
          localStorage.setItem("access", token);
          localStorage.setItem("refresh", refresh);
          localStorage.setItem("vendor_id", data.id);

          const domain = window.location.hostname.includes("localhost")
            ? undefined
            : ".pinksurfing.com";

          setCookie("access_token", token, 7, domain);
          setCookie("refresh_token", refresh, 7, domain);
          setCookie("user_id", data.id, 7, domain);

          setIsLoggedIn(true);
          handleSuccess("Welcome back! Login successful");
        }

        if (data) {
          localStorage.setItem("store", JSON.stringify(data));
          setVendor(data);
        }
        router.push("/dashboard");
      } else {
        if (data && "response" in data && data.response.status > 399) {
          handleError("Invalid email or password");
        } else {
          handleError(data?.message || "Invalid email or password");
        }
      }
    } else {
      !email ? setError("Email is required") : setError("Password is required");
    }

    return false;
  };

  const isButtonDisabled = () => {
    return email.length === 0 || password.length === 0 || !!emailError || !!passwordError;
  };

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-dark-bg p-4">
          {/* Background decoration */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-purple/10 rounded-full blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative w-full max-w-md"
          >
            {/* Card */}
            <div className="bg-white dark:bg-dark-card rounded-3xl shadow-premium-lg border border-surface-100 dark:border-dark-border p-8 md:p-10">
              {/* Logo & Header */}
              <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl overflow-hidden">
                    <Image
                      src="/logo.jpg"
                      alt="PinkSurfing"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xl font-bold text-surface-900 dark:text-white">
                    PinkSurfing
                  </span>
                </Link>
                <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-2">
                  Welcome back
                </h1>
                <p className="text-surface-500 dark:text-surface-400">
                  Sign in to your vendor account
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await login();
                }}
                className="space-y-5"
              >
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400">
                      <FiMail className="w-5 h-5" />
                    </div>
                    <input
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-50 dark:bg-dark-input border-2 text-surface-900 dark:text-white placeholder:text-surface-400 transition-all duration-200 focus:outline-none ${
                        emailError
                          ? "border-danger focus:border-danger"
                          : "border-surface-200 dark:border-dark-border focus:border-primary-500 dark:focus:border-primary-500"
                      }`}
                      required
                    />
                  </div>
                  {emailError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-danger mt-2"
                    >
                      {emailError}
                    </motion.p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400">
                      <FiLock className="w-5 h-5" />
                    </div>
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-surface-50 dark:bg-dark-input border-2 border-surface-200 dark:border-dark-border text-surface-900 dark:text-white placeholder:text-surface-400 transition-all duration-200 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setAuthpage("forgot")}
                    className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-danger/10 text-danger text-sm font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isButtonDisabled()}
                  whileHover={{ scale: isButtonDisabled() ? 1 : 1.01 }}
                  whileTap={{ scale: isButtonDisabled() ? 1 : 0.99 }}
                  className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-300 ${
                    isButtonDisabled()
                      ? "bg-surface-300 dark:bg-dark-border cursor-not-allowed"
                      : "bg-gradient-to-r from-primary-500 to-accent-purple shadow-lg hover:shadow-xl hover:shadow-primary-500/25"
                  }`}
                >
                  Sign In
                  <FiArrowRight className="w-5 h-5" />
                </motion.button>

                {/* Sign Up Link */}
                <p className="text-center text-surface-500 dark:text-surface-400 pt-2">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setAuthpage("signup")}
                    className="text-primary-500 hover:text-primary-600 font-semibold transition-colors"
                  >
                    Create account
                  </button>
                </p>
              </form>
            </div>

            {/* Footer */}
            <p className="text-center text-surface-400 dark:text-surface-500 text-sm mt-6">
              © 2024 PinkSurfing. All rights reserved.
            </p>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default SignIn;
