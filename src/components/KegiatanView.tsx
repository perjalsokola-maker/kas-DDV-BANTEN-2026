import { ArrowLeft, ChevronRight, FolderKanban } from 'lucide-react';
import { useMemo } from 'react';
import { formatRp } from '../data/initialTransactions';
import type { Transaction } from '../types/kas';

interface KegiatanViewProps {
  transactions: Transaction[];
  onSelectProgram: (program: string) => void;
  onBack?: () => void;
}

export function KegiatanView({
  transactions,
  onSelectProgram,
  onBack,
}: KegiatanViewProps) {
  const programs = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        expense: number;
        income: number;
        pending: number;
        count: number;
      }
    > = {};

    transactions.forEach((tx) => {
      if (!map[tx.program]) {
        map[tx.program] = {
          name: tx.program,
          expense: 0,
          income: 0,
          pending: 0,
          count: 0,
        };
      }
      const p = map[tx.program];
      p.expense += tx.expense;
      p.income += tx.income;
      if (tx.status?.kind === 'p') p.pending += tx.expense;
      p.count += 1;
    });

    return Object.values(map).sort((a, b) => b.expense - a.expense);
  }, [transactions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="lg:hidden min-h-[44px] px-4 rounded-full bg-white text-ink font-medium inline-flex items-center gap-1.5 hover:bg-white/80"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Kembali</span>
          </button>
        ) : (
          <div className="lg:hidden" />
        )}
        <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">
          Kegiatan DDV Banten
        </h2>
        <span className="text-xs text-ink-muted tabular-nums">
          {programs.length} program
        </span>
      </div>

      <p className="text-sm text-ink-muted">
        Rekap otomatis pemasukan, pengeluaran, dan piutang berdasarkan program
        kegiatan relawan 2026. Ketuk kegiatan untuk melihat rincian transaksinya.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {programs.map((prog) => (
          <button
            key={prog.name}
            type="button"
            onClick={() => onSelectProgram(prog.name)}
            className="w-full text-left bg-white rounded-[24px] p-4 sm:p-5 border border-black/5 hover:border-ink/25 hover:bg-mint-soft/60 transition-colors flex flex-col justify-between gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-9 h-9 rounded-full bg-lime-accent text-ink grid place-items-center shrink-0">
                  <FolderKanban className="w-4 h-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-sm sm:text-base font-bold text-ink truncate">
                    {prog.name}
                  </h3>
                  <p className="text-xs text-ink-muted tabular-nums">
                    {prog.count} transaksi tercatat
                  </p>
                </div>
              </div>
              <ChevronRight
                className="w-4 h-4 text-ink-muted shrink-0 mt-1"
                aria-hidden="true"
              />
            </div>

            <div className="pt-2.5 border-t border-black/6 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-ink-muted block">Pengeluaran</span>
                <strong className="font-mono tabular-nums text-expense text-sm">
                  {formatRp(prog.expense)}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-ink-muted block">
                  {prog.pending > 0 ? 'Piutang Reimburse' : 'Pemasukan Terkait'}
                </span>
                <strong
                  className={`font-mono tabular-nums text-sm ${
                    prog.pending > 0 ? 'text-pending-ink' : 'text-income'
                  }`}
                >
                  {prog.pending > 0
                    ? formatRp(prog.pending)
                    : formatRp(prog.income)}
                </strong>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
