import { useState } from "react";
import { useI18n } from "../i18n";
import { GOALS, MAX_GOALS, goalsOf } from "../lib/goals";
import { CheckIcon, TargetIcon } from "./icons";
import { Card, FormActions, IconChip, Notice } from "./ui";
import { useProfileSave } from "./useProfileSave";

export default function GoalsEditor({ user, onUserChange, onSignedOut, onClose }) {
  const { t } = useI18n();
  const [goals, setGoals] = useState(() => goalsOf(user));
  const { busy, error, save } = useProfileSave({ user, onUserChange, onSignedOut });

  const toggleGoal = (goal) => {
    setGoals((current) => {
      if (current.includes(goal)) return current.filter((value) => value !== goal);
      return current.length < MAX_GOALS ? [...current, goal] : current;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (await save({ goals })) onClose();
  };

  return (
    <Card className="mt-3 p-3 sm:mt-4 sm:p-4">
      <div className="flex items-center gap-3">
        <IconChip>
          <TargetIcon />
        </IconChip>
        <div className="min-w-0">
          <h2 className="font-semibold text-ink">{t("myGoals")}</h2>
          <p className="text-sm text-slate-500">{t("goalsHint")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
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

        {error && <Notice>{error}</Notice>}
        <FormActions busy={busy} onCancel={onClose} />
      </form>
    </Card>
  );
}
