import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { goalsOf } from "../lib/goals";
import { getCredits, listExams } from "../lib/supabase";
import CreditHistory from "./CreditHistory";
import GoalsEditor from "./GoalsEditor";
import {
  BodyIcon,
  ChevronIcon,
  HeartPulseIcon,
  PencilIcon,
  RefreshIcon,
  ReportIcon,
  TargetIcon,
  WalletIcon,
} from "./icons";
import LatestScan from "./LatestScan";
import Profile from "./Profile";
import Results from "./Results";
import { Button, Card, IconChip, Notice } from "./ui";

const TABS = [
  { id: "summary", Icon: HeartPulseIcon },
  { id: "results", Icon: ReportIcon },
  { id: "credits", Icon: WalletIcon },
  { id: "profile", Icon: BodyIcon },
];

// Where each tab's content comes from. The summary is built from the results, so it fails
// and loads with them; the profile needs nothing fetched.
const TAB_SOURCE = { summary: "results", results: "results", credits: "credits" };

// Grey block that holds the space while data loads
function Placeholder({ className }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-slate-200/70 motion-reduce:animate-none ${className}`} />
  );
}

function EmptyCard({ title, text }) {
  return (
    <Card className="p-6 text-center sm:p-8">
      <h2 className="font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </Card>
  );
}

export default function Home({ user, onUserChange, onSignedOut }) {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState("summary");
  const [editingGoals, setEditingGoals] = useState(false);
  const [exams, setExams] = useState(null);
  const [credits, setCredits] = useState(null);
  const [failed, setFailed] = useState({ results: false, credits: false });
  const [loading, setLoading] = useState(true);
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    let active = true;

    Promise.all([listExams(user), getCredits(user)]).then(([examsResult, creditsResult]) => {
      if (!active) return;
      setLoading(false);

      const signedOut = [examsResult.error, creditsResult.error].some(
        (error) => error?.code === "signed_out" || error?.status === 401
      );
      if (signedOut) return onSignedOut();

      setFailed({ results: Boolean(examsResult.error), credits: Boolean(creditsResult.error) });
      if (examsResult.data) setExams(examsResult.data);
      if (creditsResult.data) setCredits(creditsResult.data);
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
  const formatDate = (date) => dateFormat.format(date);

  // The profile's balance is shown until the fresh one arrives
  const balance = credits?.balance ?? user.credits ?? 0;
  const transactions = credits?.transactions;

  const goals = goalsOf(user);
  const source = TAB_SOURCE[tab];
  const items = source === "credits" ? transactions : exams;
  const waiting = Boolean(source) && !items && !failed[source];

  const creditsCard = (
    <>
      <IconChip>
        <WalletIcon />
      </IconChip>
      <div className="min-w-0 flex-1 text-start">
        <h2 className="font-semibold text-ink">{t("creditsLeft")}</h2>
        <p className="text-sm text-slate-500">{t(balance > 0 ? "creditsHint" : "noCreditsHint")}</p>
      </div>
      <p className="text-3xl font-bold text-brand">{balance}</p>
    </>
  );

  return (
    <>
      {/* A bar along the bottom on phones, a row of tabs under the header on wider screens */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] sm:static sm:mx-auto sm:max-w-xl sm:border-0 sm:bg-transparent sm:px-5 sm:pt-5">
        <div className="grid grid-cols-4 sm:gap-1 sm:rounded-xl sm:bg-slate-200/70 sm:p-1">
          {TABS.map((item) => {
            const TabIcon = item.Icon;
            const active = tab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  setTab(item.id);
                  setEditingGoals(false);
                }}
                className={`flex min-h-16 cursor-pointer flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors sm:min-h-10 sm:flex-row sm:gap-2 sm:rounded-lg sm:text-sm sm:font-semibold ${
                  active ? "text-accent-dark sm:bg-white sm:text-ink sm:shadow-sm" : "text-slate-500 hover:text-ink"
                }`}
              >
                <span
                  className={`flex h-7 w-14 items-center justify-center rounded-full sm:h-auto sm:w-auto ${
                    active ? "bg-accent-soft sm:bg-transparent" : ""
                  }`}
                >
                  <TabIcon className="size-5 sm:size-4" />
                </span>
                {t(`${item.id}Nav`)}
              </button>
            );
          })}
        </div>
      </nav>

      {/* The bottom padding clears the bar on phones */}
      <main className="mx-auto max-w-xl px-3 pt-3 sm:px-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pt-5 sm:pb-10">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-ink">
              {tab === "summary" ? t("greeting", { name: user.full_name }) : t(`${tab}Title`)}
            </h1>
          </div>

          {source && (
            <button
              onClick={refresh}
              disabled={loading}
              aria-label={loading ? t("loading") : t("refresh")}
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-brand hover:border-brand disabled:cursor-default disabled:text-slate-400"
            >
              <RefreshIcon className={loading ? "size-5 animate-spin motion-reduce:animate-none" : "size-5"} />
            </button>
          )}
        </div>

        {tab === "profile" && (
          <Profile user={user} onUserChange={onUserChange} onSignedOut={onSignedOut} />
        )}

        {/* The user's goals sit under the greeting; tapping them opens the editor */}
        {tab === "summary" && !editingGoals && (
          <button
            type="button"
            onClick={() => setEditingGoals(true)}
            aria-label={`${t("myGoals")}: ${t("edit")}`}
            className="mt-1.5 flex min-h-9 w-full cursor-pointer items-center gap-1.5 rounded-lg text-start"
          >
            <TargetIcon className="size-4 text-accent-dark" />
            {goals.length === 0 ? (
              <span className="text-sm font-semibold text-brand">{t("setGoals")}</span>
            ) : (
              <span className="flex min-w-0 flex-1 flex-wrap gap-1">
                {goals.map((goal) => (
                  <span
                    key={goal}
                    className="rounded-full bg-accent-soft px-2 py-1 text-xs font-medium text-accent-dark"
                  >
                    {t(`goal_${goal}`)}
                  </span>
                ))}
              </span>
            )}
            {goals.length > 0 && <PencilIcon className="size-4 text-slate-400" />}
          </button>
        )}

        {tab === "summary" && editingGoals && (
          <GoalsEditor
            user={user}
            onUserChange={onUserChange}
            onSignedOut={onSignedOut}
            onClose={() => setEditingGoals(false)}
          />
        )}

        {tab === "credits" && <Card className="mt-3 flex items-center gap-3 p-3 sm:mt-4 sm:p-4">{creditsCard}</Card>}

        {source && failed[source] && !editingGoals && (
          <div className="mt-3 space-y-3 sm:mt-4">
            <Notice>{t(`${source}Error`)}</Notice>
            <Button variant="secondary" onClick={refresh} disabled={loading}>
              {t("retry")}
            </Button>
          </div>
        )}

        {tab === "summary" && !editingGoals && (
          <>
            {waiting && <Placeholder className="mt-1.5 h-80 sm:mt-2" />}
            {exams?.[0] && <LatestScan exam={exams[0]} previous={exams[1]} formatDate={formatDate} />}
            {exams?.length === 0 && !failed.results && (
              <div className="mt-1.5 sm:mt-2">
                <EmptyCard title={t("resultsEmptyTitle")} text={t("resultsEmptyText")} />
              </div>
            )}

            <button
              type="button"
              onClick={() => setTab("credits")}
              className="mt-2.5 block w-full cursor-pointer rounded-2xl sm:mt-3"
            >
              <Card className="flex items-center gap-3 p-3 hover:border-slate-300 sm:p-4">
                {creditsCard}
                <ChevronIcon className="size-5 text-slate-400 rtl:-scale-x-100" />
              </Card>
            </button>
          </>
        )}

        {(tab === "results" || tab === "credits") && (
          <div className="mt-3 sm:mt-4">
            {tab === "credits" && items?.length > 0 && (
              <h2 className="mb-2 text-sm font-semibold text-slate-600">{t("creditHistory")}</h2>
            )}
            {waiting && <Placeholder className="h-40" />}
            {items?.length === 0 && !failed[source] && (
              <EmptyCard title={t(`${source}EmptyTitle`)} text={t(`${source}EmptyText`)} />
            )}
            {items?.length > 0 &&
              (tab === "results" ? (
                <Results exams={items} formatDate={formatDate} />
              ) : (
                <CreditHistory transactions={items} formatDate={formatDate} />
              ))}
          </div>
        )}
      </main>
    </>
  );
}
