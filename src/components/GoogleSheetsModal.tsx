import type { User } from 'firebase/auth';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  FolderUp,
  LogOut,
  RefreshCw,
  Send,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { parseLaporanCsv, parseRowsToTransactions } from '../lib/csvParser';
import {
  type SheetTabInfo,
  appendContinuingTransactionsToSheet,
  createKasSpreadsheet,
  extractSpreadsheetId,
  fetchSpreadsheetMetadata,
  findUnsyncedTransactions,
  readSheetRows,
} from '../lib/googleSheets';
import type { RawTransactionInput, Transaction } from '../types/kas';
import { GoogleSignInButton } from './GoogleSignInButton';

export interface SheetConnectionConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetTitle: string;
  sheetId: number;
  sheetTitle: string;
  availableSheets: SheetTabInfo[];
  autoSync: boolean;
  lastSyncedAt?: string;
}

interface GoogleSheetsModalProps {
  isOpen: boolean;
  user: User | null;
  accessToken: string | null;
  transactions: Transaction[];
  connection: SheetConnectionConfig | null;
  syncStatusMessage: string | null;
  onClose: () => void;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onUpdateConnection: (next: SheetConnectionConfig | null) => void;
  onImportTransactions: (items: RawTransactionInput[], sourceLabel: string) => void;
  onTokenExpired: () => void;
}

type PendingConfirmation =
  | {
      type: 'append_new';
      title: string;
      description: string;
      newTransactions: Transaction[];
    }
  | {
      type: 'import_sheet';
      title: string;
      description: string;
      items: RawTransactionInput[];
    }
  | {
      type: 'import_csv';
      title: string;
      description: string;
      items: RawTransactionInput[];
      fileName: string;
    };

