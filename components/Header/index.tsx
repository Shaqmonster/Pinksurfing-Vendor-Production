"use client"
import Link from "next/link";
import DarkModeSwitcher from "./DarkModeSwitcher";
import DropdownMessage from "./DropdownMessage";
import DropdownNotification from "./DropdownNotification";
import DropdownUser from "./DropdownUser";
import Image from "next/image";
import { MyContext } from "@/app/providers/context";
import { usePathname } from "next/navigation";
import { getProfile, refreshToken } from "@/api/account";
import { useContext, useEffect, useMemo, useState } from "react";
import { getProducts } from "@/api/products";
import { useRouter } from "next/navigation";


const Header = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
  loggedIn: boolean | undefined ;
}) => {
  // const { loggedIn } = useContext(MyContext)
  const pathname = usePathname();
  const router = useRouter()
  const {setAuthpage , authPage , vendor} = useContext(MyContext)
  const [ profile, setProfile ] = useState()
  const [Logged, setLogged] = useState(false)
  const [tokens, setTokens] = useState({
    access:"" || null,
    "vendor_id":""||null,
    "refresh":""||null
  })
  useEffect(()=>{
      
  },[])
useEffect(()=>{
  let access : string | null ="", vendor_id: string | null ="";
  if(typeof window !== 'undefined'){
   access = localStorage.getItem('access');
   vendor_id = localStorage.getItem('vendor_id');
   if(pathname !== '/' && ['inventory','profile','orders','settings'].includes('pathname')){
    setLogged(true)
   }else if(pathname === '/'){
      setLogged(false)
   }
   if(!access || !vendor_id){
    router.push('/')
    setLogged(false)
    return 
  }else{
    setLogged(true)
    setTokens((token:any)=>{
     return {...token,
     access,
     vendor_id}
    })
  }
  }
},[pathname])
useMemo(() => {
  getProfile(tokens.access)
    .then((data: any) => {
      if (data && 'response' in data && data.response && data.response.status >= 400) {
        // setLogged(false)
        try {
          let refresh = localStorage.getItem('refresh');
          if (!refresh) {
            setLogged(false);
            router.push('/');
            return null;
          }
          refreshToken(String(tokens.access), refresh)
            .then(token => {
              localStorage.setItem('access', token?.access);
              setTokens((_token) => {
                return {
                  ..._token,
                  access: token.access,
                };
              });
              setLogged(true);
            });
        } catch (e) {
          setLogged(false);
          router.push('/');
        }
      }
      if (data && 'data' in data) {
        let Profile = data.data;
        console.log(Profile);
        if (typeof Profile == 'object') {
          setProfile(Profile);
        }
      }
    })
    .catch(error => {
      console.error("Error fetching profile:", error);
    });
}, [tokens.access, tokens.vendor_id]);

  

  return (
    <header className="sticky top-0 z-999 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
          {/* <!-- Hamburger Toggle BTN --> */}
          {
          Logged? 
          (
            <>
        <div className="flex items-center gap-2 sm:gap-4 ">

          <button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              props.setSidebarOpen(!props.sidebarOpen);
            }}
            className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
          >
            <span className="relative block h-5.5 w-5.5 cursor-pointer">
              <span className="du-block absolute right-0 h-full w-full">
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-[0] duration-200 ease-in-out dark:bg-white ${
                    !props.sidebarOpen && "!w-full delay-300"
                  }`}
                ></span>
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-150 duration-200 ease-in-out dark:bg-white ${
                    !props.sidebarOpen && "delay-400 !w-full"
                  }`}
                ></span>
                <span
                  className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-200 duration-200 ease-in-out dark:bg-white ${
                    !props.sidebarOpen && "!w-full delay-500"
                  }`}
                ></span>
              </span>
              <span className="absolute right-0 h-full w-full rotate-45">
                <span
                  className={`absolute left-2.5 top-0 block h-full w-0.5 rounded-sm bg-black delay-300 duration-200 ease-in-out dark:bg-white ${
                    !props.sidebarOpen && "!h-0 !delay-[0]"
                  }`}
                ></span>
                <span
                  className={`delay-400 absolute left-0 top-2.5 block h-0.5 w-full rounded-sm bg-black duration-200 ease-in-out dark:bg-white ${
                    !props.sidebarOpen && "!h-0 !delay-200"
                  }`}
                ></span>
              </span>
            </span>
          </button>
          
      {
        !props.sidebarOpen ?
          (<>
          <Link className="block flex flex-row lg:hidden" href="/">
            <Image
              width={32}
              height={32}
              src={"/images/bitcoin.png"}
              alt="Logo"
            />
        <h2 className="ml-2 pt-1 text-align font-bold">PinkSurfing</h2>
          </Link>
        </>):null
      }
        </div>
        <div className="hidden sm:block">
          <form>
            <div className="relative">
              <button className="absolute left-0 top-1/2 -translate-y-1/2">
                <svg
                  className="fill-body hover:fill-primary dark:fill-bodydark dark:hover:fill-primary"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9.16666 3.33332C5.945 3.33332 3.33332 5.945 3.33332 9.16666C3.33332 12.3883 5.945 15 9.16666 15C12.3883 15 15 12.3883 15 9.16666C15 5.945 12.3883 3.33332 9.16666 3.33332ZM1.66666 9.16666C1.66666 5.02452 5.02452 1.66666 9.16666 1.66666C13.3088 1.66666 16.6667 5.02452 16.6667 9.16666C16.6667 13.3088 13.3088 16.6667 9.16666 16.6667C5.02452 16.6667 1.66666 13.3088 1.66666 9.16666Z"
                    fill=""
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M13.2857 13.2857C13.6112 12.9603 14.1388 12.9603 14.4642 13.2857L18.0892 16.9107C18.4147 17.2362 18.4147 17.7638 18.0892 18.0892C17.7638 18.4147 17.2362 18.4147 16.9107 18.0892L13.2857 14.4642C12.9603 14.1388 12.9603 13.6112 13.2857 13.2857Z"
                    fill=""
                  />
                </svg>
              </button>

              <input
                type="text"
                placeholder="Type to search..."
                className="w-full bg-transparent pl-9 pr-4 font-medium focus:outline-none xl:w-125"
              />
            </div>
          </form>
        </div>
          

        <div className="flex items-center gap-3 2xsm:gap-7">
          <ul className="flex items-center gap-2 2xsm:gap-4">
            {/* <!-- Dark Mode Toggler --> */}
            <DarkModeSwitcher />
            {/* <!-- Dark Mode Toggler --> */}

            {/* <!-- Notification Menu Area --> */}
            <DropdownNotification />
            {/* <!-- Notification Menu Area --> */}
          </ul>

          {/* <!-- User Area --> */}
          <DropdownUser setLogged={setLogged} />
          {/* <!-- User Area --> */}
        </div>
        </>
         ) : (
         <div className="flex w-full flex-grow justify-end gap-2 sm:gap-4 ">
           {authPage === 'signin' ? (
             <Link className="font-bold text-primary self-end" href="/" onClick={() => setAuthpage('signup')}>
               Signup
             </Link>
           ) : (
             <Link className="font-bold text-primary self-end" href="/" onClick={() => setAuthpage('signin')}>
               Sign in
             </Link>
           )}
         </div>
       )}
      </div>
    </header>
  );
};

export default Header;
