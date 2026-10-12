// The goals the database accepts on a profile, in the order the kiosk shows them.
// Each one's label is the translation key `goal_<name>`.
export const GOALS = [
  "weight_loss",
  "muscle_gain",
  "body_recomposition",
  "cardiovascular_health",
  "general_wellness",
  "recovery_monitoring",
];

export const MAX_GOALS = 3;

// A profile's goals, leaving out any this app has no name for
export function goalsOf(user) {
  return (user.goals ?? []).filter((goal) => GOALS.includes(goal));
}
