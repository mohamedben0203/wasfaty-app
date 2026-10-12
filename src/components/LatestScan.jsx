import { useI18n } from "../i18n";
import { bmiReading, examMetrics, reportUrl } from "../lib/exams";
import { formatSigned } from "../lib/format";
import { RangeBar, ScoreRing } from "./charts";
import { ArrowDownIcon, ArrowUpIcon, HeartPulseIcon } from "./icons";
import { Button, Card, IconChip } from "./ui";

const BMI_STATUS = {
  normal: { label: "bmiNormal", dot: "bg-status-good" },
  underweight: { label: "bmiUnderweight", dot: "bg-status-warning" },
  overweight: { label: "bmiOverweight", dot: "bg-status-warning" },
  obese: { label: "bmiObese", dot: "bg-status-serious" },
};

// Grey either way: whether up or down is good depends on the person
function Change({ value }) {
  if (value === null) return null;

  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-normal text-slate-500">
      {value > 0 && <ArrowUpIcon className="size-3" />}
      {value < 0 && <ArrowDownIcon className="size-3" />}
      <bdi dir="ltr">{formatSigned(value)}</bdi>
    </span>
  );
}

export default function LatestScan({ exam, previous, formatDate }) {
  const { t, locale } = useI18n();

  const before = Object.fromEntries(
    previous ? examMetrics(previous).map((metric) => [metric.key, metric.value]) : []
  );
  const metrics = Object.fromEntries(
    examMetrics(exam).map((metric) => [
      metric.key,
      {
        value: metric.value,
        change:
          before[metric.key] === undefined
            ? null
            : Math.round((metric.value - before[metric.key]) * 10) / 10,
      },
    ])
  );
  const { weight, bmi, score } = metrics;
  const { status, range } = bmiReading(exam);
  const hasChanges = Object.values(metrics).some((metric) => metric.change !== null);

  return (
    <Card className="mt-1.5 p-3 sm:mt-2 sm:p-4">
      <div className="flex items-center gap-3">
        <IconChip>
          <HeartPulseIcon />
        </IconChip>
        <div className="min-w-0">
          <h2 className="font-semibold text-ink">{t("latestScan")}</h2>
          <p className="text-sm text-slate-500">{formatDate(new Date(exam.received_at))}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 sm:mt-4">
        {score && (
          <div className="flex shrink-0 flex-col items-center">
            <ScoreRing
              value={score.value}
              caption={t("outOf100")}
              label={`${t("score")}: ${score.value} ${t("outOf100")}`}
            />
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              {t("score")}
              <Change value={score.change} />
            </p>
          </div>
        )}

        <dl className="min-w-0 flex-1 divide-y divide-slate-200">
          {weight && (
            <div className="py-3 first:pt-0 last:pb-0">
              <dt className="text-xs text-slate-500">{t("weight")}</dt>
              <dd className="flex items-baseline gap-2 text-xl font-semibold text-ink">
                <span>
                  {weight.value}
                  <span className="ms-1 text-xs font-medium text-slate-500">{t("kg")}</span>
                </span>
                <Change value={weight.change} />
              </dd>
            </div>
          )}

          {bmi && (
            <div className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-xs text-slate-500">{t("bmi")}</dt>
                {status && (
                  <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    <span className={`size-2 rounded-full ${BMI_STATUS[status].dot}`} />
                    {t(BMI_STATUS[status].label)}
                  </span>
                )}
              </div>
              <dd className="flex items-baseline gap-2 text-xl font-semibold text-ink">
                {bmi.value}
                <Change value={bmi.change} />
              </dd>
              {range && (
                <dd className="mt-1.5">
                  <RangeBar value={bmi.value} range={range} />
                  <p className="mt-1 text-xs text-slate-500">
                    {t("normalRange")} <bdi dir="ltr">{`${range[0]}–${range[1]}`}</bdi>
                  </p>
                </dd>
              )}
            </div>
          )}
        </dl>
      </div>

      {hasChanges && <p className="mt-3 text-xs text-slate-500">{t("sincePrevious")}</p>}

      <Button
        href={reportUrl(exam, locale)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3"
      >
        {t("viewReport")}
      </Button>
    </Card>
  );
}
