"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Demo TailAdmin route — gated from production navigation. */
export default function FormElementsDemoRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return null;
}
