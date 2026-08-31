import { NextResponse } from "next/server";
import { getCompany } from "@/repositories/companyRepository";

export async function GET(_request: Request, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const { companyId } = await params;
    const company = await getCompany(Number(companyId));
    if (!company) return NextResponse.json({ message: "존재하지 않는 기업입니다." }, { status: 404 });
    return NextResponse.json({ company });
  } catch {
    return NextResponse.json({ message: "기업 정보를 불러오지 못했습니다." }, { status: 500 });
  }
}
