import { FEATURE_UNAVAILABLE, featureMetadata, type FeatureFormat } from "@/constants/featureMetadata";

export function normalizeSearchName(value: string): string {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

export function formatCompanyDisplayName(value: string): string {
  const trimmed = value.trim();
  const displayName = trimmed.replace(/^(?:주식회사\s*|\(주\)\s*|㈜\s*)/, "").trim();
  return displayName || trimmed;
}

export function formatNumber(value: number | string | null | undefined, digits = 1): string {
  if (value === null || value === undefined || value === "") return "-";
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return String(value);
  return number.toLocaleString("ko-KR", { maximumFractionDigits: digits });
}

export function formatPercent(value: number | string | null | undefined, digits = 1): string {
  if (value === null || value === undefined || value === "") return "-";
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return String(value);
  return `${(number * 100).toLocaleString("ko-KR", { maximumFractionDigits: digits })}%`;
}

export function formatSignedPercent(value: number | string | null | undefined, digits = 1): string {
  if (value === null || value === undefined || value === "") return FEATURE_UNAVAILABLE;
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return String(value);
  const sign = number > 0 ? "+" : "";
  return `${sign}${(number * 100).toLocaleString("ko-KR", { maximumFractionDigits: digits })}%`;
}

export function formatFeatureValue(featureName: string, value: number | string | null | undefined): string {
  const metadata = featureMetadata[featureName];
  return formatByKind(value, metadata?.format ?? "decimal");
}

export function formatByKind(value: number | string | null | undefined, kind: FeatureFormat): string {
  if (value === null || value === undefined || value === "") return FEATURE_UNAVAILABLE;
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return String(value);
  const signed = number > 0 ? "+" : "";
  switch (kind) {
    case "percentage":
      return `${signed}${(number * 100).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%`;
    case "percentagePoint":
      return `${signed}${(number * 100).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%p`;
    case "count":
      return `${number.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}건`;
    case "people":
      return `${number.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}명`;
    case "years":
      return `${number.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}년`;
    case "days":
      return `${number.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}일`;
    case "ratio":
      return number.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
    case "score":
      return number.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
    case "decimal":
      return number.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
  }
}

export function compactDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\.$/, "");
}

export function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
