import { NextResponse } from "next/server";
import { getDashboard } from "@/repositories/dashboardRepository";

export async function GET(_request: Request, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const { companyId } = await params;
    const dashboard = await getDashboard(Number(companyId));
    if (!dashboard) return NextResponse.json({ message: "분석 대상 기업을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ dashboard });
  } catch {
    return NextResponse.json({ message: "Dashboard 데이터를 불러오지 못했습니다." }, { status: 500 });
  }
}
