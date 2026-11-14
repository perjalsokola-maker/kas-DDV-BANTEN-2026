import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  CATEGORY_LABELS,
  CATEGORY_SHORT,
  MONTH_NAMES,
  formatRp,
} from '../data/initialTransactions';
import type { CategoryCode, Transaction } from '../types/kas';

interface TransactionListProps {
  transactions: Transaction[];
  selectedCategory: CategoryCode | '';
  onSelectCategory: (cat: CategoryCode | '') => void;
  statusFilter: 'all' | 'pending' | 'settled';
  onStatusFilterChange: (status: 'all' | 'pending' | 'settled') => void;
  programFilter: string;
  onClearProgramFilter: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onOpenAdd: () => void;
}

export function TransactionList({
  transactions,
  selectedCategory,
  onSelectCategory,
  statusFilter,
  onStatusFilterChange,
  programFilter,
  onClearProgramFilter,
  onSelectTransaction,
  onOpenAdd,
}: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions
      .filter((tx) => {
        if (selectedCategory && tx.category !== selectedCategory) return false;
        if (statusFilter === 'pending' && tx.status?.kind !== 'p') return false;
        if (
          statusFilter === 'settled' &&
          tx.status?.kind !== 's' &&
          tx.status?.kind !== 'r'
        ) {
          return false;
        }
        if (programFilter && tx.program !== programFilter) return false;
        if (
          q &&
          !tx.title.toLowerCase().includes(q) &&
          !tx.program.toLowerCase().includes(q) &&
          !CATEGORY_LABELS[tx.category].toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .slice()
      .reverse();
  }, [transactions, selectedCategory, statusFilter, programFilter, searchQuery]);

  const visibleItems = showAll ? filtered : filtered.slice(0, 8);

  const categoryTabs: Array<[CategoryCode | '', string]> = [
    ['', 'Semua'],
    ...(Object.entries(CATEGORY_LABELS) as Array<[CategoryCode, string]>),
  ];

  const statusTabs: Array<['all' | 'pending' | 'settled', string]> = [
    ['all', 'Semua status'],
    ['pending', 'Belum kembali'],
    ['settled', 'Sudah kembali'],
  ];

  return (
    <section aria-label="Aktivitas terbaru">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-display text-lg font-bold text-ink">
          Aktivitas terbaru
        </h2>
        <span className="text-xs text-ink-muted tabular-nums">
          {filtered.length} transaksi
        </span>
      </div>

      {/* Search & Program filter notice */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari keterangan, kegiatan, atau kategori..."
            aria-label="Cari transaksi"
            className="w-full min-h-[44px] rounded-2xl bg-white border border-black/10 pl-10 pr-9 text-sm text-ink placeholder:text-ink-muted/80 focus:outline-none focus:ring-2 focus:ring-ink"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Hapus pencarian"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-full text-ink-muted hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {programFilter && (
          <button
            type="button"
            onClick={onClearProgramFilter}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-2xl bg-ink text-white text-xs font-medium whitespace-nowrap shrink-0 hover:bg-ink/90"
          >
            <span>Kegiatan: {programFilter}</span>
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Category Filter Buttons */}
      <div
        className="flex gap-2 overflow-x-auto no-scrollbar pb-1.5"
        role="group"
        aria-label="Filter kategori"
      >
        {categoryTabs.map(([code, label]) => {
          const active = selectedCategory === code;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelectCategory(code)}
              className={`min-h-[44px] px-4 rounded-full text-xs sm:text-sm whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'bg-lime-accent font-bold text-ink'
                  : 'bg-white text-ink hover:bg-white/80'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Status Filter Buttons */}
      <div
        className="flex gap-2 overflow-x-auto no-scrollbar pt-1 pb-3"
        role="group"
        aria-label="Filter status reimburse"
      >
        {statusTabs.map(([val, label]) => {
          const active = statusFilter === val;
          return (
            <button
              key={val}
              type="button"
              onClick={() => onStatusFilterChange(val)}
              className={`min-h-[44px] px-4 rounded-full text-xs sm:text-sm whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'bg-lime-accent font-bold text-ink'
                  : 'bg-white text-ink hover:bg-white/80'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Transaction List Card */}
      <div className="bg-white rounded-[26px] px-4 py-1.5 border border-black/5">
        {visibleItems.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-ink-muted">
              Tidak ada transaksi yang cocok dengan filter ini.
            </p>
            <button
              type="button"
              onClick={onOpenAdd}
              className="mt-3 inline-flex items-center justify-center min-h-[44px] px-5 rounded-full bg-lime-accent text-ink text-sm font-bold hover:bg-lime-deep transition-colors"
            >
              Catat transaksi baru
            </button>
          </div>
        ) : (
          visibleItems.map((tx, index) => {
            const isIncome = tx.income > 0;
            const isPending = tx.status?.kind === 'p';
            return (
              <button
                key={tx.id}
                type="button"
                onClick={() => onSelectTransaction(tx)}
                className={`w-full flex items-center gap-3 py-3 text-left min-h-[60px] hover:bg-mint-soft/70 -mx-2 px-2 rounded-xl transition-colors ${
                  index < visibleItems.length - 1 ? 'border-b border-black/6' : ''
                }`}
              >
                <span
                  aria-hidden="true"
                  className="flex-none w-10 h-10 rounded-full bg-ink text-white grid place-items-center text-xs font-bold"
                >
                  {CATEGORY_SHORT[tx.category]}
                </span>

                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-ink truncate">
                    {tx.title}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-ink-muted">
                    <span className="tabular-nums">
                      {tx.day} {MONTH_NAMES[tx.month]} {tx.year}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{CATEGORY_LABELS[tx.category]}</span>
                    {isPending && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-pending-ink">
                          Proses reimburse ({tx.status?.sourceName})
                        </span>
                      </>
                    )}
                    {tx.status && !isPending && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-income font-medium">
                          {tx.status.label}
                        </span>
                      </>
                    )}
                  </span>
                </span>

                <span
                  className={`flex-none text-sm font-bold tabular-nums font-mono whitespace-nowrap ${
                    isIncome ? 'text-income' : 'text-expense'
                  }`}
                >
                  {isIncome
                    ? `+${formatRp(tx.income)}`
                    : `−${formatRp(tx.expense)}`}
                </span>
              </button>
            );
          })
        )}
      </div>

      {filtered.length > 8 && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="min-h-[44px] px-5 rounded-full bg-white text-ink text-xs sm:text-sm font-semibold border border-black/8 hover:bg-lime-accent transition-colors"
          >
            {showAll
              ? 'Tampilkan 8 terbaru'
              : `Lihat semua (${filtered.length} transaksi)`}
          </button>
        </div>
      )}
    </section>
  );
}
