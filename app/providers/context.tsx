"use client";
import { createContext, Dispatch, SetStateAction } from "react";

interface IMyContext {
  loggedIn: boolean;
  authPage: string;
  resetEmail: string;
  setResetEmail: Dispatch<SetStateAction<string>>;
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
  setAuthpage: Dispatch<SetStateAction<string>>;
  vendor: any;
  setVendor: Dispatch<SetStateAction<any>>;
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
}

export const MyContext = createContext<IMyContext>({
  loggedIn: false,
  authPage: "signIn",
  resetEmail: "",
  setResetEmail: () => {},
  setIsLoggedIn: () => {},
  setAuthpage: () => {},
  vendor: {},
  setVendor: () => {},
  sidebarOpen: false,
  setSidebarOpen: () => {},
});
