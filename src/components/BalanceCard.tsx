import { ArrowDownLeft, ArrowUpRight, SlidersHorizontal } from 'lucide-react';
import { formatRp } from '../data/initialTransactions';
import type { BudgetConfig } from '../types/kas';

interface BalanceCardProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  pendingCount: number;
  pendingTotal: number;
  latestMonthExpense: number;
  latestMonthName: string;
  budget: BudgetConfig;
  onOpenBudget: () => void;
  onFilterPending: () => void;
}

export function BalanceCard({
  balance,
  totalIncome,
  totalExpense,
  pendingCount,
  pendingTotal,
  latestMonthExpense,
  latestMonthName,
  budget,
  onOpenBudget,
  onFilterPending,
}: BalanceCardProps) {
  const budgetPct =
    budget.monthlyLimit > 0
      ? Math.min(100, Math.round((latestMonthExpense / budget.monthlyLimit) * 100))
      : 0;

  return (
    <section
      aria-label="Ringkasan Saldo Kas"
      className="stripe-card-bg relative overflow-hidden rounded-[28px] p-5 sm:p-6 text-white"
    >
      <div className="flex items-start justify-between gap-2.5 sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-white/75 tracking-wide">
            Kas DDV Banten 2026
          </p>
          <p className="mt-1.5 font-display text-[28px] sm:text-4xl font-bold tracking-tight tabular-nums text-white leading-none">
            {formatRp(balance)}
          </p>
          <p className="mt-2 text-xs text-white/75">
            Nurul Amanah <span aria-hidden="true">·</span> PIC DDV Banten
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenBudget}
          className="inline-flex items-center gap-1 rounded-full bg-lime-accent px-2.5 py-1.5 min-h-[32px] text-[11px] sm:text-xs font-bold text-ink hover:bg-lime-deep transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Atur anggaran</span>
        </button>
      </div>

      <div className="mt-4 pt-3.5 border-t border-white/15 flex flex-col gap-2.5">
        <p className="text-xs font-medium text-lime-accent tabular-nums">
          Cocok dengan laporan: masuk {formatRp(totalIncome)} − keluar{' '}
          {formatRp(totalExpense)}
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-white/85">
            <ArrowDownLeft className="w-4 h-4 text-lime-accent shrink-0" aria-hidden="true" />
            <span className="truncate tabular-nums">
              Masuk: <strong className="text-white">{formatRp(totalIncome)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/85">
            <ArrowUpRight className="w-4 h-4 text-orange-400 shrink-0" aria-hidden="true" />
            <span className="truncate tabular-nums">
              Keluar: <strong className="text-white">{formatRp(totalExpense)}</strong>
            </span>
          </div>
        </div>

        {budget.monthlyLimit > 0 && (
          <div className="mt-1">
            <div className="flex items-center justify-between text-[11px] text-white/75 mb-1 tabular-nums">
              <span>Anggaran keluar {latestMonthName}</span>
              <span>
                {formatRp(latestMonthExpense)} / {formatRp(budget.monthlyLimit)} ({budgetPct}%)
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  budgetPct >= 95 ? 'bg-orange-400' : 'bg-lime-accent'
                }`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>
        )}

        {pendingCount > 0 && (
          <div className="pt-1 flex items-center justify-between gap-2 text-xs">
            <span className="text-white/80 tabular-nums">
              Piutang reimburse aktif ({pendingCount} item):{' '}
              <strong className="text-pending-bg">{formatRp(pendingTotal)}</strong>
            </span>
            <button
              type="button"
              onClick={onFilterPending}
              className="text-xs font-semibold text-lime-accent underline underline-offset-4 hover:text-white transition-colors min-h-[44px] px-1 whitespace-nowrap shrink-0"
            >
              Lihat piutang
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
