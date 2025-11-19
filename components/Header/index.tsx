"use client";
import Link from "next/link";
import DarkModeSwitcher from "./DarkModeSwitcher";
import DropdownUser from "./DropdownUser";
import Image from "next/image";
import { MyContext } from "@/app/providers/context";
import { usePathname } from "next/navigation";
import { getProfile, refreshToken } from "@/api/account";
import { useContext, useEffect, useMemo, useState } from "react";
import { getProducts } from "@/api/products";
import { useRouter } from "next/navigation";
import { FiBell, FiMenu, FiSearch } from "react-icons/fi";
import Sidebar from "../Sidebar";
import { getCookie } from "@/utils/cookies";

const Header = (props: { loggedIn: boolean | undefined }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { setAuthpage, authPage, vendor, setSidebarOpen, sidebarOpen } =
    useContext(MyContext);
  const [profile, setProfile] = useState();
  const [Logged, setLogged] = useState(false);
  const [tokens, setTokens] = useState({
    access: "" || null,
    vendor_id: "" || null,
    refresh: "" || null,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log(sidebarOpen);
      let access = getCookie("access_token");
      let vendor_id = localStorage.getItem("vendor_id");
      if (
        pathname !== "/" &&
        ["inventory", "profile", "orders", "settings"].includes(pathname)
      ) {
        setLogged(true);
      } else if (pathname === "/") {
        setLogged(false);
      }
      if (!access || !vendor_id) {
        router.push("/");
        setLogged(false);
        return;
      } else {
        setLogged(true);
        setTokens((token: any) => {
          return { ...token, access, vendor_id };
        });
      }
    }
  }, [pathname]);

  useMemo(() => {
    getProfile(tokens.access)
      .then((data: any) => {
        if (
          data &&
          "response" in data &&
          data.response &&
          data.response.status >= 400
        ) {
          try {
            if (typeof window !== "undefined") {
              let refresh = getCookie("refresh_token");
              if (!refresh) {
                setLogged(false);
                router.push("/");
                return null;
              }
              refreshToken(String(tokens.access), refresh).then((token) => {
                localStorage.setItem("access", token?.access);
                setTokens((_token) => {
                  return {
                    ..._token,
                    access: token.access,
                  };
                });
                setLogged(true);
              });
            }
          } catch (e) {
            if (typeof window !== "undefined") {
              setLogged(false);
              router.push("/");
            }
          }
        }
        if (data && "data" in data) {
          let Profile = data.data;
          console.log(Profile);
          if (typeof Profile == "object") {
            setProfile(Profile);
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching profile:", error);
      });
  }, [tokens.access, tokens.vendor_id]);

  return (
    <>
      <header className="sticky top-0 z-999 flex w-full bg-white drop-shadow-1 dark:bg-primary dark:drop-shadow-none">
        <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
          {/* <!-- Hamburger Toggle BTN --> */}
          {Logged ? (
            <>
              <div className="flex items-center gap-2 sm:gap-4 ">
                <button
                  aria-controls="sidebar"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSidebarOpen(!sidebarOpen);
                  }}
                  className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
                >
                  <FiMenu size={24} className="text-black dark:text-white" />
                </button>
                <>
                  <Link className="flex flex-row" href="/dashboard">
                    <img
                      width={46}
                      height={46}
                      className=""
                      src={"/logo.jpg"}
                      alt="Logo"
                    />
                  </Link>
                </>
              </div>
              <div className="flex items-center gap-3 2xsm:gap-7">
                <ul className="flex items-center gap-2 2xsm:gap-4">
                  <DarkModeSwitcher />
                </ul>
                {/* <button className="text-gray-600 dark:text-gray-400">
                  <FiSearch size={20} />
                </button>
                <FiBell
                  size={20}
                  className="cursor-pointer text-gray-600 dark:text-gray-400"
                /> */}
                {
                  Logged && (
                    <DropdownUser setLogged={setLogged} />
                  )
                }
              </div>
            </>
          ) : (
            <div className="flex w-full flex-grow justify-end gap-2 sm:gap-4 ">
              {authPage === "signin" ? (
                <Link
                  className="font-bold text-primary self-end"
                  href="/"
                  onClick={() => setAuthpage("signup")}
                >
                  Signup
                </Link>
              ) : (
                <Link
                  className="font-bold text-primary self-end"
                  href="/"
                  onClick={() => setAuthpage("signin")}
                >
                  Sign in
                </Link>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
