"use client";
import {createContext , Dispatch , SetStateAction} from 'react';

interface IMyContext {
    loggedIn: boolean;
    authPage: string;
    setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
    setAuthpage: Dispatch<SetStateAction<string>>;
    vendor:any;
    setVendor : Dispatch<SetStateAction<any>>;
   }
   
export const MyContext = createContext<IMyContext>({
    loggedIn: false,
    authPage:'signIn',
    setIsLoggedIn: ()=>{},
    setAuthpage: ()=>{},
    vendor:{},
    setVendor:()=>{}
   });