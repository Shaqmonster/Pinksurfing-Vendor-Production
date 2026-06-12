"use client";
import React, {
  useState,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect
} from "react";
import Link from "next/link";
import Image from "next/image";
import { getOnboardingUrl, sendOtp, isCustomer, customerLogin, customerVendorRegistration } from "@/api/account"; // Adjust the import path based on your file structure
import { useRouter } from "next/navigation";

import { signUp } from "@/api/account";
import { setCookie } from "@/utils/cookies";
import { MyContext } from "@/app/providers/context";
import { redirect } from "next/navigation";
import CountryCodeSelector from "../../../components/CountryCodeSelector/countrycode";
import PinInput from "react-pin-input";
import {
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaGlobe,
  FaGlobeAmericas,
  FaHome,
  FaMapMarkerAlt,
  FaMapPin,
  FaPhone,
  FaSearch,
  FaStore,
  FaUser
} from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { ToastContainer, toast } from "react-toastify";
import Loader from "@/components/common/Loader";
import { Country, State, City } from "country-state-city";
import { getVendorProfile } from "@/api/products";
import { handleError, handleSuccess } from "@/utils/toast";
import { identityVerifyPath } from "@/api/identity";
import PasswordRequirementsFeedback from "@/components/auth/PasswordRequirementsFeedback";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import AuthDivider from "@/components/auth/AuthDivider";
import AuthLayout from "@/components/auth/AuthLayout";
import {
  authBtnPrimary,
  authInputClass,
  authLabelClass,
  authLinkClass,
} from "@/components/auth/authTheme";
import { isPasswordValid } from "@/utils/djangoPasswordValidation";

type SignUpProps = {
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
};

