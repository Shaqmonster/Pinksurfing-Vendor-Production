"use client";
import { useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MyContext } from "@/app/providers/context";
import { getVendorProfile } from "@/api/products";
import { logout as logoutAPI } from "@/api/account";
import { deleteCookie } from "@/utils/cookies";
import { FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";
import { MdKeyboardArrowDown } from "react-icons/md";
import { getCookie } from "@/utils/cookies";
const DropdownUser = ({ setLogged }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { setIsLoggedIn } = useContext(MyContext);
  const vendor = JSON.parse(localStorage.getItem("store") || "{}");
  const router = useRouter();
  const trigger = useRef(null);
  const dropdown = useRef(null);

  const tokenFromLocalStorage =
    typeof window !== "undefined" ? getCookie("access_token") : null;
  const [token, setToken] = useState(tokenFromLocalStorage);

  const [user, setUser] = useState({
    contact_person_name: "",
    store_name: "",
    profile_picture: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await getVendorProfile(token);
        if (!error) {
          console.log("Profile Data:", data);
          const storedData = localStorage.getItem("store");
          if (!storedData) {
            localStorage.setItem("store", JSON.stringify(data));
          }
          setUser({
            contact_person_name: data.contact_person_name,
            store_name: data.store_name,
            profile_picture: data.profile_picture,
          });
        } else {
          console.error("Error fetching profile:", error);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    };

    fetchProfile();
  }, [token]);

  const signout = async () => {
    if (typeof window !== "undefined") {
      const token = getCookie("access_token");
      
      // Call logout API to clear session on server
      if (token) {
        try {
          await logoutAPI(token);
          console.log("Successfully logged out from server");
        } catch (error) {
          console.error("Error logging out from server:", error);
        }
      }
      
      // Clear localStorage
      localStorage.removeItem("access");
      localStorage.removeItem("vendor_id");
      localStorage.removeItem("store");
      localStorage.removeItem("refresh");
      
      // Clear subdomain cookies
      const domain = window.location.hostname.includes('localhost') 
        ? undefined 
        : '.pinksurfing.com';
        
      deleteCookie("access_token", domain);
      deleteCookie("refresh_token", domain);
      deleteCookie("user_id", domain);
    }
    
    setIsLoggedIn(false);
    setLogged(false);
    window.location.href = "/";
  };

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!dropdown.current) return;
      if (
        !dropdownOpen ||
        dropdown.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setDropdownOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }) => {
      if (!dropdownOpen || keyCode !== 27) return;
      setDropdownOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  return (
    <div className="relative">
      <Link
        ref={trigger}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-4"
        href="#"
      >
        <span className="hidden text-right lg:block">
          <span className="block text-sm font-medium text-black dark:text-white">
            {user.store_name}
          </span>
          <span className="block text-xs">{user.contact_person_name}</span>
        </span>

        <span className="h-12 w-12 rounded-full overflow-hidden">
          <Image
            width={112}
            height={112}
            src={user.profile_picture || "/images/user/ic_dummy_user.png"}
            className="rounded-full aspect-square"
            alt="User"
          />
        </span>

        <MdKeyboardArrowDown
          className="hidden fill-current sm:block"
          size={24}
        />
      </Link>

      {/* <!-- Dropdown Start --> */}
      <div
        ref={dropdown}
        onFocus={() => setDropdownOpen(true)}
        onBlur={() => setDropdownOpen(false)}
        className={`absolute right-0 mt-4 flex w-62.5 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark ${
          dropdownOpen === true ? "block" : "hidden"
        }`}
      >
        <ul className="flex flex-col gap-5 border-b border-stroke px-6 py-7.5 dark:border-strokedark">
          <li>
            <Link
              href="/profile"
              className="flex items-center gap-3.5 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base"
            >
              <FaUser className="fill-current" size={22} />
              My Profile
            </Link>
          </li>
          <li>
            <Link
              href="/settings"
              className="flex items-center gap-3.5 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base"
            >
              <FaCog className="fill-current" size={22} />
              Settings
            </Link>
          </li>
          <li>
            <button
              onClick={signout}
              className="flex items-center gap-3.5 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base"
            >
              <FaSignOutAlt className="fill-current" size={22} />
              Sign Out
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DropdownUser;
