/**
 * Advanced spec fields hidden per subcategory because Product Type already captures them.
 * Example: "DDR5 RAM" product type makes Memory Type + Interface redundant.
 */
export const HIDDEN_ADVANCED_FIELDS_BY_SUBCATEGORY: Record<string, string[]> = {
  "memory-semiconductors": [
    "memory_type",
    "storage_type",
    "interface_type",
    "read_speed",
    "write_speed",
  ],
  "ssds-storage": [
    "memory_type",
    "storage_type",
    "interface_type",
    "latency",
    "speed_frequency",
    "rgb",
    "ecc_supported",
  ],
  "computer-parts": ["memory_type", "storage_type"],
  "oem-bulk-electronics": ["memory_type", "storage_type", "interface_type"],
};

export function filterVisibleAdvancedAttributes(
  subcategoryId: string | undefined,
  attributes: Array<{ key?: string; section?: string }>
) {
  const hidden = HIDDEN_ADVANCED_FIELDS_BY_SUBCATEGORY[subcategoryId || ""] || [];
  return attributes.filter(
    (attr) => attr.section !== "advanced_specs" || !hidden.includes(attr.key || "")
  );
}