const SignUp: React.FC = () => {
  {
    /* 2 for no activity, 1 for password match and 0 for not */
  }
  // Multi-step flow states
  const [step, setStep] = useState(1); // 1: Email, 2: Password/Full Form, 3: Vendor Details
  const [userType, setUserType] = useState(""); // "existing_customer", "new_user", "existing_vendor"
  const [authToken, setAuthToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [PasswordCheck, setPasswordCheck] = useState(2);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [visible2, setVisible2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const { setIsLoggedIn, setAuthpage } = useContext(MyContext);
  const [Payload, setPayload] = useState({
    first_name: "",
    last_name: "",
    bio: "",
    company_name: "",
    email: "",
    phone_number: "",
    contact_person_name: "",
    password: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    website: "",
    country: "",
    zip_code: "",
    entered_otp: "",
    shop_image: null,
    profile_pic: null
  });

  const router = useRouter();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const updatePayload = (key: string, value: string) => {
    setPayload((prevPayload: any) => {
      let updatedPayload = { ...prevPayload, [key]: value };
      console.log(updatedPayload);
      return updatedPayload;
    });
  };

  const handleStoreFile = (event) => {
    const selectedFile = event?.target?.files[0];
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        // 50 MB limit
        toast.error("File size exceeds 50MB. Please choose a smaller file.");
        return;
      }
      setPayload((prevPayload) => ({
        ...prevPayload,
        shop_image: selectedFile
      }));
    }
  };

  const handleRemoveStoreFile = () => {
    setPayload((prevPayload) => ({
      ...prevPayload,
      shop_image: null
    }));
  };

  const handleProfilePictureChange = (event) => {
    const selectedFile = event?.target?.files[0];
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        // 50 MB limit
        toast.error("File size exceeds 50MB. Please choose a smaller file.");
        return;
      }
      setPayload((prevPayload) => ({
        ...prevPayload,
        profile_pic: selectedFile
      }));
    }
  };

  const handleRemoveProfilePicture = () => {
    setPayload((prevPayload) => ({
      ...prevPayload,
      profile_pic: null
    }));
  };

  // Multi-step flow handlers
  const handleEmailNext = async () => {
    if (!email || !email.includes("@")) {
      setEmailError("Please enter a valid email");
      return;
    }
    setEmailError("");
    setLoading(true);
    
    const response = await isCustomer(email);
    setLoading(false);

    if (!response.success || response.error) {
      handleError("Error checking email. Please try again.");
      return;
    }

    const { is_customer, is_vendor } = response.data;

    // Scenario 3: Existing vendor - redirect to signin
    if (is_customer && is_vendor) {
      setUserType("existing_vendor");
      toast.info("You already have a vendor account. Redirecting to sign in...");
      setAuthpage("signin");
      return;
    }

    // Scenario 1: Existing customer - ask for password
    if (is_customer && !is_vendor) {
      setUserType("existing_customer");
      console.log("Existing customer detected");
      setStep(2);
      return;
    }

    // Scenario 2: New user - go to full signup
    if (!is_customer && !is_vendor) {
      setUserType("new_user");
      updatePayload("email", email);
      setStep(2);
      return;
    }
  };

  const handlePasswordNext = async () => {
    if (!password) {
      setPasswordError("Please enter your password");
      return;
    }
    setPasswordError("");
    setLoading(true);

    const response = await customerLogin(email, password);
    setLoading(false);

    if (!response.success || response.error) {
      handleError("Invalid email or password");
      setPasswordError("Invalid password");
      return;
    }

    const { access, refresh, user_id } = response.data;

    if (access) {
      setAuthToken(access);
      // Store token in localStorage and cookies for SSO
      localStorage.setItem("access", access);
      if (refresh) {
        localStorage.setItem("refresh", refresh);
      }
      if (user_id) {
        localStorage.setItem("user_id", user_id);
      }
      setCookie("access_token", access, 7, ".pinksurfing.com");
      if (refresh) {
        setCookie("refresh_token", refresh, 7, ".pinksurfing.com");
      }
      if (user_id) {
        setCookie("user_id", user_id, 7, ".pinksurfing.com");
      }
      
      updatePayload("email", email);
      setStep(3);
    }
  };

  const handleVendorRegistration = async (event: any) => {
    event.preventDefault();
    setLoading(true);

    // Validate required fields for vendor registration
    if (!Payload.company_name || !Payload.street1 || !Payload.country || 
        !Payload.state || !Payload.city || !Payload.zip_code) {
      setLoading(false);
      handleError("Please fill all required fields");
      return;
    }

    const response = await customerVendorRegistration(authToken, Payload);
    setLoading(false);

    if (response.success && response.data && response.data.vendor_id) {
      handleSuccess("Vendor registration successful!");
      if (response.data.address_warning) {
        toast.warn(response.data.address_warning, { position: "top-right", autoClose: 6000 });
      }
      localStorage.setItem("vendor_id", response.data.vendor_id);
      setIsLoggedIn(true);
      if (response.data.kyc_required) {
        router.push(identityVerifyPath("vendor", "/dashboard"));
      } else {
        router.push("/dashboard");
      }
    } else {
      handleError(response.error || "Registration failed");
    }
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    setIsError(false);
    setErrorMessage("");

    if (Payload.password !== confirmPassword) {
      setPasswordCheck(0);
      return;
    }

    if (
      !isPasswordValid(Payload.password, {
        email: Payload.email,
        username: Payload.email,
        first_name: Payload.first_name,
        last_name: Payload.last_name,
      })
    ) {
      setPasswordError("Please meet all password requirements.");
      return;
    }

    setLoading(true);
    let response = await signUp(Payload);
    setLoading(false);
    console.log(response);

    if (response.access) {
      handleSuccess("Registration Successful!");
      if (response.address_warning) {
        toast.warn(response.address_warning, { position: "top-right", autoClose: 6000 });
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("access", response.access);
        localStorage.setItem("vendor_id", response.vendor_id);
        const { data, error } = await getVendorProfile(response.access);
        if (!error) {
          const storedData = localStorage.getItem("store");
          if (!storedData) {
            localStorage.setItem("store", JSON.stringify(data));
          }
        } else {
          console.error("Error fetching profile:", error);
        }
        setIsLoggedIn(true);
        if (response.kyc_required) {
          router.push(identityVerifyPath("vendor", "/dashboard"));
        } else {
          router.push("/dashboard");
        }
      }
    } else if (response.status || response.error) {
      setIsError(true);
      const errorToDisplay =
        response.status ||
        response.error ||
        response.message ||
        "An unknown error occurred during signup.";

      handleError(errorToDisplay);
      setErrorMessage(errorToDisplay);
    } else {
      setErrorMessage("An unknown error occurred during signup.");
    }
  };

  function parseJwt(token) {
    console.log(token);
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

    return jsonPayload;
  }

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  const handleCountrySelect = (countryCode) => {
    setSelectedCountryCode(countryCode);
    setStates(State.getStatesOfCountry(countryCode));
    updatePayload("country", countryCode);
  };

  const handleStateSelect = (stateCode) => {
    setSelectedStateCode(stateCode);
    setCities(City.getCitiesOfState(selectedCountryCode, stateCode));
    updatePayload("state", stateCode);
  };

  const signupTitle =
    step === 1
      ? "Create your vendor account"
      : step === 2 && userType === "existing_customer"
        ? "Verify your account"
        : step === 3 && userType === "existing_customer"
          ? "Complete vendor registration"
          : "Set up your store";

  const signupSubtitle =
    step === 1
      ? "Register as a seller on PinkSurfing — separate from a buyer account"
      : step === 2 && userType === "existing_customer"
        ? "Enter your marketplace password to become a vendor"
        : "Tell us about your business and storefront";

  return (
    <>
      <AuthLayout
        title={signupTitle}
        subtitle={signupSubtitle}
        wide={step > 1}
        footer={
          step === 1 ? (
            <>
              Already have a vendor account?{" "}
              <button
                type="button"
                onClick={() => setAuthpage("signin")}
                className={authLinkClass}
              >
                Sign in
              </button>
            </>
          ) : undefined
        }
      >
        <form
          onSubmit={
            userType === "existing_customer" && step === 3
              ? handleVendorRegistration
              : handleSubmit
          }
          className="space-y-5"
        >

                  {/* Step 1: Email Input */}
                  {step === 1 && (
                    <>
                      <GoogleSignInButton
                        disabled={loading}
                        label="Sign up with Google"
                      />
                      <AuthDivider label="or sign up with email" />

                      <div>
                        <label htmlFor="vendor-signup-email" className={authLabelClass}>
                          Email
                        </label>
                        <input
                          id="vendor-signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setEmailError("");
                          }}
                          className={authInputClass}
                        />
                        {emailError && (
                          <p className="text-red-500 text-sm mt-2">{emailError}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleEmailNext}
                        disabled={loading || !email || !!emailError}
                        className={authBtnPrimary}
                      >
                        {loading ? "Checking..." : "Continue"}
                      </button>
                    </>
                  )}

                  {/* Step 2: Password for Existing Customer */}
                  {step === 2 && userType === "existing_customer" && (
                    <>
                      <div className="mb-4">
                        <label className="mb-2.5 block font-medium text-black dark:text-white">
                          Email
                        </label>
                        <p className="text-black dark:text-white py-2">{email}</p>
                      </div>

                      <div className="mb-4">
                        <label className="mb-2.5 block font-medium text-black dark:text-white">
                          Password
                          <span className="text-red-500 font-bold text-lg">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={visible ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              setPasswordError("");
                            }}
                            className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                          />
                          <span
                            className="absolute right-4 top-4 cursor-pointer"
                            onClick={() => setVisible(!visible)}
                          >
                            {visible ? <FaEyeSlash size={22} /> : <FaEye size={22} />}
                          </span>
                        </div>
                        {passwordError && <p className="text-red-500 mt-1">{passwordError}</p>}
                      </div>

                      <div className="mb-5">
                        <button
                          type="button"
                          onClick={handlePasswordNext}
                          className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90"
                        >
                          Next
                        </button>
                      </div>

                      <div className="mt-6 text-center">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-primary"
                        >
                          ← Back to email
                        </button>
                      </div>
                    </>
                  )}

                  {/* Step 2: Full Signup for New User */}
                  {step === 2 && userType === "new_user" && (
                    <>
                  <div className="mb-4">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      First Name
                      <span className="text-red-500 font-bold text-lg">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter your first name"
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => {
                          updatePayload("first_name", event.target.value);
                          updatePayload(
                            "contact_person_name",
                            event.target.value
                          );
                        }}
                        required
                      />

                      <span className="absolute right-4 top-4">
                        <FaUser size={22} />
                      </span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Last Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter your last name"
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => {
                          updatePayload("last_name", event.target.value);
                        }}
                      />

                      <span className="absolute right-4 top-4">
                        <FaUser size={22} />
                      </span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      General information about your store
                      <span className="text-red-500 font-bold text-lg">*</span>
                    </label>
                    <div className="relative">
                      <textarea
                        placeholder="Enter your information about your store"
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(
                          event: React.ChangeEvent<HTMLTextAreaElement>
                        ) => {
                          updatePayload("bio", event.target.value);
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4 bg-gray-2 rounded-lg p-7">
                    <form action="#" className="relative">
                      <h2 className="font-medium text-gray-700 text-center dark:text-black">
                        Upload Profile Picture
                      </h2>
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 z-50 m-0 h-full w-full cursor-pointer p-0 opacity-0 outline-none"
                        onChange={handleProfilePictureChange}
                      />
                      <div className="flex flex-col items-center justify-center space-y-3">
                        {Payload.profile_pic ? (
                          <div className="relative rounded-full overflow-hidden h-20 w-20">
                            <img
                              src={URL.createObjectURL(Payload.profile_pic)}
                              alt={Payload.profile_pic.name}
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveProfilePicture}
                              className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              {/* Your SVG paths for the icon */}
                            </svg>
                          </span>
                        )}
                        <p>
                          <span className="text-primary">Click to upload</span>
                        </p>
                        {Payload.profile_pic ? (
                          <p>{Payload.profile_pic.name}</p>
                        ) : (
                          <>
                            <p className="mt-1.5">SVG, PNG, JPG, or GIF</p>
                            <p>(max, 800 X 800px)</p>
                          </>
                        )}
                      </div>
                    </form>
                  </div>

                  <div className="mb-4 ">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Email
                      <span className="text-red-500 font-bold text-lg">*</span>
                    </label>
                    <div className="relative flex">
                      <input
                        type="email"
                        placeholder="Enter your email"
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => {
                          updatePayload("email", event.target.value);
                          if (!emailRegex.test(event.target.value)) {
                            setEmailError("Invalid email address");
                          } else {
                            setEmailError("");
                          }
                        }}
                        required
                      />

                      <span className="absolute right-27 top-4">
                        <FaEnvelope size={22} />
                      </span>
                      <button
                        type="button"
                        className={`font-semibold py-2 px-4 border rounded outline-none shadow m-2 ${
                          emailError || !Payload.email
                            ? "bg-gray-500 border-gray-600 text-gray-300 cursor-not-allowed"
                            : "bg-primary border-primary text-white hover:bg-gray-100"
                        }`}
                        onClick={async () => {
                          const res = await sendOtp(Payload.email);
                          console.log(res);
                        
                          if (res.success) {
                            toast.success(res.message);
                          } else {
                            toast.error(res.message);
                          }
                        }}
                        disabled={!Payload.email || emailError}
                      >
                        Verify
                      </button>
                    </div>
                    {emailError && (
                      <p className="text-red-500 text-sm mt-1">{emailError}</p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Otp
                      <span className="text-red-500 font-bold text-lg">*</span>
                    </label>
                    <div className="relative">
                      <PinInput
                        length={6}
                        focus
                        onChange={(otpValue: string) =>
                          updatePayload("entered_otp", otpValue)
                        }
                        inputStyle={{
                          borderRadius: "5px",
                          padding: "10px",
                          fontSize: "16px",
                          color: "black",
                          backgroundColor: "transparent",
                          outline: "none",
                          border: "1px solid rgba(226, 232, 240, 1)"
                        }}
                        containerStyle={{ backgroundColor: "#2d1e5f" }}
                      />
                    </div>
                  </div>

                  {/* Close Step 2 for new users */}
                  </>
                  )}

                  {/* Step 3: Vendor Details for Existing Customer (No email/password/OTP needed) */}
                  {step === 3 && userType === "existing_customer" && (
                    <>
                  <div className="mb-4">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      General information about your store
                      <span className="text-red-500 font-bold text-lg">*</span>
                    </label>
                    <div className="relative">
                      <textarea
                        placeholder="Enter your information about your store"
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(
                          event: React.ChangeEvent<HTMLTextAreaElement>
                        ) => {
                          updatePayload("bio", event.target.value);
                        }}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Store Name
                      <span className="text-red-500 font-bold text-lg">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter your Store's name"
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => updatePayload("company_name", event.target.value)}
                        required
                      />

                      <span className="absolute right-4 top-4">
                        <FaStore size={22} />
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Website URL
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="Enter your website URL"
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => updatePayload("website", event.target.value)}
                      />
                      <span className="absolute right-4 top-4 text-gray-500">
                        <FaGlobe size={22} />
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 p-7 bg-gray-2">
                    <form action="#" className="relative">
                      <h2 className="font-medium text-gray-700 text-center dark:text-black">
                        Upload Store Image
                      </h2>
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 z-50 m-0 h-full w-full cursor-pointer p-0 opacity-0 outline-none"
                        onChange={handleStoreFile}
                      />
                      <div className="flex flex-col items-center justify-center space-y-3">
                        {Payload.shop_image ? (
                          <div className="relative">
                            <img
                              src={URL.createObjectURL(Payload.shop_image)}
                              alt={Payload.shop_image.name}
                              className="h-20 w-20 object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveStoreFile}
                              className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              {/* Your SVG paths for the icon */}
                            </svg>
                          </span>
                        )}
                        <p>
                          <span className="text-primary">Click to upload</span>
                        </p>
                        {Payload.shop_image ? (
                          <p>{Payload.shop_image.name}</p>
                        ) : (
                          <>
                            <p className="mt-1.5">SVG, PNG, JPG, or GIF</p>
                            <p>(max, 800 X 800px)</p>
                          </>
                        )}
                      </div>
                    </form>
                  </div>

                  <div className="mb-4 ">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Street 1
                      <span className="text-red-500 font-bold text-lg">*</span>
                    </label>
                    <div className="relative">
                      <input
                        placeholder="Enter your street 1"
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => updatePayload("street1", event.target.value)}
                        required
                      />

                      <span className="absolute right-4 top-4">
                        <FaHome size={22} />
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 ">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Street 2
                    </label>
                    <div className="relative">
                      <input
                        placeholder="Enter your street 2"
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => updatePayload("street2", event.target.value)}
                      />

                      <span className="absolute right-4 top-4">
                        <FaHome size={22} />
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 ">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Country
                      <span className="text-red-500 font-bold text-lg">*</span>
                    </label>
                    <div className="relative">
                      <select
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(e) => handleCountrySelect(e.target.value)}
                        required
                      >
                        <option value="">Select your country</option>
                        {countries.map((country) => (
                          <option key={country.isoCode} value={country.isoCode}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-4 top-4">
                        <FaGlobeAmericas />
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 ">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      State
                      <span className="text-red-500 font-bold text-lg">*</span>
                    </label>
                    <div className="relative">
                      <select
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(e) => handleStateSelect(e.target.value)}
                        disabled={!states.length}
                        required
                      >
                        <option value="">Select your state</option>
                        {states.map((state) => (
                          <option key={state.isoCode} value={state.isoCode}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-4 top-4">
                        <FaMapPin />
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 ">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      City
                      <span className="text-red-500 font-bold text-lg">*</span>
                    </label>
                    <div className="relative">
                      <select
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(e) => updatePayload("city", e.target.value)}
                        disabled={!cities.length}
                        required
                      >
                        <option value="">Select your city</option>
                        {cities.map((city) => (
                          <option key={city.name} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-4 top-4">
                        <FaMapMarkerAlt size={22} />
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 ">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Zip Code
                      <span className="text-red-500 font-bold text-lg">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="Enter your zip code"
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => updatePayload("zip_code", event.target.value)}
                        required
                      />

                      <span className="absolute right-4 top-4 text-gray-500">
                        <FaSearch />
                      </span>
                    </div>
                  </div>

                  <div className="mb-5">
                    <button
                      type="submit"
                      className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90"
                    >
                      {loading ? "Creating Vendor Account..." : "Create Vendor Account"}
                    </button>
                  </div>

                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-primary"
                    >
                      ← Back
                    </button>
                  </div>

                  {/* Close Step 3 for existing customers */}
                  </>
                  )}

                  {/* Continue with Store Name for new users (Step 2) */}
                  {step === 2 && userType === "new_user" && (
                    <>
                  <div className="mb-4">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Store Name
                      <span className="text-red-500 font-bold text-lg">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter your Store's name"
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => updatePayload("company_name", event.target.value)}
                        required
                      />

                      <span className="absolute right-4 top-4">
                        <FaStore size={22} />
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 p-7 bg-gray-2">
                    <form action="#" className="relative">
                      <h2 className="font-medium text-gray-700 text-center dark:text-black">
                        Upload Store Image
                      </h2>
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 z-50 m-0 h-full w-full cursor-pointer p-0 opacity-0 outline-none"
                        onChange={handleStoreFile}
                      />
                      <div className="flex flex-col items-center justify-center space-y-3">
                        {Payload.shop_image ? (
                          <div className="relative">
                            <img
                              src={URL.createObjectURL(Payload.shop_image)}
                              alt={Payload.shop_image.name}
                              className="h-20 w-20 object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveStoreFile}
                              className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              {/* Your SVG paths for the icon */}
                            </svg>
                          </span>
                        )}
                        <p>
                          <span className="text-primary">Click to upload</span>
                        </p>
                        {Payload.shop_image ? (
                          <p>{Payload.shop_image.name}</p>
                        ) : (
                          <>
                            <p className="mt-1.5">SVG, PNG, JPG, or GIF</p>
                            <p>(max, 800 X 800px)</p>
                          </>
                        )}
                      </div>
                    </form>
                  </div>

                  <div className="mb-4 ">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Phone No.
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="Enter your Phone number"
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => updatePayload("phone_number", event.target.value)}
                      />

                      <span className="absolute right-4 top-4">
                        <FaPhone size={22} />
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 ">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Street 1
                      <span className="text-red-500 font-bold text-lg">*</span>
                    </label>
                    <div className="relative">
                      <input
                        placeholder="Enter your street 1"
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => updatePayload("street1", event.target.value)}
                        required
                      />

                      <span className="absolute right-4 top-4">
                        <FaHome size={22} />
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 ">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Street 2
                    </label>
                    <div className="relative">
                      <input
                        placeholder="Enter your street 2"
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => updatePayload("street2", event.target.value)}
                      />

                      <span className="absolute right-4 top-4">
                        <FaHome size={22} />
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 ">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Country
                    </label>
                    <div className="relative">
                      <select
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(e) => handleCountrySelect(e.target.value)}
                      >
                        <option value="">Select your country</option>
                        {countries.map((country) => (
                          <option key={country.isoCode} value={country.isoCode}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-4 top-4">
                        <FaGlobeAmericas />
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 ">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      State
                    </label>
                    <div className="relative">
                      <select
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(e) => handleStateSelect(e.target.value)}
                        disabled={!states.length}
                      >
                        <option value="">Select your state</option>
                        {states.map((state) => (
                          <option key={state.isoCode} value={state.isoCode}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-4 top-4">
                        <FaMapPin />
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 ">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      City
                    </label>
                    <div className="relative">
                      <select
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(e) => updatePayload("city", e.target.value)}
                        disabled={!cities.length}
                      >
                        <option value="">Select your city</option>
                        {cities.map((city) => (
                          <option key={city.name} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-4 top-4">
                        <FaMapMarkerAlt size={22} />
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 ">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Zip Code
                      <span className="text-red-500 font-bold text-lg">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="Enter your zip code"
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => updatePayload("zip_code", event.target.value)}
                        required
                      />

                      <span className="absolute right-4 top-4 text-gray-500">
                        <FaSearch />
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="mb-2.5 block font-medium text-black dark:text-white">
                      Website URL
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="Enter your website URL"
                        className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => updatePayload("website", event.target.value)}
                      />
                      <span className="absolute right-4 top-4 text-gray-500">
                        <FaGlobe size={22} />
                      </span>
                    </div>
                  </div>

                  <div className="w-full flex">
                    <div className="relative mb-4 w-1/2 mr-4">
                      <label className="mb-2.5 block font-medium text-black dark:text-white">
                        Password
                        <span className="text-red-500 font-bold text-lg">
                          *
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type={visible ? "text" : "password"}
                          placeholder="Enter your password"
                          className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                          onChange={(
                            event: React.ChangeEvent<HTMLInputElement>
                          ) => {
                            updatePayload("password", event.target.value);
                            setPasswordError("");
                          }}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => setPasswordFocused(false)}
                          required
                        />

                        <span
                          className="absolute right-4 top-4"
                          onClick={() => setVisible(!visible)}
                        >
                          {!visible ? (
                            <FaEyeSlash size={22} />
                          ) : (
                            <FaEye size={22} />
                          )}
                        </span>
                      </div>
                      {passwordError && (
                        <p className="text-red-500 text-sm mt-1">
                          {passwordError}
                        </p>
                      )}
                    </div>

                    <div className="mb-6 relative w-1/2">
                      <label className="mb-2.5 block font-medium text-black dark:text-white">
                        Re-type Password
                        <span className="text-red-500 font-bold text-lg">
                          *
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type={visible2 ? "text" : "password"}
                          placeholder="Re-enter your password"
                          className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                          onChange={(
                            event: React.ChangeEvent<HTMLInputElement>
                          ) => {
                            setConfirmPassword(event.target.value);
                            setPasswordCheck(
                              event.target.value === Payload.password ? 1 : 0
                            );
                          }}
                          required
                        />

                        <span
                          className="absolute right-4 top-4"
                          onClick={() => setVisible2(!visible2)}
                        >
                          {!visible2 ? (
                            <FaEyeSlash size={22} />
                          ) : (
                            <FaEye size={22} />
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <PasswordRequirementsFeedback
                    password={Payload.password}
                    userContext={{
                      email: Payload.email,
                      username: Payload.email,
                      first_name: Payload.first_name,
                      last_name: Payload.last_name,
                    }}
                    visible={passwordFocused || Payload.password.length > 0}
                  />
                  {PasswordCheck === 1 && !isError ? (
                    <>
                      <span className="inline-flex text-sm text-green-700 mb-4">
                        Password Matches
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                    </>
                  ) : null}
                  {PasswordCheck === 0 ? (
                    <>
                      <span className="inline-flex text-sm text-red-700 mb-4">
                        Password Does not match
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </span>
                    </>
                  ) : null}
                  {isError ? (
                    <>
                      <span className="inline-flex text-sm text-red-700 mb-4">
                        {errorMessage}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </span>
                    </>
                  ) : null}
                  <div className="mb-5">
                    <input
                      type="submit"
                      value={loading ? "Signing Up..." : "Create Account"}
                      className={`w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition ${
                        loading
                          ? "bg-gray-600 cursor-not-allowed"
                          : "hover:bg-opacity-90"
                      }`}
                      disabled={
                        loading ||
                        PasswordCheck !== 1 ||
                        !isPasswordValid(Payload.password, {
                          email: Payload.email,
                          username: Payload.email,
                          first_name: Payload.first_name,
                          last_name: Payload.last_name,
                        })
                      }
                    />
                  </div>

                  {/* <button className="flex w-full items-center justify-center gap-3.5 rounded-lg border border-stroke bg-gray p-4 hover:bg-opacity-50 dark:border-strokedark dark:bg-meta-4 dark:hover:bg-opacity-50 cursor-not-allowed">
                  <span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_191_13499)">
                        <path
                          d="M19.999 10.2217C20.0111 9.53428 19.9387 8.84788 19.7834 8.17737H10.2031V11.8884H15.8266C15.7201 12.5391 15.4804 13.162 15.1219 13.7195C14.7634 14.2771 14.2935 14.7578 13.7405 15.1328L13.7209 15.2571L16.7502 17.5568L16.96 17.5774C18.8873 15.8329 19.9986 13.2661 19.9986 10.2217"
                          fill="#4285F4"
                        />
                        <path
                          d="M10.2055 19.9999C12.9605 19.9999 15.2734 19.111 16.9629 17.5777L13.7429 15.1331C12.8813 15.7221 11.7248 16.1333 10.2055 16.1333C8.91513 16.1259 7.65991 15.7205 6.61791 14.9745C5.57592 14.2286 4.80007 13.1801 4.40044 11.9777L4.28085 11.9877L1.13101 14.3765L1.08984 14.4887C1.93817 16.1456 3.24007 17.5386 4.84997 18.5118C6.45987 19.4851 8.31429 20.0004 10.2059 19.9999"
                          fill="#34A853"
                        />
                        <path
                          d="M4.39899 11.9777C4.1758 11.3411 4.06063 10.673 4.05807 9.99996C4.06218 9.32799 4.1731 8.66075 4.38684 8.02225L4.38115 7.88968L1.19269 5.4624L1.0884 5.51101C0.372763 6.90343 0 8.4408 0 9.99987C0 11.5589 0.372763 13.0963 1.0884 14.4887L4.39899 11.9777Z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M10.2059 3.86663C11.668 3.84438 13.0822 4.37803 14.1515 5.35558L17.0313 2.59996C15.1843 0.901848 12.7383 -0.0298855 10.2059 -3.6784e-05C8.31431 -0.000477834 6.4599 0.514732 4.85001 1.48798C3.24011 2.46124 1.9382 3.85416 1.08984 5.51101L4.38946 8.02225C4.79303 6.82005 5.57145 5.77231 6.61498 5.02675C7.65851 4.28118 8.9145 3.87541 10.2059 3.86663Z"
                          fill="#EB4335"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_191_13499">
                          <rect width="20" height="20" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </span>
                  Sign up with Google
                </button> */}

                  {/* Show "Already have an account" for new user signup only */}
                  {userType === "new_user" && (
                    <div className="mt-6 text-center">
                      <p>
                        Already have an account?{" "}
                        <Link
                          className=" text-primary self-end"
                          href="/"
                          onClick={() => setAuthpage("signin")}
                        >
                          Sign In
                        </Link>
                      </p>
                    </div>
                  )}
                  
                  {/* Close the conditional rendering block for Step 2/3 */}
                  </>
                  )}
        </form>
      </AuthLayout>
      <ToastContainer />
      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Loader />
        </div>
      )}
    </>
  );
};

export default SignUp;
