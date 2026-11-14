import { CATEGORY_LABELS } from '../data/initialTransactions';
import { parseRowsToTransactions } from './csvParser';
import type { Transaction } from '../types/kas';

export interface SheetTabInfo {
  sheetId: number;
  title: string;
}

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheets: SheetTabInfo[];
}

export interface SheetStructureAnalysis {
  colNo: number;
  colTgl: number;
  colTitle: number;
  colCategory: number;
  colProgram: number;
  colIncome: number;
  colExpense: number;
  colBalance: number;
  colStatus: number;
  maxColIndex: number;
  lastTransactionRowIdx: number;
  totalRowIdx: number;
  existingTxCount: number;
  lastTxNumber: number;
  existingSignatures: Set<string>;
}

export function extractSpreadsheetId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) return urlMatch[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) return trimmed;
  return null;
}

function formatDateSlash(tx: Transaction): string {
  const mm = String(tx.month).padStart(2, '0');
  const yy = String(tx.year).slice(-2);
  return `${tx.day}/${mm}/${yy}`;
}

function makeTxSignature(
  day: string,
  month: number,
  title: string,
  income: number,
  expense: number
): string {
  const cleanTitle = title.trim().toLowerCase().replace(/\s+/g, ' ');
  return `${day}|${month}|${cleanTitle}|${income}|${expense}`;
}

export function getTransactionSignature(tx: Transaction): string {
  return makeTxSignature(tx.day, tx.month, tx.title, tx.income, tx.expense);
}

