import type { CompanySummary } from "@/types/company";

export async function fetchCompanies(search: string): Promise<CompanySummary[]> {
  const response = await fetch(`/api/companies?search=${encodeURIComponent(search)}`);
  if (!response.ok) throw new Error("기업 검색에 실패했습니다.");
  const data = (await response.json()) as { companies: CompanySummary[] };
  return data.companies;
}
