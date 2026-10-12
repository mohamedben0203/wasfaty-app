const REPORT_BASE_URL = (import.meta.env.VITE_REPORT_BASE_URL || "https://health.zbuny.com").replace(/\/$/, "");

export function reportUrl(exam, locale) {
  return `${REPORT_BASE_URL}/exam/${encodeURIComponent(exam.exam_no)}/${locale}`;
}

// One decimal place, or null when the device sent nothing usable
function roundMetric(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 10) / 10 : null;
}

// The scanner's own words for a BMI result, in either language, mapped to one status each
const BMI_STATUS = {
  normal: "normal",
  "طبيعي": "normal",
  underweight: "underweight",
  "نقص في الوزن": "underweight",
  overweight: "overweight",
  "فوق الطبيعي": "overweight",
  "الوزن الزائد": "overweight",
  obese: "obese",
  "بدين": "obese",
};

function toLatinDigits(text) {
  return text.replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit)).replace(/٫/g, ".");
}

// The scanner sends BMI as "value#status#low~high", for example "24.1#Normal#18.5~24.9".
// Its status and normal range are shown as they are, so the app never disagrees with the report.
export function bmiReading(exam) {
  const [, flag = "", range = ""] = String(exam.bmi_raw ?? "").split("#");
  const [low, high] = toLatinDigits(range).split("~").map(Number);

  return {
    status: BMI_STATUS[flag.trim().toLowerCase()] ?? null,
    range: Number.isFinite(low) && Number.isFinite(high) && high > low ? [low, high] : null,
  };
}

// The measurements an exam actually has. `key` and `unit` are also translation keys.
export function examMetrics(exam) {
  return [
    { key: "weight", value: roundMetric(exam.weight_value), unit: "kg" },
    { key: "bmi", value: roundMetric(exam.bmi_value) },
    { key: "score", value: roundMetric(exam.score) },
  ].filter((metric) => metric.value !== null);
}
