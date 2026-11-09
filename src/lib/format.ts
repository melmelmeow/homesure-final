export const peso = (n: number | string | null | undefined): string =>
  n === null || n === undefined || n === "" ? "—" : `₱${Number(n).toLocaleString("en-PH", { maximumFractionDigits: 2 })}`;

export const shortDate = (v: string | null | undefined): string =>
  v ? new Date(v).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "—";

/** Query-string values can be string | string[] | undefined; take the first string or "". */
export const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] ?? "" : v ?? "");
