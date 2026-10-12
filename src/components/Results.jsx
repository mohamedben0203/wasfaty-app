import { useI18n } from "../i18n";
import { examMetrics, reportUrl } from "../lib/exams";
import { ChevronIcon } from "./icons";
import { Card } from "./ui";

export default function Results({ exams, formatDate }) {
  const { t, locale } = useI18n();

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-slate-200">
        {exams.map((exam) => (
          <li key={exam.exam_no}>
            <a
              href={reportUrl(exam, locale)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-paper/70 sm:px-5 sm:py-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-ink">{formatDate(new Date(exam.received_at))}</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {examMetrics(exam)
                    .map(({ key, value, unit }) => `${t(key)} ${value}${unit ? ` ${t(unit)}` : ""}`)
                    .join(" · ")}
                </p>
              </div>

              <ChevronIcon className="size-5 text-slate-400 rtl:-scale-x-100" />
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
