/** Max plain-text length for product short description (matches backend / UX). */
export const SHORT_DESCRIPTION_MAX_PLAIN = 255;

/** Safe slice for user-visible length (handles emoji / astral chars). */
export function truncateUnicodePlain(plain: string, maxLen: number): string {
  return Array.from(plain).slice(0, maxLen).join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Minimal HTML Quill accepts when trimming over-limit paste to plain text. */
export function plainToQuillShortDescriptionHtml(plain: string): string {
  const esc = escapeHtml(plain);
  const withBreaks = esc.replace(/\n/g, "<br/>");
  return `<p>${withBreaks}</p>`;
}

/** Plain-text length of stored HTML (client-only; used for counter on load). */
export function plainTextLengthFromHtml(html: string): number {
  if (typeof document === "undefined") return 0;
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || "").length;
}
