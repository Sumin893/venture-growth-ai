import { FEATURE_UNAVAILABLE } from "@/constants/featureMetadata";
import type { ScoreDirection } from "@/types/company";
import { toNullableNumber } from "@/utils/format";

const directionalMetrics = new Set(["revenue_growth_1y", "employee_growth_6m", "operating_margin_change_1y"]);

function isKnownDirectionalValue(featureName: string): boolean {
  return directionalMetrics.has(featureName) || featureName === "liabilities_to_assets" || featureName.includes("_count");
}

function hasObservedValue(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (typeof value === "string" && value.trim() === FEATURE_UNAVAILABLE) return false;
  return true;
}

function valueDirection(featureName: string, value: string | number | null): ScoreDirection | null {
  const number = toNullableNumber(value);
  if (number === null) return null;

  if (directionalMetrics.has(featureName)) {
    if (number > 0) return "positive";
    if (number < 0) return "negative";
    return null;
  }

  if (featureName === "liabilities_to_assets") {
    return number >= 0.7 ? "negative" : null;
  }

  if (featureName.includes("_count")) {
    return number > 0 ? "positive" : null;
  }

  return null;
}

export function classifyFactorSignal(
  featureName: string,
  featureValue: string | number | null,
  modelDirection: ScoreDirection,
  contribution: number
): ScoreDirection | null {
  if (!hasObservedValue(featureValue)) return null;

  const observedDirection = valueDirection(featureName, featureValue);
  const contributionDirection = contribution > 0 ? "positive" : contribution < 0 ? "negative" : null;

  if (!observedDirection && isKnownDirectionalValue(featureName)) {
    return null;
  }

  if (observedDirection === "negative" || modelDirection === "negative" || contributionDirection === "negative") {
    return "negative";
  }

  if (observedDirection === "positive" && modelDirection === "positive" && contributionDirection === "positive") {
    return "positive";
  }

  return null;
}
