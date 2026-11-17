/** Price with thousands separators and 2 decimals, e.g. 320000 -> "320,000.00". */
export const money = (v: string | number | null | undefined): string => {
  const n = Number(v);
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";
};
