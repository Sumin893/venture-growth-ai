import type { Metadata } from "next";
import { CompanyNavigationFeedback } from "@/components/navigation/CompanyNavigationFeedback/CompanyNavigationFeedback";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Growth AI",
  description: "AI-based multidimensional growth assessment for venture companies"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <CompanyNavigationFeedback />
      </body>
    </html>
  );
}
