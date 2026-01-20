"use client";
import React, { useState, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { MyContext } from "@/app/providers/context";
import { emailResetOtp } from "@/api/auth";
import { Formik, Form, FormikHelpers } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Loader2 } from "@/components/common/Loader";
import { FiMail, FiArrowRight, FiArrowLeft } from "react-icons/fi";

interface FormValues {
  email: string;
}

const ForgotPassword = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { setIsLoggedIn, setVendor, setAuthpage, setResetEmail } =
    useContext(MyContext);

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email Required"),
  });

  const onSubmit = async (
    values: FormValues,
    { setSubmitting }: FormikHelpers<FormValues>
  ) => {
    setLoading(true);
    try {
      await emailResetOtp(values.email);
      toast.success("OTP sent to your email successfully!");
      setResetEmail(values.email);
      setAuthpage("reset");
    } catch (e: any) {
      console.log(e);
      toast.error(
        e?.response?.data?.email?.length > 0
          ? e?.response?.data?.email[0]
          : "Something went wrong! Kindly check your email"
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <>
      {loading && <Loader2 />}
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

              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-purple/20 flex items-center justify-center">
                <FiMail className="w-8 h-8 text-primary-500" />
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-surface-900 dark:text-white mb-2">
                Forgot Password?
              </h1>
              <p className="text-surface-500 dark:text-surface-400">
                No worries! Enter your email and we'll send you a reset link.
              </p>
            </div>

            {/* Form */}
            <Formik
              initialValues={{ email: "" }}
              onSubmit={onSubmit}
              validationSchema={validationSchema}
            >
              {({ handleChange, handleBlur, values, touched, errors, isSubmitting }) => (
                <Form className="space-y-5">
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
                        type="email"
                        id="email"
                        placeholder="you@example.com"
                        name="email"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.email}
                        className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-50 dark:bg-dark-input border-2 text-surface-900 dark:text-white placeholder:text-surface-400 transition-all duration-200 focus:outline-none ${
                          touched.email && errors.email
                            ? "border-danger focus:border-danger"
                            : "border-surface-200 dark:border-dark-border focus:border-primary-500 dark:focus:border-primary-500"
                        }`}
                      />
                    </div>
                    {touched.email && errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-danger mt-2"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-300 bg-gradient-to-r from-primary-500 to-accent-purple shadow-lg hover:shadow-xl hover:shadow-primary-500/25"
                  >
                    Send Reset Link
                    <FiArrowRight className="w-5 h-5" />
                  </motion.button>

                  {/* Back to Sign In */}
                  <button
                    type="button"
                    onClick={() => setAuthpage("signin")}
                    className="w-full py-3 rounded-xl font-medium text-surface-600 dark:text-surface-400 hover:text-primary-500 dark:hover:text-primary-400 flex items-center justify-center gap-2 transition-colors"
                  >
                    <FiArrowLeft className="w-4 h-4" />
                    Back to Sign In
                  </button>
                </Form>
              )}
            </Formik>
          </div>

          {/* Footer */}
          <p className="text-center text-surface-400 dark:text-surface-500 text-sm mt-6">
            © 2024 PinkSurfing. All rights reserved.
          </p>
        </motion.div>
      </div>
      <ToastContainer />
    </>
  );
};

export default ForgotPassword;
