"use client";
// MyProvider.tsx
import { useState, Dispatch, SetStateAction, useEffect } from "react";
import { MyContext } from "./context";

const MyProvider = ({
  setLoggedIn,

  children,
}: {
  setLoggedIn: (loggedIn: boolean) => void;

  children: React.ReactNode;
}) => {
  const [loggedIn, setIsLoggedIn] = useState(false);
  const [authPage, setAuthpage] = useState("signin");
  const [resetEmail, setResetEmail] = useState("")
  const [vendor, setVendor] = useState();

  useEffect(() => {
    setLoggedIn(loggedIn);
  }, [loggedIn, setLoggedIn]);

  return (
    <MyContext.Provider
      value={{
        loggedIn,
        setIsLoggedIn,
        resetEmail,
        setResetEmail,
        setAuthpage,
        authPage,
        vendor,
        setVendor,
      }}
    >
      {children}
    </MyContext.Provider>
  );
};

export default MyProvider;