export function GoogleSheetsModal({
  isOpen,
  user,
  accessToken,
  transactions,
  connection,
  syncStatusMessage,
  onClose,
  onSignIn,
  onSignOut,
  onUpdateConnection,
  onImportTransactions,
  onTokenExpired,
}: GoogleSheetsModalProps) {
  const [urlInput, setUrlInput] = useState(connection?.spreadsheetUrl || '');
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] =
    useState<PendingConfirmation | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleAuthAction = async () => {
    setErrorMsg(null);
    setBusyAction('auth');
    try {
      await onSignIn();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Gagal masuk dengan akun Google.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!accessToken) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusyAction('create');
    try {
      const created = await createKasSpreadsheet(accessToken, transactions);
      onUpdateConnection({
        spreadsheetId: created.spreadsheetId,
        spreadsheetUrl: created.spreadsheetUrl,
        spreadsheetTitle: created.title,
        sheetId: created.sheetId,
        sheetTitle: created.sheetTitle,
        availableSheets: [
          { sheetId: created.sheetId, title: created.sheetTitle },
        ],
        autoSync: true,
        lastSyncedAt: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
      setUrlInput(created.spreadsheetUrl);
      setSuccessMsg(
        `Spreadsheet baru dibuat dan ${transactions.length} transaksi dimasukkan.`
      );
    } catch (err) {
      if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
        onTokenExpired();
        setErrorMsg('Sesi Google berakhir. Silakan masuk kembali.');
      } else {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Gagal membuat Google Spreadsheet.'
        );
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleConnectExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    const id = extractSpreadsheetId(urlInput);
    if (!id) {
      setErrorMsg(
        'Tempelkan tautan (URL) Google Sheets atau ID Spreadsheet yang valid.'
      );
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setBusyAction('connect');
    try {
      const meta = await fetchSpreadsheetMetadata(accessToken, id);
      const firstSheet = meta.sheets[0] || { sheetId: 0, title: 'Sheet1' };
      onUpdateConnection({
        spreadsheetId: meta.spreadsheetId,
        spreadsheetUrl: meta.spreadsheetUrl,
        spreadsheetTitle: meta.title,
        sheetId: firstSheet.sheetId,
        sheetTitle: firstSheet.title,
        availableSheets: meta.sheets,
        autoSync: true,
      });
      setSuccessMsg(
        `Terhubung ke "${meta.title}" (tab: ${firstSheet.title}). Data lama tetap aman.`
      );
    } catch (err) {
      if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
        onTokenExpired();
        setErrorMsg('Sesi Google berakhir. Silakan masuk kembali.');
      } else {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Tidak dapat mengakses spreadsheet tersebut. Pastikan akun Google Anda memiliki izin edit.'
        );
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handlePrepareAppendNew = async () => {
    if (!accessToken || !connection) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusyAction('check');
    try {
      const { unsynced, existingCount } = await findUnsyncedTransactions(
        accessToken,
        connection.spreadsheetId,
        connection.sheetTitle,
        transactions
      );
      if (unsynced.length === 0) {
        setSuccessMsg(
          `Semua transaksi sudah tercatat di tab "${connection.sheetTitle}" (${existingCount} baris). Tidak ada data baru yang perlu ditambahkan.`
        );
        return;
      }
      setPendingConfirm({
        type: 'append_new',
        title: `Tambahkan ${unsynced.length} transaksi baru ke "${connection.sheetTitle}"?`,
        description: `Isi lama (${existingCount} baris) dan total laporan pada spreadsheet tidak akan diubah. Aplikasi hanya menyisipkan ${unsynced.length} transaksi lanjutan setelah baris transaksi terakhir.`,
        newTransactions: unsynced,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
        onTokenExpired();
        setErrorMsg('Sesi Google berakhir. Silakan masuk kembali.');
      } else {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Gagal memeriksa data pada Google Sheets.'
        );
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handlePrepareImportFromSheet = async () => {
    if (!accessToken || !connection) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusyAction('read');
    try {
      const rows = await readSheetRows(
        accessToken,
        connection.spreadsheetId,
        connection.sheetTitle
      );
      const parsed = parseRowsToTransactions(rows);
      if (parsed.length === 0) {
        setErrorMsg(
          `Tidak ditemukan baris transaksi berformat tanggal & nominal pada tab "${connection.sheetTitle}".`
        );
        return;
      }
      setPendingConfirm({
        type: 'import_sheet',
        title: `Muat ${parsed.length} transaksi dari Google Sheets?`,
        description: `Data kas di aplikasi akan disamakan dengan ${parsed.length} baris transaksi yang ada di tab "${connection.sheetTitle}" (${connection.spreadsheetTitle}). Isi spreadsheet tidak berubah.`,
        items: parsed,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
        onTokenExpired();
        setErrorMsg('Sesi Google berakhir. Silakan masuk kembali.');
      } else {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Gagal membaca data dari Google Sheets.'
        );
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const content = await file.text();
      const parsed = parseLaporanCsv(content);
      if (parsed.length === 0) {
        setErrorMsg(
          'Format CSV tidak dikenali. Pastikan kolom TGL, RINCIAN PENGELUARAN, PEMASUKAN, dan PENGELUARAN tersedia.'
        );
        return;
      }
      setPendingConfirm({
        type: 'import_csv',
        title: `Impor ${parsed.length} transaksi dari file CSV?`,
        description: `File "${file.name}" berisi ${parsed.length} transaksi yang siap dimuat ke aplikasi.`,
        items: parsed,
        fileName: file.name,
      });
    } catch {
      setErrorMsg('Gagal membaca file CSV.');
    }
  };

  const executePendingConfirmation = async () => {
    if (!pendingConfirm) return;
    const action = pendingConfirm;
    setPendingConfirm(null);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (action.type === 'append_new') {
      if (!accessToken || !connection) return;
      setBusyAction('sync');
      try {
        const res = await appendContinuingTransactionsToSheet(
          accessToken,
          connection.spreadsheetId,
          connection.sheetId,
          connection.sheetTitle,
          action.newTransactions
        );
        onUpdateConnection({
          ...connection,
          lastSyncedAt: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
        setSuccessMsg(
          `${res.addedCount} transaksi baru berhasil ditambahkan melanjutkan baris terakhir di "${connection.sheetTitle}".`
        );
      } catch (err) {
        if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
          onTokenExpired();
          setErrorMsg('Sesi Google berakhir. Silakan masuk kembali.');
        } else {
          setErrorMsg(
            err instanceof Error
              ? err.message
              : 'Gagal menambahkan baris baru ke Google Sheets.'
          );
        }
      } finally {
        setBusyAction(null);
      }
    } else if (action.type === 'import_sheet') {
      onImportTransactions(action.items, 'Google Sheets');
      setSuccessMsg(
        `Berhasil memuat ${action.items.length} transaksi dari Google Sheets.`
      );
    } else if (action.type === 'import_csv') {
      onImportTransactions(action.items, action.fileName);
      setSuccessMsg(
        `Berhasil mengimpor ${action.items.length} transaksi dari ${action.fileName}.`
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gsheets-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-full bg-lime-accent text-ink grid place-items-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <h3
                id="gsheets-title"
                className="font-display text-lg font-bold text-ink"
              >
                Sinkronisasi Google Sheets
              </h3>
              <p className="text-xs text-ink-muted">
                Melanjutkan data transaksi baru tanpa mengubah isi laporan lama
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel Google Sheets"
            className="w-11 h-11 -mt-1 -mr-2 rounded-full grid place-items-center text-ink-muted hover:text-ink hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation Dialog */}
        {pendingConfirm && (
          <div
            className="mt-4 rounded-2xl border border-orange-300 bg-orange-50 p-4 space-y-3"
            role="alertdialog"
            aria-labelledby="confirm-action-title"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle
                className="w-5 h-5 text-expense shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <h4
                  id="confirm-action-title"
                  className="text-sm font-bold text-ink"
                >
                  {pendingConfirm.title}
                </h4>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  {pendingConfirm.description}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                className="flex-1 min-h-[44px] rounded-full bg-white text-ink text-xs font-semibold border border-black/10 hover:bg-black/5"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executePendingConfirmation}
                className="flex-1 min-h-[44px] rounded-full bg-ink text-white text-xs font-bold hover:bg-ink/90"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="mt-4 rounded-2xl bg-orange-50 px-4 py-3 text-xs font-medium text-expense"
          >
            {errorMsg}
          </div>
        )}

        {(successMsg || syncStatusMessage) && (
          <div className="mt-4 rounded-2xl bg-mint-canvas px-4 py-3 text-xs font-medium text-income flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{successMsg || syncStatusMessage}</span>
          </div>
        )}

        {/* Auth Section */}
        <div className="mt-4 rounded-2xl bg-mint-soft p-4">
          {!user || !accessToken ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-bold text-ink">
                  {user
                    ? 'Sesi akses Google Sheets perlu diperbarui'
                    : 'Hubungkan akun Google Anda'}
                </p>
                <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                  Masuk dengan Google agar transaksi baru dapat langsung
                  ditambahkan melanjutkan baris laporan di Google Sheets Anda.
                </p>
              </div>
              <GoogleSignInButton
                onClick={handleAuthAction}
                disabled={busyAction === 'auth'}
                label={
                  busyAction === 'auth'
                    ? 'Menghubungkan...'
                    : 'Sign in with Google'
                }
              />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-ink-muted">Akun Google terhubung</p>
                <p className="text-sm font-bold text-ink truncate">
                  {user.displayName || user.email}
                </p>
                {user.email && (
                  <p className="text-xs text-ink-muted truncate">{user.email}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="min-h-[44px] px-3.5 rounded-full bg-white text-ink text-xs font-semibold inline-flex items-center gap-1.5 border border-black/10 hover:bg-black/5 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>

        {/* Connected Spreadsheet Section */}
        {user && accessToken && (
          <div className="mt-4 space-y-4">
            {connection ? (
              <div className="rounded-2xl border border-black/10 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-income">
                      Mode Lanjutan Aktif (Isi Lama Tetap Utuh)
                    </span>
                    <h4 className="font-display text-sm font-bold text-ink truncate">
                      {connection.spreadsheetTitle}
                    </h4>
                    {connection.lastSyncedAt && (
                      <p className="text-xs text-ink-muted tabular-nums">
                        Sinkron terakhir: {connection.lastSyncedAt}
                      </p>
                    )}
                  </div>
                  <a
                    href={connection.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-[44px] px-3.5 rounded-full bg-lime-accent text-ink text-xs font-bold inline-flex items-center gap-1.5 hover:bg-lime-deep shrink-0"
                  >
                    <span>Buka Sheet</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>

                {/* Sheet Tab Selector */}
                <div>
                  <label
                    htmlFor="sheet-tab-select"
                    className="block text-xs font-semibold text-ink mb-1"
                  >
                    Tab Sheet tujuan
                  </label>
                  <select
                    id="sheet-tab-select"
                    value={connection.sheetTitle}
                    onChange={(e) => {
                      const found = connection.availableSheets.find(
                        (s) => s.title === e.target.value
                      );
                      onUpdateConnection({
                        ...connection,
                        sheetTitle: e.target.value,
                        sheetId: found?.sheetId ?? connection.sheetId,
                      });
                    }}
                    className="w-full min-h-[44px] rounded-xl border border-black/15 px-3 text-sm bg-white text-ink"
                  >
                    {connection.availableSheets.map((tab) => (
                      <option key={tab.title} value={tab.title}>
                        {tab.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto-sync toggle */}
                <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
                  <span className="text-xs font-medium text-ink">
                    Otomatis tambahkan transaksi baru melanjutkan baris terakhir
                  </span>
                  <input
                    type="checkbox"
                    checked={connection.autoSync}
                    onChange={(e) =>
                      onUpdateConnection({
                        ...connection,
                        autoSync: e.target.checked,
                      })
                    }
                    className="w-5 h-5 accent-ink rounded cursor-pointer"
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    disabled={!!busyAction}
                    onClick={handlePrepareAppendNew}
                    className="min-h-[44px] px-3.5 rounded-full bg-ink text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-ink/90 disabled:opacity-60"
                  >
                    <Send className="w-4 h-4 text-lime-accent" aria-hidden="true" />
                    <span>
                      {busyAction === 'check' || busyAction === 'sync'
                        ? 'Memeriksa...'
                        : 'Kirim Transaksi Baru'}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={!!busyAction}
                    onClick={handlePrepareImportFromSheet}
                    className="min-h-[44px] px-3.5 rounded-full bg-mint-soft text-ink text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-lime-accent/50 disabled:opacity-60"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {busyAction === 'read'
                        ? 'Membaca...'
                        : 'Muat Data dari Sheet'}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onUpdateConnection(null)}
                  className="text-xs text-ink-muted underline underline-offset-4 hover:text-ink pt-1"
                >
                  Ganti atau putuskan tautan spreadsheet
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <form
                  onSubmit={handleConnectExisting}
                  className="rounded-2xl border border-black/10 bg-mint-soft/50 p-4 space-y-2.5"
                >
                  <label
                    htmlFor="sheet-url-input"
                    className="block text-xs font-bold text-ink"
                  >
                    Hubungkan Spreadsheet Laporan yang Sudah Ada
                  </label>
                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    Isi laporan lama tidak akan diubah. Transaksi baru akan
                    langsung disisipkan melanjutkan baris transaksi terakhir.
                  </p>
                  <div className="flex gap-2">
                    <input
                      id="sheet-url-input"
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="flex-1 min-h-[44px] rounded-xl border border-black/15 bg-white px-3 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ink"
                    />
                    <button
                      type="submit"
                      disabled={!!busyAction}
                      className="min-h-[44px] px-4 rounded-xl bg-ink text-white text-xs font-semibold hover:bg-ink/90 disabled:opacity-60 whitespace-nowrap"
                    >
                      {busyAction === 'connect' ? 'Memeriksa...' : 'Hubungkan'}
                    </button>
                  </div>
                </form>

                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-black/10" />
                  <span className="mx-3 text-xs text-ink-muted">
                    atau jika belum punya spreadsheet
                  </span>
                  <div className="flex-grow border-t border-black/10" />
                </div>

                <button
                  type="button"
                  disabled={!!busyAction}
                  onClick={handleCreateNewSheet}
                  className="w-full min-h-[46px] px-4 rounded-2xl bg-lime-accent text-ink text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-lime-deep disabled:opacity-60 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {busyAction === 'create'
                      ? 'Membuat Google Sheet...'
                      : `Buat Google Sheet Baru (${transactions.length} data)`}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* CSV Direct Import Section */}
        <div className="mt-4 pt-4 border-t border-black/8">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full min-h-[44px] px-4 rounded-2xl bg-mint-soft hover:bg-lime-accent/40 text-ink text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <FolderUp className="w-4 h-4" aria-hidden="true" />
            <span>Impor File CSV Laporan Keuangan DDV (.csv)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
