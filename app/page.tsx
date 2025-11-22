// pages/index.tsx or the relevant file
"use client";
import { useContext, useEffect, useState, useRef } from "react";
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
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    // Prevent running multiple times
    if (hasCheckedAuth.current) return;
    
    const checkAuthAndFetchProducts = async () => {
      if (typeof window !== "undefined") {
        hasCheckedAuth.current = true;
        
        // Check for tokens from cookies (SSO) or localStorage
        let access = getCookie("access_token");
        let vendor_id = localStorage.getItem("vendor_id");
        let refresh = getCookie("refresh_token");
        
        console.log("Auth check - access token:", access ? "found" : "not found");
        console.log("Auth check - vendor_id:", vendor_id ? "found" : "not found");

        // If vendor_id not in localStorage but we have access token, get user_id from cookie
        if (access && !vendor_id) {
          const cookieUserId = getCookie("user_id");
          if (cookieUserId) {
            vendor_id = cookieUserId;
            localStorage.setItem("vendor_id", cookieUserId);
            console.log("SSO: Stored user_id from cookie to localStorage");
          }
        }

        // Store tokens in localStorage if found in cookies
        if (access && !localStorage.getItem("access")) {
          localStorage.setItem("access", access);
          console.log("SSO: Stored access token to localStorage");
        }
        
        if (refresh && !localStorage.getItem("refresh")) {
          localStorage.setItem("refresh", refresh);
          console.log("SSO: Stored refresh token to localStorage");
        }

        // If still no tokens found, show login
        if (!access) {
          console.log("No access token found, showing login");
          setIsLoggedIn(false);
          setLoading(false); 
          return;
        }
        
        // Check if user is a vendor
        console.log("Checking vendor status...");
        const vendor_access = await isVendor(access);
        console.log("Vendor check result:", vendor_access);
        
        if (!vendor_access.success || !vendor_access.isVendor) {
          console.log("User is not a vendor, showing auth page");
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }

        console.log("User is a verified vendor, granting access");
        
        // User is a verified vendor
        setIsLoggedIn(true);
        
        // If user is on root page, redirect to dashboard
        if (pathname === "/") {
          setLoading(false);
          router.push("/dashboard");
          return;
        }

        // Fetch products for other pages
        getProducts(access, vendor_id)
          .then((response) => {
            if (response.status < 205) {
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
            }
          })
          .catch((err) => {
            console.error("Error fetching products:", err);
            setIsLoggedIn(false);
          })
          .finally(() => setLoading(false));
      }
    };
    
    checkAuthAndFetchProducts();
  }, []); // Run only once on mount

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
