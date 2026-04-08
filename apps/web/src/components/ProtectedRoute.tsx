"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, fetchProfile } = useAuthStore();
  const router = useRouter();
  const t = useTranslations("common");

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="mt-20 text-center text-gray-500">{t("loading")}</div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
