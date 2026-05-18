/** Auto file names for NDA listing uploads: `{TypePrefix}_{YYYY-MM-DD}.{ext}` */

const TYPE_PREFIX: Record<string, string> = {
  pl_statement: "PNL",
  tax_returns: "Tax_Returns",
  revenue_breakdown: "Revenue_Breakdown",
  cim: "CIM",
  bank_statements: "Bank_Statements",
  lease_agreement: "Lease_Agreement",
  franchise_agreement: "Franchise_Agreement",
  asset_list: "Asset_List",
  other: "Document",
};

export function buildNdaDocumentDisplayName(
  documentType: string,
  originalFileName: string
): string {
  const prefix = TYPE_PREFIX[documentType] || TYPE_PREFIX.other;
  const date = new Date().toISOString().slice(0, 10);
  const parts = originalFileName.split(".");
  const ext =
    parts.length > 1 && parts[parts.length - 1]
      ? `.${parts[parts.length - 1].toLowerCase()}`
      : "";
  return `${prefix}_${date}${ext}`;
}
