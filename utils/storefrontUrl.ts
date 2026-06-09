/** Main PinkSurfing marketplace URL (buyer-facing site). */
export function getStorefrontUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_STOREFRONT_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (process.env.NEXT_PUBLIC_ENV === "production") {
    return "https://pinksurfing.com";
  }

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5173";
  }

  return "https://dev.pinksurfing.com";
}
