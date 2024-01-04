"use client"
import { useContext, useEffect, useRef, useState } from "react";
import Products from "./inventory/products/page";
import { MyContext } from "./providers/context";
import SignIn from "./auth/signin/page";
import { redirect, usePathname, useRouter } from "next/navigation";
import { getProducts } from "@/api/products";
import SignUp from "./auth/signup/page";


export default function Home() {
  const {loggedIn, setIsLoggedIn , authPage} = useContext(MyContext);
  const [ authPageState , setAuthPageState ] = useState(<SignIn/>)

  const [products, setProducts] = useState({});
  const access = useRef('access')
  const vendor_id = useRef('vendor_id')
  const router = useRouter()
  const pathname = usePathname();
  
  useEffect(()=>{
    if(typeof window !== 'undefined'){
     access.current =  `${localStorage.getItem('access')}`;
     vendor_id.current = `${localStorage.getItem('vendor_id')}`;
     if(!access.current.length || !vendor_id.current.length){
      setIsLoggedIn(false)
     }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access, vendor_id])
  
  useEffect(() => {
    if(access.current?.length && vendor_id.current?.length){
    getProducts(access.current, vendor_id.current)
    .then(response=>{
      console.log(response)
      if(response.status < 205 ){
        // setIsLoggedIn(true)
        setIsLoggedIn(true)
        if('Products' in response.data && response.data.Products.length){
        setProducts(response.data.Products)
        
      }else{
        if(pathname === '/inventory/products'){
        redirect('/inventory/add_products')
      }
      }
      
    }else{
      setIsLoggedIn(false)
        redirect('/')
    }
    })
    .catch(err=>console.error(err))
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access, loggedIn , vendor_id, router]);

  useEffect(()=>{
    (authPage === 'signin') ?
    setAuthPageState(<SignIn />)
    :
    setAuthPageState(<SignUp />)
    
    
  },[authPage])


  return (
    <>
    {
    loggedIn ? 
      (<Products />):
      authPageState
    }
    </>
  );
}
