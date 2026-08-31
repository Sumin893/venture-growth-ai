import { NextResponse } from "next/server";
import { searchCompanies } from "@/repositories/companyRepository";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const companies = await searchCompanies(search);
    return NextResponse.json({ companies });
  } catch {
    return NextResponse.json({ message: "기업 검색 중 오류가 발생했습니다." }, { status: 500 });
  }
}
