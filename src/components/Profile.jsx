import { useState } from "react";
import { useI18n } from "../i18n";
import { ageFromDob, getDobBounds, isValidDob } from "../lib/dob";
import { formatPhone } from "../lib/phone";
import { BodyIcon, CalendarIcon } from "./icons";
import { Card, Field, FormActions, IconChip, LinkButton, Notice, TextInput } from "./ui";
import { useProfileSave } from "./useProfileSave";

export default function Profile({ user, onUserChange, onSignedOut }) {
  const { t, locale } = useI18n();
  const [editing, setEditing] = useState(false);
  const [dob, setDob] = useState("");
  const [dobBounds] = useState(getDobBounds);
  const { busy, error, setError, save } = useProfileSave({ user, onUserChange, onSignedOut });

  const age = ageFromDob(user.date_of_birth);
  const birthDate =
    age === null
      ? null
      : new Intl.DateTimeFormat(locale === "ar" ? "ar-LY" : "en-GB", { dateStyle: "long" }).format(
          new Date(`${user.date_of_birth}T00:00:00`)
        );

  const startEditing = () => {
    setDob(user.date_of_birth ?? "");
    setError("");
    setEditing(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValidDob(dob)) return setError(t("dobError"));
    if (await save({ date_of_birth: dob })) setEditing(false);
  };

  return (
    <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
      <Card className="flex items-center gap-3 p-3 sm:p-4">
        <IconChip>
          <BodyIcon />
        </IconChip>
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-ink">{user.full_name}</h2>
          <p className="text-sm text-slate-500">
            <bdi dir="ltr">{formatPhone(user.phone)}</bdi>
          </p>
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <IconChip>
            <CalendarIcon />
          </IconChip>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-ink">{t("age")}</h2>
            <p className="text-sm text-slate-500">
              {age === null ? t("notSet") : `${t("ageYears", { age })} · ${birthDate}`}
            </p>
          </div>
          {!editing && <LinkButton onClick={startEditing}>{t("edit")}</LinkButton>}
        </div>

        {editing && (
          <form onSubmit={handleSubmit} noValidate className="mt-3 space-y-3">
            <Field label={t("dob")} id="profile-dob">
              <TextInput
                id="profile-dob"
                type="date"
                min={dobBounds.min}
                max={dobBounds.max}
                value={dob}
                onChange={(event) => setDob(event.target.value)}
              />
            </Field>
            {error && <Notice>{error}</Notice>}
            <FormActions busy={busy} onCancel={() => setEditing(false)} />
          </form>
        )}
      </Card>
    </div>
  );
}
