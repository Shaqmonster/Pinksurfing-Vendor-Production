"use client";

import { useState, useEffect , useRef , useContext, useCallback } from "react";
import Loader from "@/components/common/Loader";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

import MyProvider from "../../app/providers/ContextProvider";
import { MyContext } from "../../app/providers/context";
import { redirect , usePathname } from "next/navigation";

export default function Layout({
    children
}: {
  children: React.ReactNode;
}) {

  const [loading, setLoading] = useState<boolean>(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pathname = usePathname();
  
  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
          {loading ? 
          (
            <Loader/>
          ) :
          (
            <div className="flex h-screen overflow-hidden">
              {/* <!-- ===== Sidebar Start ===== --> */}
              
                <Sidebar
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                /> 
              
              {/* <!-- ===== Sidebar End ===== --> */}

              {/* <!-- ===== Content Area Start ===== --> */}
              <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                {/* <!-- ===== Header Start ===== --> */}
                <Header
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen} loggedIn={true}                />
                
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
  )
}
