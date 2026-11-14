import { BookOpen, Check, Copy, Download, FileSpreadsheet, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import {
  CATEGORY_LABELS,
  MONTH_NAMES,
  formatRp,
} from '../data/initialTransactions';
import type { Transaction } from '../types/kas';

interface MoreMenuModalProps {
  isOpen: boolean;
  transactions: Transaction[];
  balance: number;
  totalIncome: number;
  totalExpense: number;
  pendingTotal: number;
  onClose: () => void;
  onOpenOnboarding: () => void;
  onOpenGoogleSheets: () => void;
  onResetData: () => void;
}

export function MoreMenuModal({
  isOpen,
  transactions,
  balance,
  totalIncome,
  totalExpense,
  pendingTotal,
  onClose,
  onOpenOnboarding,
  onOpenGoogleSheets,
  onResetData,
}: MoreMenuModalProps) {
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleExportCsv = () => {
    const header = [
      'Tanggal',
      'Keterangan',
      'Kegiatan',
      'Kategori',
      'Pemasukan',
      'Pengeluaran',
      'Saldo Setelahnya',
      'Status',
    ];
    const rows = transactions.map((t) => [
      `${t.day} ${MONTH_NAMES[t.month]} ${t.year}`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.program}"`,
      CATEGORY_LABELS[t.category],
      t.income,
      t.expense,
      t.balanceAfter,
      `"${t.status ? t.status.label : 'Kas murni'}"`,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kas-ddv-banten-2026.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = async () => {
    const text = [
      '*Laporan Ringkas Kas DDV Banten 2026*',
      `PIC: Nurul Amanah · PJ Catatan: Pauzan`,
      `Saldo Akhir: ${formatRp(balance)}`,
      `Total Pemasukan: ${formatRp(totalIncome)}`,
      `Total Pengeluaran: ${formatRp(totalExpense)}`,
      `Piutang Reimburse Aktif: ${formatRp(pendingTotal)}`,
      `Jumlah Transaksi: ${transactions.length}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="more-menu-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 id="more-menu-title" className="font-display text-lg font-bold text-ink">
            Menu & Ekspor Laporan
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu lainnya"
            className="w-11 h-11 -mr-2 rounded-full grid place-items-center text-ink-muted hover:text-ink hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenGoogleSheets();
            }}
            className="w-full min-h-[52px] px-4 rounded-2xl bg-lime-accent/70 hover:bg-lime-accent flex items-center gap-3 text-left transition-colors"
          >
            <FileSpreadsheet className="w-5 h-5 text-ink shrink-0" aria-hidden="true" />
            <div>
              <span className="block text-sm font-bold text-ink">
                Sinkronisasi Google Sheets & CSV
              </span>
              <span className="block text-xs text-ink/80">
                Kirim data otomatis ke Google Sheets atau impor file CSV
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="w-full min-h-[52px] px-4 rounded-2xl bg-mint-soft hover:bg-lime-accent/50 flex items-center gap-3 text-left transition-colors"
          >
            <Download className="w-5 h-5 text-ink shrink-0" aria-hidden="true" />
            <div>
              <span className="block text-sm font-semibold text-ink">
                Unduh Laporan CSV
              </span>
              <span className="block text-xs text-ink-muted">
                Ekspor seluruh {transactions.length} transaksi ke Excel / Sheets
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="w-full min-h-[52px] px-4 rounded-2xl bg-mint-soft hover:bg-lime-accent/50 flex items-center gap-3 text-left transition-colors"
          >
            {copied ? (
              <Check className="w-5 h-5 text-income shrink-0" aria-hidden="true" />
            ) : (
              <Copy className="w-5 h-5 text-ink shrink-0" aria-hidden="true" />
            )}
            <div>
              <span className="block text-sm font-semibold text-ink">
                {copied ? 'Ringkasan tersalin!' : 'Salin Ringkasan WhatsApp'}
              </span>
              <span className="block text-xs text-ink-muted">
                Format teks siap kirim ke grup relawan DDV Banten
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenOnboarding();
            }}
            className="w-full min-h-[52px] px-4 rounded-2xl bg-mint-soft hover:bg-lime-accent/50 flex items-center gap-3 text-left transition-colors"
          >
            <BookOpen className="w-5 h-5 text-ink shrink-0" aria-hidden="true" />
            <div>
              <span className="block text-sm font-semibold text-ink">
                Lihat Sampul Pembuka
              </span>
              <span className="block text-xs text-ink-muted">
                Tampilkan halaman pengenalan Kas DDV Banten 2026
              </span>
            </div>
          </button>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="w-full min-h-[52px] px-4 rounded-2xl bg-orange-50 hover:bg-orange-100 flex items-center gap-3 text-left transition-colors"
            >
              <RotateCcw className="w-5 h-5 text-expense shrink-0" aria-hidden="true" />
              <div>
                <span className="block text-sm font-semibold text-expense">
                  Reset Data ke Laporan Awal
                </span>
                <span className="block text-xs text-ink-muted">
                  Kembalikan seluruh data ke catatan awal 24 Apr – 30 Okt 2026
                </span>
              </div>
            </button>
          ) : (
            <div className="rounded-2xl bg-orange-50 p-4 space-y-2.5">
              <p className="text-xs font-semibold text-expense">
                Yakin ingin menghapus perubahan lokal dan mengembalikan laporan
                awal?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 min-h-[44px] rounded-full bg-white text-ink text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onResetData();
                    setConfirmReset(false);
                    onClose();
                  }}
                  className="flex-1 min-h-[44px] rounded-full bg-expense text-white text-xs font-bold"
                >
                  Ya, Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
