"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MyContext } from "@/app/providers/context";
import { getCookie } from "@/utils/cookies";
import { isVendor } from "@/api/account";
import Loader from "./common/Loader";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { loggedIn, setIsLoggedIn, setAuthpage } = useContext(MyContext);
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Allow access to auth pages without checking
      const publicPaths = ["/", "/auth/signin", "/auth/signup", "/auth/forgot-password", "/auth/reset-password", "/auth/register-as-vendor.tsx"];
      
      if (publicPaths.some(path => pathname === path || pathname.startsWith("/auth/"))) {
        setIsChecking(false);
        return;
      }

      // For protected routes, verify vendor status
      const access = getCookie("access_token");
      
      if (!access) {
        console.log("ProtectedRoute: No access token, redirecting to login");
        setIsLoggedIn(false);
        router.push("/");
        return;
      }

      const vendorCheck = await isVendor(access);
      
      if (!vendorCheck.success || !vendorCheck.isVendor) {
        console.log("ProtectedRoute: User is not a vendor, redirecting to signup");
        setIsLoggedIn(false);
        setAuthpage("signup");
        router.push("/");
        return;
      }

      console.log("ProtectedRoute: User is verified vendor, allowing access");
      setIsLoggedIn(true);
      setIsChecking(false);
    };

    checkAuth();
  }, [pathname, router, setIsLoggedIn, setAuthpage]);

  // Show loader while checking auth for protected routes
  const publicPaths = ["/", "/auth/signin", "/auth/signup", "/auth/forgot-password", "/auth/reset-password", "/auth/register-as-vendor.tsx"];
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith("/auth/"));
  
  if (!isPublicPath && isChecking) {
    return <Loader />;
  }

  // If not logged in and trying to access protected route, don't render children
  if (!isPublicPath && !loggedIn && !isChecking) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
