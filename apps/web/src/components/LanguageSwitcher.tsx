"use client";

import { useRouter } from "next/navigation";

export function LanguageSwitcher() {
  const router = useRouter();

  const switchLocale = (locale: string) => {
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
    router.refresh();
  };

  return (
    <div className="flex gap-1 text-sm">
      <button onClick={() => switchLocale("ru")} className="hover:underline">
        RU
      </button>
      <span>/</span>
      <button onClick={() => switchLocale("uk")} className="hover:underline">
        UA
      </button>
    </div>
  );
}
