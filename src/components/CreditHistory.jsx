import { useI18n } from "../i18n";
import { formatSigned } from "../lib/format";
import { HeartPulseIcon, WalletIcon } from "./icons";
import { Card, IconChip } from "./ui";

const REASON_LABELS = {
  scan: "creditScan",
  credit_purchase: "creditPurchase",
  free_signup: "creditFreeSignup",
};

export default function CreditHistory({ transactions, formatDate }) {
  const { t } = useI18n();

  return (
    <Card>
      <ul className="divide-y divide-slate-200">
        {transactions.map((transaction) => {
          const paid = Number(transaction.paid_amount_dinar);
          const added = transaction.amount > 0;

          return (
            <li key={transaction.id} className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">
              <IconChip tone={added ? "accent" : "muted"}>
                {transaction.reason === "scan" ? <HeartPulseIcon /> : <WalletIcon />}
              </IconChip>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">
                  {t(REASON_LABELS[transaction.reason] ?? "creditOther")}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {formatDate(new Date(transaction.created_at))}
                </p>
                {paid > 0 && (
                  <p className="text-sm text-slate-500">{t("paidAmount", { amount: paid })}</p>
                )}
              </div>

              <div className="shrink-0 text-end">
                {/* Left-to-right keeps the sign in front of the number in Arabic */}
                <bdi
                  dir="ltr"
                  className={`text-lg font-semibold ${added ? "text-accent-dark" : "text-ink"}`}
                >
                  {formatSigned(transaction.amount)}
                </bdi>
                {transaction.balance_after != null && (
                  <p className="text-xs text-slate-500">
                    {t("balanceAfter", { count: transaction.balance_after })}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
