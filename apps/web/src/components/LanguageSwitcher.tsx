"use client";

export function LanguageSwitcher() {
  const switchLocale = (locale: string) => {
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
    window.dispatchEvent(new Event("locale-change"));
  };

  return (
    <div className="flex gap-1 text-sm text-gray-500 dark:text-gray-400">
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