function colIndexToLetter(index: number): string {
  let n = index;
  let letter = '';
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

async function handleApiResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Permintaan gagal (${res.status})`;
    try {
      const errBody = await res.json();
      if (errBody?.error?.message) {
        message = errBody.error.message;
      }
    } catch {
      // ignore json parse failure
    }
    if (res.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function fetchSpreadsheetMetadata(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetMetadata> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}?fields=spreadsheetId,spreadsheetUrl,properties.title,sheets.properties(sheetId,title)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const data = await handleApiResponse<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    properties: { title: string };
    sheets: Array<{ properties: { sheetId: number; title: string } }>;
  }>(res);

  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
    title: data.properties?.title || 'Spreadsheet Tanpa Judul',
    sheets: (data.sheets || []).map((s) => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title,
    })),
  };
}

export async function readSheetRows(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string
): Promise<string[][]> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(sheetTitle)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const data = await handleApiResponse<{ values?: string[][] }>(res);
  return data.values || [];
}

export function analyzeSheetRows(rows: string[][]): SheetStructureAnalysis {
  let headerRowIdx = -1;
  let colNo = 0;
  let colTgl = 1;
  let colTitle = 2;
  let colCategory = -1;
  let colProgram = -1;
  let colIncome = 7;
  let colExpense = 8;
  let colBalance = 9;
  let colStatus = 10;

  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const upper = rows[i].map((c) => String(c || '').toUpperCase().trim());
    const idxTitle = upper.findIndex(
      (c) => c.includes('RINCIAN') || c.includes('KETERANGAN TRANSAKSI')
    );
    const idxInc = upper.findIndex((c) => c === 'PEMASUKAN');
    const idxExp = upper.findIndex((c) => c === 'PENGELUARAN');

    if (idxTitle !== -1 && (idxInc !== -1 || idxExp !== -1)) {
      headerRowIdx = i;
      const idxNo = upper.findIndex((c) => c === 'NO.' || c === 'NO');
      colNo = idxNo !== -1 ? idxNo : 0;
      const idxTgl = upper.findIndex((c) => c === 'TGL' || c === 'TANGGAL');
      colTgl = idxTgl !== -1 ? idxTgl : 1;
      colTitle = idxTitle;
      colCategory = upper.findIndex((c) => c === 'KATEGORI');
      colProgram = upper.findIndex((c) => c === 'KEGIATAN' || c === 'PROGRAM');
      colIncome = idxInc !== -1 ? idxInc : 7;
      colExpense = idxExp !== -1 ? idxExp : 8;
      const idxBal = upper.findIndex(
        (c) => c.includes('DANA TERSEDIA') || c.includes('SALDO')
      );
      colBalance = idxBal !== -1 ? idxBal : colExpense + 1;
      const idxKet = upper.findIndex(
        (c) => c === 'KETERANGAN' || c === 'STATUS'
      );
      colStatus = idxKet !== -1 ? idxKet : colBalance + 1;
      break;
    }
  }

  let totalRowIdx = -1;
  let lastTransactionRowIdx = headerRowIdx !== -1 ? headerRowIdx : -1;
  let lastTxNumber = 0;
  let existingTxCount = 0;

  const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i] || [];
    const joined = row.join(' ').toUpperCase();
    if (joined.includes('TOTAL')) {
      totalRowIdx = i;
      break;
    }

    const tglCell = String(row[colTgl] || '').trim();
    const titleCell = String(row[colTitle] || '').trim();
    const incCell = String(row[colIncome] || '').trim();
    const expCell = String(row[colExpense] || '').trim();

    if (tglCell && titleCell && (incCell || expCell)) {
      lastTransactionRowIdx = i;
      existingTxCount += 1;
      const noVal = Number(String(row[colNo] || '').replace(/\D/g, ''));
      if (noVal > lastTxNumber) {
        lastTxNumber = noVal;
      }
    }
  }

  const parsedExisting = parseRowsToTransactions(rows);
  const existingSignatures = new Set(
    parsedExisting.map((tx) =>
      makeTxSignature(tx.day, tx.month, tx.title, tx.income, tx.expense)
    )
  );

  const maxColIndex = Math.max(
    colNo,
    colTgl,
    colTitle,
    colCategory,
    colProgram,
    colIncome,
    colExpense,
    colBalance,
    colStatus
  );

  return {
    colNo,
    colTgl,
    colTitle,
    colCategory,
    colProgram,
    colIncome,
    colExpense,
    colBalance,
    colStatus,
    maxColIndex,
    lastTransactionRowIdx,
    totalRowIdx,
    existingTxCount,
    lastTxNumber,
    existingSignatures,
  };
}

function mapTransactionToExistingColumns(
  tx: Transaction,
  rowNumber: number,
  structure: SheetStructureAnalysis
): (string | number)[] {
  const row: (string | number)[] = Array(structure.maxColIndex + 1).fill('');
  if (structure.colNo >= 0) row[structure.colNo] = rowNumber;
  if (structure.colTgl >= 0) row[structure.colTgl] = formatDateSlash(tx);
  if (structure.colTitle >= 0) row[structure.colTitle] = tx.title;
  if (structure.colCategory >= 0) {
    row[structure.colCategory] = CATEGORY_LABELS[tx.category];
  }
  if (structure.colProgram >= 0) row[structure.colProgram] = tx.program;
  if (structure.colIncome >= 0) {
    row[structure.colIncome] = tx.income > 0 ? tx.income : '';
  }
  if (structure.colExpense >= 0) {
    row[structure.colExpense] = tx.expense > 0 ? tx.expense : '';
  }
  if (structure.colBalance >= 0) row[structure.colBalance] = tx.balanceAfter;
  if (structure.colStatus >= 0) {
    row[structure.colStatus] = tx.status ? tx.status.label : '';
  }
  return row;
}

/**
 * Inserts ONLY new transactions right after the last existing transaction row,
 * preserving all existing rows, headers, TOTAL formulas/values, and signatures intact.
 */
export async function appendContinuingTransactionsToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetId: number,
  sheetTitle: string,
  newTransactions: Transaction[]
): Promise<{ addedCount: number }> {
  if (newTransactions.length === 0) return { addedCount: 0 };

  const currentRows = await readSheetRows(accessToken, spreadsheetId, sheetTitle);
  const structure = analyzeSheetRows(currentRows);

  const baseNumber =
    structure.lastTxNumber > 0
      ? structure.lastTxNumber
      : structure.existingTxCount;

  const formattedRows = newTransactions.map((tx, idx) =>
    mapTransactionToExistingColumns(tx, baseNumber + idx + 1, structure)
  );

  // Determine exact 0-based row index to insert right after the last transaction row
  const insertAtZeroBased =
    structure.lastTransactionRowIdx >= 0
      ? structure.lastTransactionRowIdx + 1
      : currentRows.length;

  const hasContentBelow =
    structure.totalRowIdx !== -1 || insertAtZeroBased < currentRows.length;

  if (hasContentBelow) {
    // Shift footer / TOTAL / signature rows down cleanly without touching existing cells
    const batchRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        spreadsheetId
      )}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertDimension: {
                range: {
                  sheetId,
                  dimension: 'ROWS',
                  startIndex: insertAtZeroBased,
                  endIndex: insertAtZeroBased + formattedRows.length,
                },
                inheritFromBefore: insertAtZeroBased > 0,
              },
            },
          ],
        }),
      }
    );
    await handleApiResponse(batchRes);
  }

  const startRowOneBased = insertAtZeroBased + 1;
  const endRowOneBased = startRowOneBased + formattedRows.length - 1;
  const endColLetter = colIndexToLetter(structure.maxColIndex);
  const targetRange = `${sheetTitle}!A${startRowOneBased}:${endColLetter}${endRowOneBased}`;

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(targetRange)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: targetRange,
        majorDimension: 'ROWS',
        values: formattedRows,
      }),
    }
  );
  await handleApiResponse(updateRes);

  return { addedCount: formattedRows.length };
}

export async function findUnsyncedTransactions(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  transactions: Transaction[]
): Promise<{ unsynced: Transaction[]; existingCount: number }> {
  const rows = await readSheetRows(accessToken, spreadsheetId, sheetTitle);
  const structure = analyzeSheetRows(rows);
  const unsynced = transactions.filter(
    (tx) => !structure.existingSignatures.has(getTransactionSignature(tx))
  );
  return {
    unsynced,
    existingCount: structure.existingTxCount,
  };
}

export async function createKasSpreadsheet(
  accessToken: string,
  transactions: Transaction[]
): Promise<{
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  sheetId: number;
  sheetTitle: string;
}> {
  const sheetTitle = 'Laporan Kas 2026';
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: 'Laporan Keuangan Kas DDV Banten 2026',
        locale: 'id_ID',
      },
      sheets: [
        {
          properties: {
            title: sheetTitle,
            gridProperties: {
              frozenRowCount: 6,
            },
          },
        },
      ],
    }),
  });

  const created = await handleApiResponse<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    properties: { title: string };
    sheets: Array<{ properties: { sheetId: number; title: string } }>;
  }>(createRes);

  const createdSheetId = created.sheets?.[0]?.properties?.sheetId ?? 0;

  const totalIncome = transactions.reduce((a, b) => a + b.income, 0);
  const totalExpense = transactions.reduce((a, b) => a + b.expense, 0);
  const finalBalance =
    transactions.length > 0
      ? transactions[transactions.length - 1].balanceAfter
      : 0;

  const values: (string | number)[][] = [
    ['LAPORAN UANG MUKA KEGIATAN'],
    ['Tujuan Pengajuan', '', ': UANG KAS DDV'],
    ['Penanggung Jawab', '', ': Pauzan'],
    ['PIC DDV Banten', '', ': Nurul Amanah'],
    [],
    [
      'NO.',
      'TGL',
      'RINCIAN PENGELUARAN',
      'KATEGORI',
      'KEGIATAN',
      'PEMASUKAN',
      'PENGELUARAN',
      'DANA TERSEDIA',
      'KETERANGAN',
    ],
    ...transactions.map((tx, idx) => [
      idx + 1,
      formatDateSlash(tx),
      tx.title,
      CATEGORY_LABELS[tx.category],
      tx.program,
      tx.income > 0 ? tx.income : '',
      tx.expense > 0 ? tx.expense : '',
      tx.balanceAfter,
      tx.status ? tx.status.label : '',
    ]),
    [],
    [
      '',
      '',
      'TOTAL PENGELOLAAN DANA',
      '',
      '',
      totalIncome,
      totalExpense,
      finalBalance,
      '',
    ],
  ];

  const range = `${sheetTitle}!A1`;
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      created.spreadsheetId
    )}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values,
      }),
    }
  );
  await handleApiResponse(updateRes);

  return {
    spreadsheetId: created.spreadsheetId,
    spreadsheetUrl: created.spreadsheetUrl,
    title: created.properties.title,
    sheetId: createdSheetId,
    sheetTitle,
  };
}
