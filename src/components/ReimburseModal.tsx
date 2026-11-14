import { CheckCircle2, X } from 'lucide-react';
import { useMemo } from 'react';
import { MONTH_NAMES, formatRp } from '../data/initialTransactions';
import type { Transaction } from '../types/kas';

interface ReimburseModalProps {
  isOpen: boolean;
  initialSourceFilter?: string;
  transactions: Transaction[];
  onClose: () => void;
  onSettleSingle: (txId: string) => void;
  onSettleSourceBatch: (sourceName: string) => void;
}

export function ReimburseModal({
  isOpen,
  initialSourceFilter,
  transactions,
  onClose,
  onSettleSingle,
  onSettleSourceBatch,
}: ReimburseModalProps) {
  const pendingGroups = useMemo(() => {
    const groups: Record<string, { items: Transaction[]; total: number }> = {};
    transactions.forEach((tx) => {
      if (tx.status?.kind === 'p') {
        const src = tx.status.sourceName || 'Umum';
        if (!groups[src]) groups[src] = { items: [], total: 0 };
        groups[src].items.push(tx);
        groups[src].total += tx.expense;
      }
    });
    return Object.entries(groups).sort((a, b) => {
      if (initialSourceFilter) {
        if (a[0] === initialSourceFilter) return -1;
        if (b[0] === initialSourceFilter) return 1;
      }
      return b[1].total - a[1].total;
    });
  }, [transactions, initialSourceFilter]);

  const totalPending = useMemo(
    () => pendingGroups.reduce((acc, [, g]) => acc + g.total, 0),
    [pendingGroups]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reimburse-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl bg-white rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xl max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div>
            <h3
              id="reimburse-title"
              className="font-display text-lg font-bold text-ink"
            >
              Kelola Reimburse & Piutang
            </h3>
            <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
              Total dana talangan belum kembali:{' '}
              <strong className="text-expense">{formatRp(totalPending)}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup kelola reimburse"
            className="w-11 h-11 -mt-1 -mr-2 rounded-full grid place-items-center text-ink-muted hover:text-ink hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 overflow-y-auto space-y-4 pr-1">
          {pendingGroups.length === 0 ? (
            <div className="py-10 text-center bg-mint-soft rounded-2xl px-4">
              <CheckCircle2
                className="w-9 h-9 text-income mx-auto mb-2"
                aria-hidden="true"
              />
              <p className="font-semibold text-sm text-ink">
                Semua piutang reimburse telah selesai!
              </p>
              <p className="text-xs text-ink-muted mt-1">
                Tidak ada tagihan talangan yang masih menunggu pencairan.
              </p>
            </div>
          ) : (
            pendingGroups.map(([source, group]) => (
              <div
                key={source}
                className={`rounded-2xl border p-4 ${
                  initialSourceFilter === source
                    ? 'border-ink bg-mint-soft/70'
                    : 'border-black/10 bg-mint-soft/30'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/8">
                  <div>
                    <h4 className="font-display text-sm font-bold text-ink">
                      Sumber: {source}
                    </h4>
                    <p className="text-xs text-ink-muted tabular-nums">
                      {group.items.length} item · Total{' '}
                      <strong className="text-expense">
                        {formatRp(group.total)}
                      </strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSettleSourceBatch(source)}
                    className="min-h-[44px] px-4 rounded-full bg-ink text-white text-xs font-semibold hover:bg-ink/90 whitespace-nowrap"
                  >
                    Cairkan Semua ({source})
                  </button>
                </div>

                <div className="divide-y divide-black/6 mt-1">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="py-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-ink-muted tabular-nums">
                          {item.day} {MONTH_NAMES[item.month]} {item.year} ·{' '}
                          <span className="font-mono font-semibold text-expense">
                            {formatRp(item.expense)}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSettleSingle(item.id)}
                        className="min-h-[44px] px-3.5 rounded-full bg-lime-accent text-ink text-xs font-bold hover:bg-lime-deep whitespace-nowrap shrink-0"
                      >
                        Sudah kembali
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[46px] rounded-full bg-lime-accent text-ink text-sm font-bold hover:bg-lime-deep"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
