"use client";

import { useEffect } from "react";

const RELOAD_KEY = "ps_vendor_chunk_reload";

function isChunkLoadError(reason: unknown): boolean {
  if (!reason) return false;
  const name = typeof reason === "object" && reason !== null && "name" in reason
    ? String((reason as { name?: string }).name)
    : "";
  const message =
    typeof reason === "string"
      ? reason
      : typeof reason === "object" && reason !== null && "message" in reason
        ? String((reason as { message?: string }).message)
        : "";

  return (
    name === "ChunkLoadError" ||
    message.includes("ChunkLoadError") ||
    message.includes("Loading chunk") ||
    message.includes("Failed to fetch dynamically imported module")
  );
}

/** After a deploy, cached JS may request old chunk files — reload once to pick up the new build. */
export default function ChunkLoadRecovery() {
  useEffect(() => {
    const tryRecover = (reason: unknown) => {
      if (!isChunkLoadError(reason)) return;
      if (sessionStorage.getItem(RELOAD_KEY) === "1") return;
      sessionStorage.setItem(RELOAD_KEY, "1");
      window.location.reload();
    };

    const onError = (event: ErrorEvent) => {
      tryRecover(event.error ?? event.message);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      tryRecover(event.reason);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
