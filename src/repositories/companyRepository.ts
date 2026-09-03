import { getPool, hasDbConfig, shouldUseCsvFallback } from "@/lib/db";
import { getCsvCompany, getCsvFeaturedCompanies, searchCsvCompanies } from "@/lib/csvData";
import type { CompanyDetail, CompanySummary } from "@/types/company";
import { cacheLife, cacheTag } from "next/cache";
import type { RowDataPacket } from "mysql2";

const PUBLIC_COMPANY_CACHE_REVALIDATE_SECONDS = 600;
const PUBLIC_COMPANY_CACHE_EXPIRE_SECONDS = 1800;

interface CompanyRow extends RowDataPacket {
  company_id: number;
  company_name: string;
  industry: string | null;
  sub_industry: string | null;
  region: string | null;
  venture_type: string | null;
  founded_year: number | null;
  company_age: number | null;
  venture_renewal: string | null;
  macro_region: string | null;
  id_confidence: string | null;
  has_dart: number | null;
}

function mapSummary(row: CompanyRow): CompanySummary {
  return {
    companyId: row.company_id,
    companyName: row.company_name,
    industry: row.industry,
    subIndustry: row.sub_industry,
    region: row.region,
    ventureType: row.venture_type
  };
}

function mapDetail(row: CompanyRow): CompanyDetail {
  return {
    ...mapSummary(row),
    foundedYear: row.founded_year,
    companyAge: row.company_age,
    ventureRenewal: row.venture_renewal,
    macroRegion: row.macro_region,
    idConfidence: row.id_confidence,
    hasDart: row.has_dart === null ? null : Boolean(row.has_dart)
  };
}

export async function searchCompanies(search: string): Promise<CompanySummary[]> {
  if (!hasDbConfig() && shouldUseCsvFallback()) return searchCsvCompanies(search);
  const [rows] = await getPool().execute<CompanyRow[]>(
    `SELECT company_id, company_name, industry, sub_industry, region, venture_type,
            founded_year, company_age, venture_renewal, macro_region, id_confidence, has_dart
       FROM companies
      WHERE (:search = '' OR search_name LIKE :pattern OR company_name LIKE :pattern)
      ORDER BY company_name
      LIMIT 50`,
    { search, pattern: `%${search}%` }
  );
  return rows.map(mapSummary);
}

export async function getCompany(companyId: number): Promise<CompanyDetail | null> {
  if (!hasDbConfig() && shouldUseCsvFallback()) return getCsvCompany(companyId);
  const [rows] = await getPool().execute<CompanyRow[]>(
    `SELECT company_id, company_name, industry, sub_industry, region, venture_type,
            founded_year, company_age, venture_renewal, macro_region, id_confidence, has_dart
       FROM companies
      WHERE company_id = :companyId
      LIMIT 1`,
    { companyId }
  );
  return rows[0] ? mapDetail(rows[0]) : null;
}

export async function getFeaturedCompanies(limit = 30): Promise<CompanySummary[]> {
  "use cache: remote";
  cacheTag("featured-companies");
  cacheLife({
    revalidate: PUBLIC_COMPANY_CACHE_REVALIDATE_SECONDS,
    expire: PUBLIC_COMPANY_CACHE_EXPIRE_SECONDS
  });

  if (!hasDbConfig() && shouldUseCsvFallback()) return getCsvFeaturedCompanies(limit);
  const [rows] = await getPool().execute<CompanyRow[]>(
    `SELECT company_id, company_name, industry, sub_industry, region, venture_type,
            founded_year, company_age, venture_renewal, macro_region, id_confidence, has_dart
       FROM companies
      ORDER BY company_id
      LIMIT :limit`,
    { limit }
  );
  return rows.map(mapSummary);
}
