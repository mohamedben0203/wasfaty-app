import { useState } from "react";
import { useI18n } from "../i18n";
import { goalsOf } from "../lib/goals";
import GoalPicker from "./GoalPicker";
import { TargetIcon } from "./icons";
import { Card, FormActions, IconChip, Notice } from "./ui";
import { useProfileSave } from "./useProfileSave";

export default function GoalsEditor({ user, onUserChange, onSignedOut, onClose }) {
  const { t } = useI18n();
  const [goals, setGoals] = useState(() => goalsOf(user));
  const { busy, error, save } = useProfileSave({ user, onUserChange, onSignedOut });

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
        <GoalPicker goals={goals} onChange={setGoals} />

        {error && <Notice>{error}</Notice>}
        <FormActions busy={busy} onCancel={onClose} />
      </form>
    </Card>
  );
}
