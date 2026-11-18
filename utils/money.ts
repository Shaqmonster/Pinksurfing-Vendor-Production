/** Price with thousands separators; cents only when there are some, e.g. 320000 -> "320,000", 9.5 -> "9.50". */
export const money = (v: string | number | null | undefined): string => {
  const n = Number(v);
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })
    : "0";
};
