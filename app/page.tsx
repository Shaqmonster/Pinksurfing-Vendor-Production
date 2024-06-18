// pages/index.tsx or the relevant file
"use client";
import { useContext, useEffect, useState } from "react";
import { MyContext } from "./providers/context";
import SignIn from "./auth/signin/page";
import { redirect, usePathname, useRouter } from "next/navigation";
import { getProducts } from "@/api/products";
import SignUp from "./auth/signup/page";
import Products from "./inventory/products/page";
import { Product } from "@/types/product";
import 'react-toastify/dist/ReactToastify.css';

export default function Home() {
  const { loggedIn, setIsLoggedIn, authPage } = useContext(MyContext);
  const [authPageState, setAuthPageState] = useState(<SignIn />);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const access = localStorage.getItem("access");
      const vendor_id = localStorage.getItem("vendor_id");

      if (!access || !vendor_id) {
        setIsLoggedIn(false);
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
            router.push("/")
          }
        })
        .catch((err) => {
          console.error(err);
          setIsLoggedIn(false);
          router.push("/")
        })
        .finally(() => setLoading(false));
    }
  }, [setIsLoggedIn, router]);

  useEffect(() => {
    setAuthPageState(authPage === "signin" ? <SignIn /> : <SignUp />);
  }, [authPage]);

  return <>{loggedIn ? <Products products={products} loading={loading} /> : authPageState}</>;
}
