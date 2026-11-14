import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { formatRp } from '../data/initialTransactions';

interface NotificationsModalProps {
  isOpen: boolean;
  pendingCount: number;
  pendingTotal: number;
  balance: number;
  reserveTarget: number;
  latestMonthExpense: number;
  monthlyLimit: number;
  latestMonthName: string;
  onClose: () => void;
  onOpenReimburse: () => void;
}

export function NotificationsModal({
  isOpen,
  pendingCount,
  pendingTotal,
  balance,
  reserveTarget,
  latestMonthExpense,
  monthlyLimit,
  latestMonthName,
  onClose,
  onOpenReimburse,
}: NotificationsModalProps) {
  if (!isOpen) return null;

  const overBudget = monthlyLimit > 0 && latestMonthExpense > monthlyLimit;
  const belowReserve = reserveTarget > 0 && balance < reserveTarget;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notif-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 id="notif-title" className="font-display text-lg font-bold text-ink">
            Pengingat Kas DDV
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengingat"
            className="w-11 h-11 -mr-2 rounded-full grid place-items-center text-ink-muted hover:text-ink hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {pendingCount > 0 && (
            <div className="rounded-2xl bg-pending-bg/50 p-4 flex items-start gap-3">
              <AlertCircle
                className="w-5 h-5 text-pending-ink shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink">
                  {pendingCount} item reimburse menunggu pencairan
                </p>
                <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
                  Total piutang aktif sebesar{' '}
                  <strong className="text-pending-ink">
                    {formatRp(pendingTotal)}
                  </strong>
                  .
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenReimburse();
                  }}
                  className="mt-2.5 min-h-[40px] px-4 rounded-full bg-ink text-white text-xs font-semibold hover:bg-ink/90"
                >
                  Kelola Reimburse
                </button>
              </div>
            </div>
          )}

          {overBudget && (
            <div className="rounded-2xl bg-orange-50 p-4 flex items-start gap-3">
              <AlertCircle
                className="w-5 h-5 text-expense shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="text-xs text-ink">
                <p className="text-sm font-bold text-expense">
                  Pengeluaran {latestMonthName} melampaui anggaran
                </p>
                <p className="mt-0.5 text-ink-muted tabular-nums">
                  Tercatat {formatRp(latestMonthExpense)} dari batas{' '}
                  {formatRp(monthlyLimit)}.
                </p>
              </div>
            </div>
          )}

          {belowReserve && (
            <div className="rounded-2xl bg-mint-soft p-4 flex items-start gap-3">
              <AlertCircle
                className="w-5 h-5 text-ink shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="text-xs text-ink">
                <p className="text-sm font-bold text-ink">
                  Saldo di bawah target cadangan
                </p>
                <p className="mt-0.5 text-ink-muted tabular-nums">
                  Saldo saat ini {formatRp(balance)}, target cadangan{' '}
                  {formatRp(reserveTarget)}.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-mint-soft/70 p-4 flex items-start gap-3">
            <CheckCircle2
              className="w-5 h-5 text-income shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="text-xs text-ink">
              <p className="text-sm font-bold text-ink">
                Rekonsiliasi kas cocok
              </p>
              <p className="mt-0.5 text-ink-muted">
                Seluruh mutasi pemasukan dan pengeluaran terhitung berurutan.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full min-h-[46px] rounded-full bg-lime-accent text-ink text-sm font-bold hover:bg-lime-deep"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
