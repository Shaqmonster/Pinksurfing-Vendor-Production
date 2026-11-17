/** Names of required listing fields (e.g. a perfume's Concentration and Gender) left empty. */
export function missingRequiredAttributes(attrs: any[]): string[] {
  return (attrs || [])
    .filter((a) => a?.required)
    .filter((a) => {
      const v = a.value;
      if (Array.isArray(v)) return v.length === 0;
      if (typeof v === "boolean") return false;
      return v === null || v === undefined || String(v).trim() === "";
    })
    .map((a) => String(a.name || a.key || "A required field"));
}
