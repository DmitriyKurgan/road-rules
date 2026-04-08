import { useTranslations } from "next-intl";
import { useQuizStore } from "@/store/quiz";

export function QuizProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const t = useTranslations("quiz");
  const percent = (current / total) * 100;

  // Count errors so far
  const tickets = useQuizStore((s) => s.tickets);
  const errorCount = tickets
    .slice(0, current)
    .filter((t) => t.answer && !t.answer.isCorrect).length;

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium">
        {t("question")} {current} {t("of")} {total}
      </span>
      <div className="h-2 w-48 rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-blue-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      {errorCount > 0 && (
        <span className="text-sm text-red-600">
          {t("errors")}: {errorCount}
        </span>
      )}
    </div>
  );
}
