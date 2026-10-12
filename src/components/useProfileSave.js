import { useState } from "react";
import { useI18n } from "../i18n";
import { updateProfile } from "../lib/supabase";

// Saves changes to the user's own profile and tracks what a form needs to show meanwhile.
// `save` resolves to true once the new profile has been handed to `onUserChange`.
export function useProfileSave({ user, onUserChange, onSignedOut }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async (changes) => {
    setBusy(true);
    setError("");
    const { data, error: saveError } = await updateProfile(user, changes);
    setBusy(false);

    if (saveError?.code === "signed_out" || saveError?.status === 401) {
      onSignedOut();
      return false;
    }
    if (saveError) {
      setError(t(saveError.code === "network" ? "networkError" : "profileSaveError"));
      return false;
    }

    onUserChange(data);
    return true;
  };

  return { busy, error, setError, save };
}
