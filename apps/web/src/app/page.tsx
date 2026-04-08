import { useTranslations } from "next-intl";
import Link from "next/link";

export default function Home() {
  const t = useTranslations("common");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t("appName")}</h1>
      <p className="max-w-md text-center text-lg text-gray-600 dark:text-gray-400">
        {t("practice")} / {t("exam")}
      </p>
      <div className="flex gap-4">
        <Link
          href="/practice"
          className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium text-white hover:bg-blue-700"
        >
          {t("practice")}
        </Link>
        <Link
          href="/exam"
          className="rounded-lg border border-blue-600 px-8 py-3 text-lg font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-800"
        >
          {t("exam")}
        </Link>
      </div>
    </div>
  );
}
