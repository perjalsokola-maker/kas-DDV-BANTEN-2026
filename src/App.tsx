import type { User } from 'firebase/auth';
import {
  BarChart3,
  Bell,
  FileSpreadsheet,
  Home,
  MoreVertical,
  Plus,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AddTransactionModal } from './components/AddTransactionModal';
import { BalanceCard } from './components/BalanceCard';
import { BudgetModal } from './components/BudgetModal';
import {
  GoogleSheetsModal,
  type SheetConnectionConfig,
} from './components/GoogleSheetsModal';
import { KegiatanView } from './components/KegiatanView';
import { MoreMenuModal } from './components/MoreMenuModal';
import { NotificationsModal } from './components/NotificationsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { QuickActions } from './components/QuickActions';
import { ReimburseModal } from './components/ReimburseModal';
import { StatsView } from './components/StatsView';
import { TransactionDetailSheet } from './components/TransactionDetailSheet';
import { TransactionList } from './components/TransactionList';
import {
  DEFAULT_BUDGET_CONFIG,
  MONTH_NAMES,
  formatRp,
  getInitialRawTransactions,
  hydrateTransactions,
} from './data/initialTransactions';
import {
  clearAccessToken,
  googleSignIn,
  googleSignOut,
  initGoogleAuth,
} from './lib/googleAuth';
import {
  appendContinuingTransactionsToSheet,
  fetchSpreadsheetMetadata,
} from './lib/googleSheets';
import type {
  AppView,
  BudgetConfig,
  CategoryCode,
  RawTransactionInput,
  Transaction,
} from './types/kas';

const STORAGE_TX_KEY = 'kas_ddv_banten_2026_tx_v1';
const STORAGE_BUDGET_KEY = 'kas_ddv_banten_2026_budget_v1';
const STORAGE_SHEET_KEY = 'kas_ddv_banten_2026_sheet_cfg_v1';

function loadInitialTransactions(): RawTransactionInput[] {
  try {
    const saved = localStorage.getItem(STORAGE_TX_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fallback to embedded initial dataset
  }
  return getInitialRawTransactions();
}

function loadInitialBudget(): BudgetConfig {
  try {
    const saved = localStorage.getItem(STORAGE_BUDGET_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        typeof parsed?.monthlyLimit === 'number' &&
        typeof parsed?.reserveTarget === 'number'
      ) {
        return parsed;
      }
    }
  } catch {
    // Fallback to default budget
  }
  return DEFAULT_BUDGET_CONFIG;
}

function loadSheetConnection(): SheetConnectionConfig | null {
  try {
    const saved = localStorage.getItem(STORAGE_SHEET_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.spreadsheetId && parsed?.sheetTitle) {
        return {
          ...parsed,
          sheetId: typeof parsed.sheetId === 'number' ? parsed.sheetId : 0,
          availableSheets: Array.isArray(parsed.availableSheets)
            ? parsed.availableSheets.map((s: string | { sheetId: number; title: string }) =>
                typeof s === 'string' ? { sheetId: 0, title: s } : s
              )
            : [{ sheetId: 0, title: parsed.sheetTitle }],
        } as SheetConnectionConfig;
      }
    }
  } catch {
    // Ignore storage parse failure
  }
  return null;
}

