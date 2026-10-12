import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { listExams } from "../lib/supabase";
import { Button, Notice } from "./ui";

const REPORT_BASE_URL = (import.meta.env.VITE_REPORT_BASE_URL || "https://health.zbuny.com").replace(/\/$/, "");

function formatNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? String(Math.round(number * 10) / 10) : null;
}

export default function Results({ user, onSignedOut }) {
  const { t, locale } = useI18n();
  const [exams, setExams] = useState(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    let active = true;

    listExams(user).then(({ data, error }) => {
      if (!active) return;
      setLoading(false);

      if (error?.code === "signed_out" || error?.status === 401) return onSignedOut();
      setFailed(Boolean(error));
      if (data) setExams(data);
    });

    return () => {
      active = false;
    };
  }, [user, onSignedOut, reloads]);

  const refresh = () => {
    setLoading(true);
    setReloads((count) => count + 1);
  };

  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar-LY" : "en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <main className="mx-auto max-w-xl px-5 py-6">
      <p className="text-slate-600">{t("greeting", { name: user.full_name })}</p>

      <div className="mt-1 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink">{t("resultsTitle")}</h1>

        <button
          onClick={refresh}
          disabled={loading}
          className="min-h-11 cursor-pointer text-sm font-semibold text-brand hover:underline disabled:text-slate-400"
        >
          {loading ? t("loading") : t("refresh")}
        </button>
      </div>

      {failed && (
        <div className="mt-4 space-y-3">
          <Notice>{t("resultsError")}</Notice>
          <Button variant="secondary" onClick={refresh} disabled={loading}>
            {t("retry")}
          </Button>
        </div>
      )}

      {exams?.length === 0 && !failed && (
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="font-bold text-ink">{t("resultsEmptyTitle")}</h2>
          <p className="mt-1 text-sm text-slate-600">{t("resultsEmptyText")}</p>
        </div>
      )}

      {exams?.length > 0 && (
        <ul className="mt-4 space-y-3">
          {exams.map((exam) => {
            const metrics = [
              { label: t("weight"), value: formatNumber(exam.weight_value), unit: t("kg") },
              { label: t("bmi"), value: formatNumber(exam.bmi_value) },
              { label: t("score"), value: formatNumber(exam.score) },
            ].filter((metric) => metric.value !== null);

            return (
              <li key={exam.exam_no}>
                <a
                  href={`${REPORT_BASE_URL}/exam/${encodeURIComponent(exam.exam_no)}/${locale}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-3xl border border-slate-200 bg-white p-5 hover:border-brand"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-bold text-ink">
                      {dateFormat.format(new Date(exam.received_at))}
                    </h2>

                    <svg
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                      className="size-5 shrink-0 text-brand rtl:-scale-x-100"
                    >
                      <path
                        d="M6 14 14 6M7 6h7v7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {metrics.length > 0 && (
                    <dl className="mt-3 flex gap-6">
                      {metrics.map((metric) => (
                        <div key={metric.label}>
                          <dt className="text-xs text-slate-500">{metric.label}</dt>
                          <dd className="font-bold text-ink">
                            {metric.value}
                            {metric.unit && (
                              <span className="ms-1 text-xs font-medium text-slate-500">
                                {metric.unit}
                              </span>
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  <p className="mt-3 text-sm font-semibold text-brand">{t("viewReport")}</p>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
