"use client";
import { useContext, useEffect, useState } from "react";
import { MyContext } from "./providers/context";
import SignIn from "./auth/signin/page";
import { useRouter } from "next/navigation";
import SignUp from "./auth/signup/page";
import ForgotPassword from "./auth/forgot-password/page";
import ResetPassword from "./auth/reset-password/page";
import RegisterAsVendor from "./auth/register-as-vendor.tsx/page";
import Loader from "@/components/common/Loader";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {
  const { loggedIn, authPage, authReady } = useContext(MyContext);
  const [authPageState, setAuthPageState] = useState<JSX.Element | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (authReady && loggedIn) {
      router.replace("/dashboard");
    }
  }, [authReady, loggedIn, router]);

  useEffect(() => {
    switch (authPage) {
      case "signin":
        setAuthPageState(<SignIn />);
        break;
      case "signup":
        setAuthPageState(<SignUp />);
        break;
      case "forgot":
        setAuthPageState(<ForgotPassword />);
        break;
      case "reset":
        setAuthPageState(<ResetPassword />);
        break;
      case "register-as-vendor":
        setAuthPageState(<RegisterAsVendor />);
        break;
      default:
        setAuthPageState(<SignIn />);
        break;
    }
  }, [authPage]);

  if (!authReady || loggedIn) {
    return <Loader />;
  }

  return <>{authPageState}</>;
}
