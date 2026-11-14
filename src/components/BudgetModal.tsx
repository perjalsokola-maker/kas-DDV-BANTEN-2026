import { X } from 'lucide-react';
import { useState } from 'react';
import { formatRp } from '../data/initialTransactions';
import type { BudgetConfig } from '../types/kas';

interface BudgetModalProps {
  isOpen: boolean;
  budget: BudgetConfig;
  currentBalance: number;
  latestMonthExpense: number;
  latestMonthName: string;
  pendingCount: number;
  pendingTotal: number;
  onClose: () => void;
  onSave: (next: BudgetConfig) => void;
  onFilterPending: () => void;
}

export function BudgetModal({
  isOpen,
  budget,
  currentBalance,
  latestMonthExpense,
  latestMonthName,
  pendingCount,
  pendingTotal,
  onClose,
  onSave,
  onFilterPending,
}: BudgetModalProps) {
  const [monthlyLimit, setMonthlyLimit] = useState(String(budget.monthlyLimit));
  const [reserveTarget, setReserveTarget] = useState(String(budget.reserveTarget));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      monthlyLimit: Math.max(0, Number(monthlyLimit.replace(/\D/g, '')) || 0),
      reserveTarget: Math.max(0, Number(reserveTarget.replace(/\D/g, '')) || 0),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 id="budget-title" className="font-display text-lg font-bold text-ink">
            Atur Anggaran Kas
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan anggaran"
            className="w-11 h-11 -mr-2 rounded-full grid place-items-center text-ink-muted hover:text-ink hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-2xl bg-mint-soft p-3.5 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-ink-muted">Saldo kas saat ini</span>
              <strong className="font-mono tabular-nums text-ink">
                {formatRp(currentBalance)}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">
                Pengeluaran {latestMonthName} 2026
              </span>
              <strong className="font-mono tabular-nums text-expense">
                {formatRp(latestMonthExpense)}
              </strong>
            </div>
          </div>

          <div>
            <label
              htmlFor="monthly-limit"
              className="block text-xs font-semibold text-ink mb-1.5"
            >
              Batas pengeluaran bulanan (Rp)
            </label>
            <input
              id="monthly-limit"
              type="number"
              min="0"
              step="50000"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              className="w-full min-h-[44px] rounded-2xl border border-black/15 px-3.5 text-sm font-mono tabular-nums text-ink focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>

          <div>
            <label
              htmlFor="reserve-target"
              className="block text-xs font-semibold text-ink mb-1.5"
            >
              Target cadangan kas relawan (Rp)
            </label>
            <input
              id="reserve-target"
              type="number"
              min="0"
              step="100000"
              value={reserveTarget}
              onChange={(e) => setReserveTarget(e.target.value)}
              className="w-full min-h-[44px] rounded-2xl border border-black/15 px-3.5 text-sm font-mono tabular-nums text-ink focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>

          {pendingCount > 0 && (
            <div className="rounded-2xl bg-pending-bg/60 p-3.5 flex items-center justify-between gap-3">
              <div className="text-xs text-pending-ink">
                <p className="font-bold tabular-nums">
                  {pendingCount} item belum kembali ({formatRp(pendingTotal)})
                </p>
                <p>Saring transaksi piutang di Beranda.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onFilterPending();
                  onClose();
                }}
                className="min-h-[44px] px-3.5 rounded-full bg-ink text-white text-xs font-semibold whitespace-nowrap shrink-0"
              >
                Tampilkan
              </button>
            </div>
          )}

          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[46px] rounded-full bg-mint-soft text-ink text-sm font-semibold hover:bg-black/5"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[46px] rounded-full bg-lime-accent text-ink text-sm font-bold hover:bg-lime-deep"
            >
              Simpan Anggaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