export default function App() {
  const [rawTransactions, setRawTransactions] = useState<RawTransactionInput[]>(
    loadInitialTransactions
  );
  const [budget, setBudget] = useState<BudgetConfig>(loadInitialBudget);
  const [sheetConnection, setSheetConnection] =
    useState<SheetConnectionConfig | null>(loadSheetConnection);

  // Google Auth state (accessToken is strictly kept in memory, never localStorage)
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const [view, setView] = useState<AppView>('beranda');
  const [selectedCategory, setSelectedCategory] = useState<CategoryCode | ''>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'settled'>(
    'all'
  );
  const [programFilter, setProgramFilter] = useState<string>('');

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isReimburseOpen, setIsReimburseOpen] = useState(false);
  const [reimburseSourceFocus, setReimburseSourceFocus] = useState<
    string | undefined
  >(undefined);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSheetsOpen, setIsSheetsOpen] = useState(false);

  useEffect(() => {
    const unsub = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
      },
      (user) => {
        setGoogleUser(user);
        setAccessToken(null);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TX_KEY, JSON.stringify(rawTransactions));
    } catch {
      // Ignore storage quota errors
    }
  }, [rawTransactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BUDGET_KEY, JSON.stringify(budget));
    } catch {
      // Ignore storage quota errors
    }
  }, [budget]);

  useEffect(() => {
    try {
      if (sheetConnection) {
        localStorage.setItem(STORAGE_SHEET_KEY, JSON.stringify(sheetConnection));
      } else {
        localStorage.removeItem(STORAGE_SHEET_KEY);
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [sheetConnection]);

  useEffect(() => {
    if (!syncNotice) return;
    const timer = setTimeout(() => setSyncNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [syncNotice]);

  const transactions = useMemo(
    () => hydrateTransactions(rawTransactions),
    [rawTransactions]
  );

  const {
    balance,
    totalIncome,
    totalExpense,
    pendingCount,
    pendingTotal,
    latestMonth,
    latestMonthExpense,
  } = useMemo(() => {
    const tIncome = transactions.reduce((acc, t) => acc + t.income, 0);
    const tExpense = transactions.reduce((acc, t) => acc + t.expense, 0);
    const bal =
      transactions.length > 0
        ? transactions[transactions.length - 1].balanceAfter
        : 0;
    const pend = transactions.filter((t) => t.status?.kind === 'p');
    const pendTotal = pend.reduce((acc, t) => acc + t.expense, 0);
    let maxYear = 2026;
    let maxMonth = 10;
    transactions.forEach((t) => {
      if (t.year * 12 + t.month > maxYear * 12 + maxMonth) {
        maxYear = t.year;
        maxMonth = t.month;
      }
    });
    const maxMonthExp = transactions
      .filter((t) => t.year === maxYear && t.month === maxMonth)
      .reduce((acc, t) => acc + t.expense, 0);

    return {
      balance: bal,
      totalIncome: tIncome,
      totalExpense: tExpense,
      pendingCount: pend.length,
      pendingTotal: pendTotal,
      latestMonth: maxMonth,
      latestMonthExpense: maxMonthExp,
    };
  }, [transactions]);

  const autoAppendToSheet = async (
    nextRawList: RawTransactionInput[],
    addedCount: number
  ) => {
    if (!sheetConnection?.autoSync) return;
    if (!accessToken) {
      setSyncNotice(
        'Transaksi tersimpan lokal. Masuk dengan Google untuk melanjutkan baris ke Google Sheets.'
      );
      return;
    }

    const hydrated = hydrateTransactions(nextRawList);
    const newlyAdded = hydrated.slice(-addedCount);

    try {
      let targetSheetId = sheetConnection.sheetId;
      if (
        !sheetConnection.availableSheets.some(
          (s) => s.title === sheetConnection.sheetTitle && typeof s.sheetId === 'number'
        )
      ) {
        const meta = await fetchSpreadsheetMetadata(
          accessToken,
          sheetConnection.spreadsheetId
        );
        const found = meta.sheets.find((s) => s.title === sheetConnection.sheetTitle);
        if (found) targetSheetId = found.sheetId;
      }

      await appendContinuingTransactionsToSheet(
        accessToken,
        sheetConnection.spreadsheetId,
        targetSheetId,
        sheetConnection.sheetTitle,
        newlyAdded
      );
      const timeLabel = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setSheetConnection((prev) =>
        prev ? { ...prev, sheetId: targetSheetId, lastSyncedAt: timeLabel } : prev
      );
      setSyncNotice(
        `Otomatis ditambahkan melanjutkan baris terakhir di Google Sheets (${timeLabel}).`
      );
    } catch (err) {
      if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
        clearAccessToken();
        setAccessToken(null);
        setSyncNotice(
          'Sesi Google berakhir. Buka menu Google Sheets untuk masuk ulang.'
        );
      } else {
        setSyncNotice(
          'Tersimpan lokal, namun gagal menambahkan otomatis ke Google Sheets.'
        );
      }
    }
  };

  const handleAddTransaction = (newTx: RawTransactionInput) => {
    const nextList = [...rawTransactions, newTx];
    setRawTransactions(nextList);
    void autoAppendToSheet(nextList, 1);
  };

  const handleSettleSingle = (txId: string) => {
    const target = rawTransactions.find((t) => t.id === txId);
    if (!target) return;

    const updated = rawTransactions.map((t) =>
      t.id === txId ? { ...t, statusCode: 's' } : t
    );

    let added = 0;
    if (target.expense > 0) {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = now.getMonth() + 1;
      const yyyy = Math.min(2027, Math.max(2026, now.getFullYear()));
      updated.push({
        id: `tx-reimburse-${Date.now()}`,
        day: dd,
        month: mm,
        year: yyyy,
        title: `Reimburse cair: ${target.title}`,
        income: target.expense,
        expense: 0,
        statusCode: '_',
        category: 'M',
        isUserCreated: true,
      });
      added = 1;
    }

    setRawTransactions(updated);
    if (added > 0) {
      void autoAppendToSheet(updated, added);
    }
  };

  const handleSettleSourceBatch = (sourceName: string) => {
    const matching = transactions.filter(
      (t) =>
        t.status?.kind === 'p' && (t.status.sourceName || 'Umum') === sourceName
    );
    if (matching.length === 0) return;
    const totalAmount = matching.reduce((acc, t) => acc + t.expense, 0);
    const matchingIds = new Set(matching.map((m) => m.id));

    const updated = rawTransactions.map((t) =>
      matchingIds.has(t.id) ? { ...t, statusCode: 's' } : t
    );

    let added = 0;
    if (totalAmount > 0) {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = now.getMonth() + 1;
      const yyyy = Math.min(2027, Math.max(2026, now.getFullYear()));
      updated.push({
        id: `tx-reimburse-batch-${Date.now()}`,
        day: dd,
        month: mm,
        year: yyyy,
        title: `Pencairan reimburse ${sourceName} (${matching.length} item)`,
        income: totalAmount,
        expense: 0,
        statusCode: '_',
        category: 'M',
        isUserCreated: true,
      });
      added = 1;
    }

    setRawTransactions(updated);
    if (added > 0) {
      void autoAppendToSheet(updated, added);
    }
  };

  const handleDeleteTransaction = (txId: string) => {
    setRawTransactions((prev) => prev.filter((t) => t.id !== txId));
  };

  const handleResetData = () => {
    setRawTransactions(getInitialRawTransactions());
    setBudget(DEFAULT_BUDGET_CONFIG);
    setSelectedCategory('');
    setStatusFilter('all');
    setProgramFilter('');
  };

  const handleFilterPending = () => {
    setView('beranda');
    setSelectedCategory('');
    setProgramFilter('');
    setStatusFilter('pending');
  };

  const handleSelectProgram = (program: string) => {
    setProgramFilter(program);
    setSelectedCategory('');
    setStatusFilter('all');
    setView('beranda');
  };

  const handleGoogleSignIn = async () => {
    const res = await googleSignIn();
    if (res) {
      setGoogleUser(res.user);
      setAccessToken(res.accessToken);
    }
  };

  const handleGoogleSignOut = async () => {
    await googleSignOut();
    setGoogleUser(null);
    setAccessToken(null);
  };

  const handleImportTransactions = (
    items: RawTransactionInput[],
    sourceLabel: string
  ) => {
    setRawTransactions(items);
    setSelectedCategory('');
    setStatusFilter('all');
    setProgramFilter('');
    setSyncNotice(`Berhasil memuat ${items.length} transaksi dari ${sourceLabel}.`);
  };

  const alertCount =
    (pendingCount > 0 ? 1 : 0) +
    (budget.monthlyLimit > 0 && latestMonthExpense > budget.monthlyLimit ? 1 : 0);

  const isSheetActive = Boolean(sheetConnection && accessToken);

  return (
    <div className="min-h-screen bg-mint-canvas text-ink pb-24 lg:pb-12">
      {/* Desktop Top Bar Contract (3 zones) */}
      <header className="hidden lg:block sticky top-0 z-30 bg-mint-canvas/90 backdrop-blur-md border-b border-black/8">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#beranda"
            onClick={(e) => {
              e.preventDefault();
              setView('beranda');
            }}
            className="inline-flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight text-ink whitespace-nowrap shrink-0"
          >
            <img
              src="/assets/aistudio/Logo_Sosmed_DDV_91a73047.jpg"
              alt="Logo DDVolunteer"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover bg-white border border-black/10 shrink-0"
            />
            <span>Kas DDV Banten 2026</span>
          </a>

          <nav
            className="flex items-center gap-6 text-sm font-medium"
            aria-label="Navigasi utama"
          >
            <button
              type="button"
              onClick={() => setView('beranda')}
              className={`min-h-[44px] px-1 whitespace-nowrap shrink-0 transition-colors ${
                view === 'beranda'
                  ? 'text-ink font-bold underline decoration-2 underline-offset-8'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Beranda
            </button>
            <button
              type="button"
              onClick={() => setView('statistik')}
              className={`min-h-[44px] px-1 whitespace-nowrap shrink-0 transition-colors ${
                view === 'statistik'
                  ? 'text-ink font-bold underline decoration-2 underline-offset-8'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Statistik
            </button>
            <button
              type="button"
              onClick={() => setView('kegiatan')}
              className={`min-h-[44px] px-1 whitespace-nowrap shrink-0 transition-colors ${
                view === 'kegiatan'
                  ? 'text-ink font-bold underline decoration-2 underline-offset-8'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Kegiatan
            </button>
            <button
              type="button"
              onClick={() => {
                setReimburseSourceFocus(undefined);
                setIsReimburseOpen(true);
              }}
              className="min-h-[44px] px-1 text-ink-muted hover:text-ink whitespace-nowrap shrink-0 transition-colors"
            >
              Reimburse
            </button>
            <button
              type="button"
              onClick={() => setIsSheetsOpen(true)}
              className="min-h-[44px] px-1 text-ink-muted hover:text-ink whitespace-nowrap shrink-0 transition-colors"
            >
              Google Sheets
            </button>
          </nav>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="min-h-[44px] px-5 rounded-full bg-ink text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-ink/90 whitespace-nowrap shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4 text-lime-accent" aria-hidden="true" />
            <span>Catat Transaksi</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {/* Top Greeting Bar */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <img
              src="/assets/aistudio/Logo_Sosmed_DDV_91a73047.jpg"
              alt="Logo DDVolunteer"
              referrerPolicy="no-referrer"
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover bg-white border border-black/10 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs leading-snug text-ink-muted">
                Penanggung jawab: Pauzan
              </p>
              <p className="font-display text-[13px] sm:text-base leading-tight font-bold text-ink">
                Selamat datang kembali
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsSheetsOpen(true)}
              className={`min-h-[40px] sm:min-h-[44px] px-2.5 sm:px-3.5 rounded-full text-[11px] sm:text-xs font-semibold inline-flex items-center gap-1 sm:gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                isSheetActive
                  ? 'bg-lime-accent text-ink hover:bg-lime-deep'
                  : 'bg-white text-ink hover:bg-white/80'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">
                {isSheetActive ? 'Sheets Aktif' : 'Google Sheets'}
              </span>
              <span className="sm:hidden">Sheets</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNotifOpen(true)}
              aria-label="Notifikasi dan pengingat kas"
              className="relative min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] rounded-full bg-white text-ink grid place-items-center hover:bg-white/80 transition-colors shrink-0"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              {alertCount > 0 && (
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-expense text-white text-[10px] font-bold grid place-items-center tabular-nums">
                  {alertCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Non-intrusive Sync Toast Banner */}
        {syncNotice && (
          <div className="mb-4 rounded-2xl bg-ink text-white px-4 py-3 text-xs flex items-center justify-between gap-3">
            <span>{syncNotice}</span>
            <button
              type="button"
              onClick={() => setIsSheetsOpen(true)}
              className="text-lime-accent font-bold underline underline-offset-4 whitespace-nowrap shrink-0 min-h-[44px] px-1"
            >
              Lihat Sheets
            </button>
          </div>
        )}

        {view === 'beranda' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column */}
            <div className="lg:col-span-5 space-y-5">
              <BalanceCard
                balance={balance}
                totalIncome={totalIncome}
                totalExpense={totalExpense}
                pendingCount={pendingCount}
                pendingTotal={pendingTotal}
                latestMonthExpense={latestMonthExpense}
                latestMonthName={MONTH_NAMES[latestMonth]}
                budget={budget}
                onOpenBudget={() => setIsBudgetOpen(true)}
                onFilterPending={handleFilterPending}
              />

              <QuickActions
                onAddTransaction={() => setIsAddOpen(true)}
                onOpenReimburse={() => {
                  setReimburseSourceFocus(undefined);
                  setIsReimburseOpen(true);
                }}
                onOpenKegiatan={() => setView('kegiatan')}
                onOpenMore={() => setIsMoreOpen(true)}
                pendingCount={pendingCount}
              />

              {/* Desktop quick glance card */}
              <div className="hidden lg:block bg-white rounded-[26px] p-5 border border-black/5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-bold text-ink">
                      Ringkasan Reimburse
                    </h3>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {pendingCount > 0
                        ? `${pendingCount} transaksi menunggu pencairan`
                        : 'Seluruh reimburse telah cair'}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-base tabular-nums text-expense">
                    {formatRp(pendingTotal)}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setView('statistik')}
                    className="flex-1 min-h-[44px] rounded-full bg-lime-accent text-ink text-xs font-bold hover:bg-lime-deep transition-colors"
                  >
                    Buka Statistik Lengkap
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSheetsOpen(true)}
                    className="flex-1 min-h-[44px] rounded-full bg-mint-soft text-ink text-xs font-semibold hover:bg-black/5 transition-colors"
                  >
                    {isSheetActive ? 'Sinkron Google Sheets' : 'Hubungkan Sheets'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Activity Ledger */}
            <div className="lg:col-span-7">
              <TransactionList
                transactions={transactions}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                programFilter={programFilter}
                onClearProgramFilter={() => setProgramFilter('')}
                onSelectTransaction={setSelectedTx}
                onOpenAdd={() => setIsAddOpen(true)}
              />
            </div>
          </div>
        )}

        {view === 'statistik' && (
          <StatsView
            transactions={transactions}
            balance={balance}
            onBack={() => setView('beranda')}
            onOpenReimburseSource={(src) => {
              setReimburseSourceFocus(src);
              setIsReimburseOpen(true);
            }}
          />
        )}

        {view === 'kegiatan' && (
          <KegiatanView
            transactions={transactions}
            onSelectProgram={handleSelectProgram}
            onBack={() => setView('beranda')}
          />
        )}

        <footer className="mt-10 pt-5 border-t border-black/8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/Logo_Sosmed_DDV_91a73047.jpg"
              alt="Logo DDVolunteer"
              referrerPolicy="no-referrer"
              className="w-6 h-6 rounded-full object-cover bg-white border border-black/10 shrink-0"
            />
            <span>Dompet Dhuafa Volunteer Banten</span>
          </div>
          <img
            src="/assets/aistudio/web_ddv_hitam_09a366b7.png"
            alt="volunteer.dompetdhuafa.org"
            referrerPolicy="no-referrer"
            className="h-3.5 w-auto object-contain opacity-75"
          />
        </footer>
      </main>

      {/* Mobile Floating Pill Bottom Navigation (< lg) */}
      <nav
        aria-label="Navigasi bawah"
        className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-ink rounded-full p-1.5 flex items-center gap-1.5 shadow-xl"
      >
        <button
          type="button"
          onClick={() => setView('beranda')}
          aria-label="Beranda"
          aria-current={view === 'beranda' ? 'page' : undefined}
          className={`w-12 h-12 rounded-full grid place-items-center transition-colors ${
            view === 'beranda'
              ? 'bg-white/15 text-lime-accent'
              : 'text-white/80 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => setView('statistik')}
          aria-label="Statistik"
          aria-current={view === 'statistik' ? 'page' : undefined}
          className={`w-12 h-12 rounded-full grid place-items-center transition-colors ${
            view === 'statistik'
              ? 'bg-white/15 text-lime-accent'
              : 'text-white/80 hover:text-white'
          }`}
        >
          <BarChart3 className="w-5 h-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          aria-label="Catat transaksi baru"
          className="w-12 h-12 rounded-full bg-lime-accent text-ink grid place-items-center hover:bg-lime-deep active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          aria-label="Menu lainnya"
          className="w-12 h-12 rounded-full text-white/80 hover:text-white grid place-items-center transition-colors"
        >
          <MoreVertical className="w-5 h-5" aria-hidden="true" />
        </button>
      </nav>

      {/* Modals & Sheets */}
      <TransactionDetailSheet
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onMarkSettled={handleSettleSingle}
        onDeleteTransaction={handleDeleteTransaction}
      />

      <AddTransactionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddTransaction}
      />

      <ReimburseModal
        isOpen={isReimburseOpen}
        initialSourceFilter={reimburseSourceFocus}
        transactions={transactions}
        onClose={() => setIsReimburseOpen(false)}
        onSettleSingle={handleSettleSingle}
        onSettleSourceBatch={handleSettleSourceBatch}
      />

      {isBudgetOpen && (
        <BudgetModal
          isOpen={isBudgetOpen}
          budget={budget}
          currentBalance={balance}
          latestMonthExpense={latestMonthExpense}
          latestMonthName={MONTH_NAMES[latestMonth]}
          pendingCount={pendingCount}
          pendingTotal={pendingTotal}
          onClose={() => setIsBudgetOpen(false)}
          onSave={setBudget}
          onFilterPending={handleFilterPending}
        />
      )}

      <NotificationsModal
        isOpen={isNotifOpen}
        pendingCount={pendingCount}
        pendingTotal={pendingTotal}
        balance={balance}
        reserveTarget={budget.reserveTarget}
        latestMonthExpense={latestMonthExpense}
        monthlyLimit={budget.monthlyLimit}
        latestMonthName={MONTH_NAMES[latestMonth]}
        onClose={() => setIsNotifOpen(false)}
        onOpenReimburse={() => {
          setReimburseSourceFocus(undefined);
          setIsReimburseOpen(true);
        }}
      />

      {isMoreOpen && (
        <MoreMenuModal
          isOpen={isMoreOpen}
          transactions={transactions}
          balance={balance}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          pendingTotal={pendingTotal}
          onClose={() => setIsMoreOpen(false)}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          onOpenGoogleSheets={() => setIsSheetsOpen(true)}
          onResetData={handleResetData}
        />
      )}

      {isSheetsOpen && (
        <GoogleSheetsModal
          isOpen={isSheetsOpen}
          user={googleUser}
          accessToken={accessToken}
          transactions={transactions}
          connection={sheetConnection}
          syncStatusMessage={syncNotice}
          onClose={() => setIsSheetsOpen(false)}
          onSignIn={handleGoogleSignIn}
          onSignOut={handleGoogleSignOut}
          onUpdateConnection={setSheetConnection}
          onImportTransactions={handleImportTransactions}
          onTokenExpired={() => {
            clearAccessToken();
            setAccessToken(null);
          }}
        />
      )}

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onDismiss={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
}
