// pages/index.tsx or the relevant file
"use client";
import { useContext, useEffect, useState } from "react";
import { MyContext } from "./providers/context";
import SignIn from "./auth/signin/page";
import { redirect, usePathname, useRouter } from "next/navigation";
import { getProducts } from "@/api/products";
import SignUp from "./auth/signup/page";
import { Product } from "@/types/product";
import "react-toastify/dist/ReactToastify.css";
import Dashboard from "./dashboard/page";
import ForgotPassword from "./auth/forgot-password/page";
import ResetPassword from "./auth/reset-password/page";
import RegisterAsVendor from "./auth/register-as-vendor.tsx/page";
import Loader from "@/components/common/Loader";
import { getCookie } from "@/utils/cookies";
import { isVendor } from "@/api/account";
export default function Home() {
  const { loggedIn, setIsLoggedIn, authPage } = useContext(MyContext);
  const [authPageState, setAuthPageState] = useState<JSX.Element | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuthAndFetchProducts = async () => {
    if (typeof window !== "undefined") {
      // First check localStorage
      let access = getCookie("access_token");
      let vendor_id = localStorage.getItem("vendor_id");
      let refresh = getCookie("refresh_token");

      // If not in localStorage, check cookies (SSO from ecommerce site)
      if (!access) {
        const cookieAccess = getCookie("access_token");
        const cookieUserId = getCookie("user_id");
        const cookieRefresh = getCookie("refresh_token");

        if (cookieAccess && cookieUserId) {
          // Store cookie values in localStorage for future use
          localStorage.setItem("access", cookieAccess);
          localStorage.setItem("vendor_id", cookieUserId);
          if (cookieRefresh) {
            localStorage.setItem("refresh", cookieRefresh);
          }
          
          access = cookieAccess;
          vendor_id = cookieUserId;
          refresh = cookieRefresh;
          
          console.log("SSO: Tokens found in cookies, stored in localStorage");
        }
      }

      // If still no tokens found, show login
      if (!access) {
        setIsLoggedIn(false);
        setLoading(false); 
        return;
      }
      const vendor_access = await isVendor(access);
      if(!vendor_access.success){
        setIsLoggedIn(false);
        setLoading(false);
        setAuthPageState(<SignUp />);
        return;
      }

      // If user is logged in and on root page, redirect to dashboard
      if (pathname === "/" && access && vendor_access.success) {
        router.push("/dashboard");
        return;
      }

      getProducts(access, vendor_id)
        .then((response) => {
          if (response.status < 205) {
            setIsLoggedIn(true);
            const productsData = response.data.Products;
            if (productsData && productsData.length) {
              setProducts(productsData.slice(0, 10));
            } else {
              if (pathname === "/inventory/products") {
                redirect("/inventory/add_products");
              }
            }
          } else {
            setIsLoggedIn(false);
            router.push("/");
          }
        })
        .catch((err) => {
          console.error(err);
          setIsLoggedIn(false);
          router.push("/");
        })
        .finally(() => setLoading(false));
    }
    };
    checkAuthAndFetchProducts();
  }, []);

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

  if (loading) {
    return <Loader />; 
  }

  return <>{loggedIn ? <Dashboard /> : authPageState}</>;
}
