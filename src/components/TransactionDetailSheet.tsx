import { CheckCircle2, Trash2, X } from 'lucide-react';
import {
  CATEGORY_LABELS,
  MONTH_FULL_NAMES,
  formatRp,
} from '../data/initialTransactions';
import type { Transaction } from '../types/kas';

interface TransactionDetailSheetProps {
  transaction: Transaction | null;
  onClose: () => void;
  onMarkSettled: (txId: string) => void;
  onDeleteTransaction: (txId: string) => void;
}

export function TransactionDetailSheet({
  transaction,
  onClose,
  onMarkSettled,
  onDeleteTransaction,
}: TransactionDetailSheetProps) {
  if (!transaction) return null;

  const isIncome = transaction.income > 0;
  const isPending = transaction.status?.kind === 'p';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-detail-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-black/15 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-start justify-between gap-3">
          <h3
            id="tx-detail-title"
            className="font-display text-lg font-bold text-ink leading-snug"
          >
            {transaction.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail transaksi"
            className="w-11 h-11 -mt-2 -mr-2 rounded-full grid place-items-center text-ink-muted hover:text-ink hover:bg-black/5 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <dl className="mt-4 divide-y divide-black/6 text-sm">
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-ink-muted">Tanggal</dt>
            <dd className="font-medium text-ink text-right tabular-nums">
              {transaction.day} {MONTH_FULL_NAMES[transaction.month]}{' '}
              {transaction.year}
            </dd>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-ink-muted">Kategori</dt>
            <dd className="font-medium text-ink text-right">
              {CATEGORY_LABELS[transaction.category]}
            </dd>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-ink-muted">Kegiatan</dt>
            <dd className="font-medium text-ink text-right">
              {transaction.program}
            </dd>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-ink-muted">Nominal</dt>
            <dd
              className={`font-bold font-mono tabular-nums text-right ${
                isIncome ? 'text-income' : 'text-expense'
              }`}
            >
              {isIncome
                ? `+${formatRp(transaction.income)}`
                : `−${formatRp(transaction.expense)}`}
            </dd>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-ink-muted">Saldo setelahnya</dt>
            <dd className="font-bold font-mono tabular-nums text-ink text-right">
              {formatRp(transaction.balanceAfter)}
            </dd>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-ink-muted">Status</dt>
            <dd
              className={`font-medium text-right ${
                isPending ? 'text-pending-ink font-semibold' : 'text-ink'
              }`}
            >
              {transaction.status
                ? transaction.status.label
                : 'Kas murni / belum ada status'}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-col gap-2.5">
          {isPending && (
            <button
              type="button"
              onClick={() => {
                onMarkSettled(transaction.id);
                onClose();
              }}
              className="w-full min-h-[46px] rounded-full bg-ink text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-ink/90 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-lime-accent" aria-hidden="true" />
              <span>Tandai Reimburse Sudah Kembali</span>
            </button>
          )}

          {transaction.isUserCreated && (
            <button
              type="button"
              onClick={() => {
                onDeleteTransaction(transaction.id);
                onClose();
              }}
              className="w-full min-h-[44px] rounded-full bg-orange-50 text-expense text-sm font-semibold flex items-center justify-center gap-2 hover:bg-orange-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>Hapus Transaksi</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[46px] rounded-full bg-lime-accent text-ink text-sm font-bold hover:bg-lime-deep transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
