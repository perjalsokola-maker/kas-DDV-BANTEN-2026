import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  CATEGORY_LABELS,
  MONTH_NAMES,
  formatRp,
} from '../data/initialTransactions';
import type { CategoryCode, Transaction } from '../types/kas';

interface StatsViewProps {
  transactions: Transaction[];
  balance: number;
  onBack?: () => void;
  onOpenReimburseSource: (sourceName: string) => void;
}

export function StatsView({
  transactions,
  balance,
  onBack,
  onOpenReimburseSource,
}: StatsViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  const periods = useMemo(() => {
    const map = new Map<string, { year: number; month: number }>();
    [4, 5, 6, 7, 8, 9, 10].forEach((m) => map.set(`2026-${m}`, { year: 2026, month: m }));
    transactions.forEach((t) => {
      map.set(`${t.year}-${t.month}`, { year: t.year, month: t.month });
    });
    return Array.from(map.entries())
      .map(([key, val]) => ({ key, ...val }))
      .sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
  }, [transactions]);

  const activeTransactions = useMemo(
    () =>
      selectedPeriod === 'all'
        ? transactions
        : transactions.filter((t) => `${t.year}-${t.month}` === selectedPeriod),
    [transactions, selectedPeriod]
  );

  const incomeTotal = useMemo(
    () => activeTransactions.reduce((acc, t) => acc + t.income, 0),
    [activeTransactions]
  );

  const expenseTotal = useMemo(
    () => activeTransactions.reduce((acc, t) => acc + t.expense, 0),
    [activeTransactions]
  );

  const incomeCount = useMemo(
    () => activeTransactions.filter((t) => t.income > 0).length,
    [activeTransactions]
  );

  const selectedPeriodObj = periods.find((p) => p.key === selectedPeriod) || null;

  const prevPeriodInfo = useMemo(() => {
    if (!selectedPeriodObj) return null;
    const prevMonth = selectedPeriodObj.month === 1 ? 12 : selectedPeriodObj.month - 1;
    const prevYear =
      selectedPeriodObj.month === 1 ? selectedPeriodObj.year - 1 : selectedPeriodObj.year;
    const prevInc = transactions
      .filter((t) => t.year === prevYear && t.month === prevMonth)
      .reduce((acc, t) => acc + t.income, 0);
    return { prevMonth, prevYear, prevInc };
  }, [transactions, selectedPeriodObj]);

  const incomeSubtitle = useMemo(() => {
    if (!selectedPeriodObj || !prevPeriodInfo) {
      const first = periods[0];
      const last = periods[periods.length - 1];
      const firstLabel = first ? `${MONTH_NAMES[first.month]} ${first.year}` : 'Apr 2026';
      const lastLabel = last ? `${MONTH_NAMES[last.month]} ${last.year}` : 'Okt 2026';
      return `Selama ${firstLabel}–${lastLabel}, dari ${incomeCount} pemasukan.`;
    }
    if (prevPeriodInfo.prevInc > 0) {
      const diffPct = Math.abs(
        Math.round(
          ((incomeTotal - prevPeriodInfo.prevInc) / prevPeriodInfo.prevInc) * 100
        )
      );
      return `${incomeTotal >= prevPeriodInfo.prevInc ? 'Naik' : 'Turun'} ${diffPct}% dari ${
        MONTH_NAMES[prevPeriodInfo.prevMonth]
      } ${prevPeriodInfo.prevYear}.`;
    }
    return `Pemasukan ${MONTH_NAMES[prevPeriodInfo.prevMonth]} ${prevPeriodInfo.prevYear} Rp0, belum ada pembanding.`;
  }, [selectedPeriodObj, prevPeriodInfo, periods, incomeCount, incomeTotal]);

  const topCategories = useMemo(() => {
    const map: Partial<Record<CategoryCode, number>> = {};
    activeTransactions
      .filter((t) => t.expense > 0)
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.expense;
      });
    return (Object.entries(map) as Array<[CategoryCode, number]>)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [activeTransactions]);

  const monthlySeries = useMemo(() => {
    return periods.map((p) => {
      const monthTx = transactions.filter(
        (t) => t.year === p.year && t.month === p.month
      );
      return {
        key: p.key,
        year: p.year,
        month: p.month,
        income: monthTx.reduce((a, b) => a + b.income, 0),
        expense: monthTx.reduce((a, b) => a + b.expense, 0),
      };
    });
  }, [periods, transactions]);

  const maxChartVal = useMemo(
    () =>
      Math.max(
        1,
        ...monthlySeries.flatMap((d) => [d.income, d.expense])
      ),
    [monthlySeries]
  );

  const pendingBySource = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    transactions.forEach((t) => {
      if (t.status?.kind === 'p') {
        const src = t.status.sourceName || 'Umum';
        if (!map[src]) map[src] = { total: 0, count: 0 };
        map[src].total += t.expense;
        map[src].count += 1;
      }
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [transactions]);

  const pendingTotal = useMemo(
    () => pendingBySource.reduce((acc, [, v]) => acc + v.total, 0),
    [pendingBySource]
  );

  const selectedMonthData = monthlySeries.find((d) => d.key === selectedPeriod);
  const hasMultipleYears = useMemo(
    () => new Set(periods.map((p) => p.year)).size > 1,
    [periods]
  );

  return (
    <div className="space-y-4">
      {/* Header row on mobile / subheader on desktop */}
      <div className="flex items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali ke Beranda"
            className="lg:hidden min-h-[44px] px-4 rounded-full bg-white text-ink font-medium inline-flex items-center gap-1.5 hover:bg-white/80"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Kembali</span>
          </button>
        ) : (
          <div className="lg:hidden" />
        )}
        <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">
          Statistik Kas
        </h2>
        <span className="text-xs font-medium text-ink-muted tabular-nums">
          {hasMultipleYears ? '2026–2027' : 'Tahun 2026'}
        </span>
      </div>

      {/* Month Segmented Tabs */}
      <div
        className="flex gap-2 overflow-x-auto no-scrollbar py-0.5"
        role="tablist"
        aria-label="Pilih bulan statistik"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedPeriod === 'all'}
          onClick={() => setSelectedPeriod('all')}
          className={`min-h-[44px] px-4 rounded-full text-xs sm:text-sm whitespace-nowrap shrink-0 transition-colors ${
            selectedPeriod === 'all'
              ? 'bg-lime-accent font-bold text-ink'
              : 'bg-white text-ink hover:bg-white/80'
          }`}
        >
          Total
        </button>
        {periods.map((p) => (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={selectedPeriod === p.key}
            onClick={() => setSelectedPeriod(p.key)}
            className={`min-h-[44px] px-4 rounded-full text-xs sm:text-sm whitespace-nowrap shrink-0 transition-colors ${
              selectedPeriod === p.key
                ? 'bg-lime-accent font-bold text-ink'
                : 'bg-white text-ink hover:bg-white/80'
            }`}
          >
            {hasMultipleYears
              ? `${MONTH_NAMES[p.month]} '${String(p.year).slice(-2)}`
              : MONTH_NAMES[p.month]}
          </button>
        ))}
      </div>

      {/* Pemasukan & Pengeluaran Dual Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-[26px] bg-lime-accent p-5 flex flex-col justify-between min-h-[196px]">
          <div>
            <p className="text-xs font-medium text-ink/70">Pemasukan</p>
            <p className="mt-1.5 font-display text-2xl sm:text-[26px] font-bold text-ink font-mono tabular-nums">
              {formatRp(incomeTotal)}
            </p>
          </div>
          <p className="mt-4 text-xs sm:text-[13px] text-ink/85 leading-relaxed">
            {incomeSubtitle}
          </p>
        </div>

        <div className="rounded-[26px] bg-ink text-white p-5 min-h-[196px]">
          <p className="text-xs font-medium text-white/70">Pengeluaran</p>
          <p className="mt-1.5 font-display text-2xl sm:text-[26px] font-bold text-white font-mono tabular-nums">
            {formatRp(expenseTotal)}
          </p>

          <div className="mt-3.5 space-y-2">
            {topCategories.length === 0 ? (
              <p className="text-xs text-white/70">
                Belum ada pengeluaran di periode ini.
              </p>
            ) : (
              topCategories.map(([cat, amt]) => {
                const pct =
                  expenseTotal > 0 ? Math.round((amt / expenseTotal) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-xs text-white/85 tabular-nums">
                      <span>{CATEGORY_LABELS[cat]}</span>
                      <span className="font-mono">{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-lime-accent transition-all duration-200"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Ringkasan Monthly Bar Chart */}
      <div className="bg-white rounded-[26px] p-5 border border-black/5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-bold text-ink">
              Ringkasan Bulanan
            </h3>
            <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-lime-accent border border-ink/25 inline-block" />
                Pemasukan
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-ink inline-block" />
                Pengeluaran
              </span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-ink-muted block">Total saldo</span>
            <strong className="text-sm font-bold font-mono tabular-nums text-ink">
              {formatRp(balance)}
            </strong>
          </div>
        </div>

        {/* Selected Month Callout Banner */}
        <div className="mt-3 min-h-[36px] flex items-center justify-between rounded-xl bg-mint-soft px-3.5 py-2 text-xs">
          {selectedMonthData ? (
            <>
              <span className="font-semibold text-ink">
                {MONTH_NAMES[selectedMonthData.month]} {selectedMonthData.year}
              </span>
              <span className="font-mono tabular-nums text-ink">
                <span className="text-income font-semibold">
                  +{formatRp(selectedMonthData.income)}
                </span>{' '}
                <span aria-hidden="true">·</span>{' '}
                <span className="text-expense font-semibold">
                  −{formatRp(selectedMonthData.expense)}
                </span>
              </span>
            </>
          ) : (
            <span className="text-ink-muted">
              Ketuk batang bulan di bawah untuk melihat rincian per bulan.
            </span>
          )}
        </div>

        <div
          className="mt-4 flex items-end gap-2 h-44 pt-2 overflow-x-auto no-scrollbar"
          role="group"
          aria-label="Grafik pemasukan dan pengeluaran bulanan"
        >
          {monthlySeries.map((d) => {
            const isSelected = selectedPeriod === d.key;
            const incHeight = d.income > 0 ? Math.max(4, (d.income / maxChartVal) * 100) : 2;
            const expHeight = d.expense > 0 ? Math.max(4, (d.expense / maxChartVal) * 100) : 2;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() =>
                  setSelectedPeriod((prev) => (prev === d.key ? 'all' : d.key))
                }
                aria-label={`${MONTH_NAMES[d.month]} ${d.year}: masuk ${formatRp(
                  d.income
                )}, keluar ${formatRp(d.expense)}`}
                className={`flex-1 min-w-[36px] h-full flex flex-col justify-end items-center gap-1.5 p-1 rounded-xl transition-colors ${
                  isSelected
                    ? 'bg-mint-canvas ring-1 ring-ink/20'
                    : 'hover:bg-mint-soft'
                }`}
              >
                <span className="w-full flex-1 flex items-end gap-1">
                  <span
                    className="flex-1 rounded-t-md rounded-b-xs bg-lime-accent border border-ink/20 transition-all duration-200"
                    style={{ height: `${incHeight}%` }}
                  />
                  <span
                    className="flex-1 rounded-t-md rounded-b-xs bg-ink transition-all duration-200"
                    style={{ height: `${expHeight}%` }}
                  />
                </span>
                <span
                  className={`text-[11px] sm:text-xs whitespace-nowrap ${
                    isSelected ? 'font-bold text-ink' : 'text-ink-muted'
                  }`}
                >
                  {hasMultipleYears
                    ? `${MONTH_NAMES[d.month]} '${String(d.year).slice(-2)}`
                    : MONTH_NAMES[d.month]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Piutang Reimburse */}
      <section aria-label="Piutang reimburse">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-base sm:text-lg font-bold text-ink">
            Piutang reimburse
          </h3>
          <span className="text-xs text-ink-muted">
            Dana talangan belum kembali
          </span>
        </div>

        <div className="bg-white rounded-[26px] px-4 py-1.5 border border-black/5">
          {pendingBySource.length === 0 ? (
            <div className="py-6 text-center text-sm text-income font-medium">
              Semua dana reimburse sudah kembali.
            </div>
          ) : (
            <>
              {pendingBySource.map(([source, info]) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => onOpenReimburseSource(source)}
                  className="w-full flex items-center justify-between gap-3 py-3 min-h-[54px] border-b border-black/6 text-left hover:bg-mint-soft/70 -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div>
                    <span className="block text-sm font-medium text-ink">
                      {source}
                    </span>
                    <span className="text-xs text-ink-muted tabular-nums">
                      {info.count} transaksi menunggu pencairan
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold font-mono tabular-nums text-ink">
                      {formatRp(info.total)}
                    </span>
                    <ChevronRight
                      className="w-4 h-4 text-ink-muted"
                      aria-hidden="true"
                    />
                  </div>
                </button>
              ))}
              <div className="flex items-center justify-between py-3.5 text-sm">
                <span className="font-bold text-ink">Total belum kembali</span>
                <span className="font-bold font-mono tabular-nums text-expense">
                  {formatRp(pendingTotal)}
                </span>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
