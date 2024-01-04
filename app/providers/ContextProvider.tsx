"use client"
// MyProvider.tsx
import { useState , Dispatch, SetStateAction, useEffect } from 'react';
import { MyContext } from './context';

const MyProvider = ({
    setLoggedIn,
    
    children,
  }: {
    setLoggedIn:(loggedIn:boolean)=>void,
    
    children: React.ReactNode;
  }) => {
 const [ loggedIn , setIsLoggedIn ] = useState(true)
 const [ authPage , setAuthpage ] = useState('signin');
 const [ vendor , setVendor ] = useState();

 useEffect(()=>{
    setLoggedIn(loggedIn)
 },[loggedIn, setLoggedIn])

 return (
   <MyContext.Provider value={{loggedIn, setIsLoggedIn , setAuthpage , authPage, vendor, setVendor}}>
     {children}
   </MyContext.Provider>
 );
};

export default MyProvider;
