import { useI18n } from "../i18n";
import { GOALS, MAX_GOALS } from "../lib/goals";
import { CheckIcon } from "./icons";

// The goals as toggle buttons. Once MAX_GOALS are chosen the rest lock until one is dropped.
export default function GoalPicker({ goals, onChange }) {
  const { t } = useI18n();

  const toggleGoal = (goal) => {
    if (goals.includes(goal)) onChange(goals.filter((value) => value !== goal));
    else if (goals.length < MAX_GOALS) onChange([...goals, goal]);
  };

  return (
    <div role="group" aria-label={t("myGoals")} className="grid grid-cols-2 gap-2">
      {GOALS.map((goal) => {
        const selected = goals.includes(goal);

        return (
          <button
            key={goal}
            type="button"
            aria-pressed={selected}
            disabled={!selected && goals.length >= MAX_GOALS}
            onClick={() => toggleGoal(goal)}
            className={`flex min-h-12 cursor-pointer items-center justify-between gap-1 rounded-xl border px-3 text-start text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              selected
                ? "border-brand bg-brand/5 text-brand ring-1 ring-brand"
                : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
            }`}
          >
            {t(`goal_${goal}`)}
            {selected && <CheckIcon className="size-4" />}
          </button>
        );
      })}
    </div>
  );
}
