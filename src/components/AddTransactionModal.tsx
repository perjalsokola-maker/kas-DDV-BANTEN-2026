import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  CATEGORY_LABELS,
  MONTH_FULL_NAMES,
  REIMBURSE_SOURCES,
  formatRp,
} from '../data/initialTransactions';
import type {
  CategoryCode,
  RawTransactionInput,
  ReimburseSourceCode,
} from '../types/kas';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tx: RawTransactionInput) => void;
}

const SUPPORTED_YEARS = [2026, 2027] as const;

function getDefaultDateParts() {
  const now = new Date();
  const clampedYear = Math.min(2027, Math.max(2026, now.getFullYear()));
  return {
    day: String(now.getDate()).padStart(2, '0'),
    month: now.getMonth() + 1,
    year: clampedYear,
  };
}

export function AddTransactionModal({
  isOpen,
  onClose,
  onAdd,
}: AddTransactionModalProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState(() => getDefaultDateParts().day);
  const [month, setMonth] = useState(() => getDefaultDateParts().month);
  const [year, setYear] = useState(() => getDefaultDateParts().year);
  const [category, setCategory] = useState<CategoryCode>('K');
  const [reimburseMode, setReimburseMode] = useState<'none' | 'pending'>('none');
  const [sourceCode, setSourceCode] = useState<ReimburseSourceCode>('u');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const defaults = getDefaultDateParts();
      setDay(defaults.day);
      setMonth(defaults.month);
      setYear(defaults.year);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const numericAmount = Number(amount.replace(/\D/g, ''));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setError('Keterangan transaksi wajib diisi.');
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      setError('Nominal harus lebih dari Rp0.');
      return;
    }

    const paddedDay = String(Math.min(31, Math.max(1, Number(day) || 1))).padStart(
      2,
      '0'
    );

    const statusCode =
      type === 'expense' && reimburseMode === 'pending' ? `p${sourceCode}` : '_';

    onAdd({
      id: `tx-user-${Date.now()}`,
      day: paddedDay,
      month,
      year,
      title: cleanTitle,
      income: type === 'income' ? numericAmount : 0,
      expense: type === 'expense' ? numericAmount : 0,
      statusCode,
      category: type === 'income' ? 'M' : category,
      isUserCreated: true,
    });

    setTitle('');
    setAmount('');
    setError('');
    setReimburseMode('none');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-tx-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 id="add-tx-title" className="font-display text-lg font-bold text-ink">
            Catat Transaksi Baru
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup form catat transaksi"
            className="w-11 h-11 -mr-2 rounded-full grid place-items-center text-ink-muted hover:text-ink hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-mint-soft border border-black/5">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                if (category === 'M') setCategory('K');
              }}
              className={`min-h-[44px] rounded-full text-sm font-semibold transition-colors ${
                type === 'expense'
                  ? 'bg-ink text-white'
                  : 'text-ink hover:bg-white/60'
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('M');
              }}
              className={`min-h-[44px] rounded-full text-sm font-semibold transition-colors ${
                type === 'income'
                  ? 'bg-lime-accent text-ink'
                  : 'text-ink hover:bg-white/60'
              }`}
            >
              Pemasukan
            </button>
          </div>

          <div>
            <label
              htmlFor="tx-title"
              className="block text-xs font-semibold text-ink mb-1.5"
            >
              Keterangan transaksi
            </label>
            <input
              id="tx-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
              placeholder="Contoh: Snack rapat penanaman mangrove"
              className="w-full min-h-[44px] rounded-2xl border border-black/15 px-3.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="tx-amount"
                className="block text-xs font-semibold text-ink mb-1.5"
              >
                Nominal (Rp)
              </label>
              <input
                id="tx-amount"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, '');
                  setAmount(digitsOnly);
                  setError('');
                }}
                placeholder="Bebas, mis. 25750"
                className="w-full min-h-[44px] rounded-2xl border border-black/15 px-3.5 text-sm font-mono tabular-nums text-ink focus:outline-none focus:ring-2 focus:ring-ink"
              />
              {numericAmount > 0 && (
                <p className="mt-1 text-[11px] text-ink-muted font-mono tabular-nums">
                  {formatRp(numericAmount)}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="tx-cat"
                className="block text-xs font-semibold text-ink mb-1.5"
              >
                Kategori
              </label>
              <select
                id="tx-cat"
                value={type === 'income' ? 'M' : category}
                disabled={type === 'income'}
                onChange={(e) => setCategory(e.target.value as CategoryCode)}
                className="w-full min-h-[44px] rounded-2xl border border-black/15 px-3 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-ink disabled:bg-mint-soft"
              >
                {(Object.entries(CATEGORY_LABELS) as Array<[CategoryCode, string]>)
                  .filter(([code]) => (type === 'income' ? code === 'M' : code !== 'M'))
                  .map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="tx-day"
                className="block text-xs font-semibold text-ink mb-1.5"
              >
                Tanggal (otomatis hari ini)
              </label>
              <input
                id="tx-day"
                type="number"
                min="1"
                max="31"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full min-h-[44px] rounded-2xl border border-black/15 px-3.5 text-sm font-mono tabular-nums text-ink focus:outline-none focus:ring-2 focus:ring-ink"
              />
            </div>

            <div>
              <label
                htmlFor="tx-month"
                className="block text-xs font-semibold text-ink mb-1.5"
              >
                Bulan &amp; Tahun (2026–2027)
              </label>
              <select
                id="tx-month"
                value={`${year}-${month}`}
                onChange={(e) => {
                  const [y, m] = e.target.value.split('-').map(Number);
                  setYear(y);
                  setMonth(m);
                }}
                className="w-full min-h-[44px] rounded-2xl border border-black/15 px-3 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-ink"
              >
                {SUPPORTED_YEARS.map((y) => (
                  <optgroup key={y} label={`Tahun ${y}`}>
                    {MONTH_FULL_NAMES.slice(1).map((mName, idx) => (
                      <option key={`${y}-${idx + 1}`} value={`${y}-${idx + 1}`}>
                        {mName} {y}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {type === 'expense' && (
            <div className="rounded-2xl bg-mint-soft p-3.5 space-y-2.5">
              <label className="block text-xs font-semibold text-ink">
                Status Dana
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReimburseMode('none')}
                  className={`min-h-[44px] px-3 rounded-xl text-xs font-semibold transition-colors ${
                    reimburseMode === 'none'
                      ? 'bg-ink text-white'
                      : 'bg-white text-ink'
                  }`}
                >
                  Kas murni
                </button>
                <button
                  type="button"
                  onClick={() => setReimburseMode('pending')}
                  className={`min-h-[44px] px-3 rounded-xl text-xs font-semibold transition-colors ${
                    reimburseMode === 'pending'
                      ? 'bg-lime-accent text-ink'
                      : 'bg-white text-ink'
                  }`}
                >
                  Ajukan reimburse
                </button>
              </div>

              {reimburseMode === 'pending' && (
                <div>
                  <label
                    htmlFor="tx-src"
                    className="block text-xs text-ink-muted mb-1"
                  >
                    Sumber pencairan reimburse
                  </label>
                  <select
                    id="tx-src"
                    value={sourceCode}
                    onChange={(e) =>
                      setSourceCode(e.target.value as ReimburseSourceCode)
                    }
                    className="w-full min-h-[44px] rounded-xl border border-black/15 px-3 text-sm bg-white text-ink"
                  >
                    {(
                      Object.entries(REIMBURSE_SOURCES) as Array<
                        [ReimburseSourceCode, string]
                      >
                    ).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs font-semibold text-expense" role="alert">
              {error}
            </p>
          )}

          <div className="pt-2 flex gap-2">
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
              Simpan Transaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
