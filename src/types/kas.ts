export type CategoryCode = 'K' | 'A' | 'T' | 'F' | 'L' | 'P' | 'M';

export type ReimburseSourceCode = 'u' | 'm' | 'd' | 'c';

export type ReimburseStatusKind = 'p' | 's' | 'r';

export interface ReimburseStatus {
  kind: ReimburseStatusKind;
  label: string;
  sourceCode?: ReimburseSourceCode;
  sourceName?: string;
}

export interface RawTransactionInput {
  id: string;
  day: string;
  month: number;
  year: number;
  title: string;
  income: number;
  expense: number;
  statusCode: string;
  category: CategoryCode;
  isUserCreated?: boolean;
}

export interface Transaction extends RawTransactionInput {
  balanceAfter: number;
  status: ReimburseStatus | null;
  program: string;
}

export interface BudgetConfig {
  monthlyLimit: number;
  reserveTarget: number;
}

export type AppView = 'beranda' | 'statistik' | 'kegiatan';
