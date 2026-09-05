"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import CompanyDashboardLoading from "@/app/company/[companyId]/loading";
import { HomeLoadingSkeleton } from "@/components/home/HomeLoadingSkeleton/HomeLoadingSkeleton";
import styles from "./CompanyNavigationFeedback.module.css";

const COMPANY_ROUTE_PREFIX = "/company/";
const FALLBACK_TIMEOUT_MS = 10000;

type LoadingKind = "company" | "home";

interface PendingNavigation {
  pathname: string;
  kind: LoadingKind;
}

function getLoadingKind(pathname: string): LoadingKind | null {
  if (pathname === "/") return "home";
  if (pathname.startsWith(COMPANY_ROUTE_PREFIX)) return "company";
  return null;
}

export function CompanyNavigationFeedback() {
  const pathname = usePathname();
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const isPending = pendingNavigation !== null && pathname !== pendingNavigation.pathname;

  useEffect(() => {
    function clearFallback() {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    function handleClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target) return;

      const url = new URL(link.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      const loadingKind = getLoadingKind(url.pathname);
      if (loadingKind === null) return;

      clearFallback();
      setPendingNavigation({ pathname: url.pathname, kind: loadingKind });
      timeoutRef.current = window.setTimeout(() => setPendingNavigation(null), FALLBACK_TIMEOUT_MS);
    }

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      clearFallback();
    };
  }, []);

  if (!isPending) return null;

  return (
    <div className={styles.overlay}>
      {pendingNavigation.kind === "home" ? <HomeLoadingSkeleton /> : <CompanyDashboardLoading />}
    </div>
  );
}
