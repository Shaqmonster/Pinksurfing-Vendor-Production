"use client";
import "./globals.css";
import "./data-tables-css.css";
import "./satoshi.css";
import { useState, useEffect , useRef , useContext, useCallback } from "react";
import Loader from "@/components/common/Loader";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

import MyProvider from "./providers/ContextProvider";
import { MyContext } from "./providers/context";
import SignIn from "./auth/signin/page";
import { redirect , usePathname } from "next/navigation";
import { ToastContainer } from "react-toastify";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState<boolean>(false);

  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  const [authPage , setAuthPage ] = useState(<SignIn/>);

  const pathname = usePathname();
  
  const bodyScrollCallback = useCallback((loggedIn: boolean) => {
    setLoggedIn(loggedIn);
  }, []);

  useEffect(()=>{
  let access : string | null ="", vendor_id: string | null ="";
  if(typeof window !== 'undefined'){
   access = localStorage.getItem('access');
   vendor_id = localStorage.getItem('vendor_id');
   if(!access || !vendor_id){
    setLoggedIn(false)
   }
  }
  },[])

  useEffect(()=>{
    loggedIn && pathname.includes('/auth/signup') ? 
    redirect('/Stripe')
    :null
  })
  
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <MyProvider setLoggedIn={bodyScrollCallback}>
        <div className="dark:bg-boxdark-2 dark:text-bodydark">
          {loading ? 
          (
            <Loader/>
          ) :
          (
            <div className="flex h-screen overflow-hidden">
              {/* <!-- ===== Sidebar Start ===== --> */}
              { loggedIn ? 
                <Sidebar
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                /> : null
              }
              {/* <!-- ===== Sidebar End ===== --> */}

              {/* <!-- ===== Content Area Start ===== --> */}
              <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                {/* <!-- ===== Header Start ===== --> */}
                <Header
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                  loggedIn={loggedIn}
                />
                {/* <!-- ===== Header End ===== --> */}

                {/* <!-- ===== Main Content Start ===== --> */}
                <main>
                  <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                    {children}
                  </div>
                </main>
                {/* <!-- ===== Main Content End ===== --> */}
              </div>
              {/* <!-- ===== Content Area End ===== --> */}
            </div>
          )
          
          }
        </div>
        </MyProvider>
        <ToastContainer />
      </body>
    </html>
  );
      
}
