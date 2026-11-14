import type { CategoryCode, RawTransactionInput } from '../types/kas';

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseRupiahValue(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^0-9]/g, '');
  return cleaned ? Number(cleaned) : 0;
}

function inferCategory(title: string, isIncome: boolean): CategoryCode {
  if (isIncome) return 'M';
  const t = title.toLowerCase();
  if (
    t.includes('makan') ||
    t.includes('snack') ||
    t.includes('konsumsi') ||
    t.includes('air') ||
    t.includes('roti') ||
    t.includes('sarapan') ||
    t.includes('gorengan') ||
    t.includes('gula')
  ) {
    return 'K';
  }
  if (
    t.includes('tf ') ||
    t.includes('transfer') ||
    t.includes('pengembalian dana')
  ) {
    return 'F';
  }
  if (
    t.includes('bensin') ||
    t.includes('pertamax') ||
    t.includes('e-toll') ||
    t.includes('gosend') ||
    t.includes('maxim') ||
    t.includes('driver') ||
    t.includes('transport')
  ) {
    return 'T';
  }
  if (
    t.includes('capcut') ||
    t.includes('admin') ||
    t.includes('notifikasi')
  ) {
    return 'L';
  }
  if (
    t.includes('fc ') ||
    t.includes('print') ||
    t.includes('cetak') ||
    t.includes('nota') ||
    t.includes('buku') ||
    t.includes('pulpen') ||
    t.includes('spidol') ||
    t.includes('pensil') ||
    t.includes('nametag') ||
    t.includes('id card') ||
    t.includes('stiker') ||
    t.includes('sticky note') ||
    t.includes('karton') ||
    t.includes('metode pembelajaran')
  ) {
    return 'A';
  }
  return 'P';
}

function mapStatusFromKeterangan(ket: string): string {
  const k = ket.toLowerCase().trim();
  if (!k) return '_';
  if (k.includes('sudah') && (k.includes('reimb') || k.includes('thk'))) {
    return 's';
  }
  if (k.includes('proses')) {
    if (k.includes('mangrove')) return 'pm';
    if (k.includes('dmc')) return 'pd';
    if (k.includes('pusat')) return 'pc';
    return 'pu';
  }
  if (k.includes('reimb') && k.includes('rm')) return 'rr';
  if (k.includes('tanam pohon')) return 'rt';
  return '_';
}

function parseDateCell(raw: string): { day: string; month: number; year: number } | null {
  const cleaned = raw.trim();
  const parts = cleaned.split(/[\/\-]/);
  if (parts.length < 2) return null;
  const dayNum = Number(parts[0]);
  let monthNum = Number(parts[1]);
  if (!dayNum || !monthNum) return null;
  // Handle typo like 27/26/26 in source CSV -> 27/06/26
  if (monthNum > 12 && monthNum === 26) monthNum = 6;
  if (monthNum < 1 || monthNum > 12) return null;

  let year = 2026;
  if (parts[2]) {
    const y = Number(parts[2]);
    year = y < 100 ? 2000 + y : y;
  }

  return {
    day: String(Math.min(31, Math.max(1, dayNum))).padStart(2, '0'),
    month: monthNum,
    year,
  };
}

export function parseRowsToTransactions(rows: string[][]): RawTransactionInput[] {
  let headerIdx = -1;
  let colTgl = 1;
  let colTitle = 2;
  let colCategory = -1;
  let colIncome = 7;
  let colExpense = 8;
  let colStatus = 10;

  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const upper = rows[i].map((c) => c.toUpperCase().trim());
    const idxTitle = upper.findIndex(
      (c) => c.includes('RINCIAN') || c.includes('KETERANGAN TRANSAKSI')
    );
    const idxInc = upper.findIndex((c) => c === 'PEMASUKAN');
    const idxExp = upper.findIndex((c) => c === 'PENGELUARAN');

    if (idxTitle !== -1 && (idxInc !== -1 || idxExp !== -1)) {
      headerIdx = i;
      colTgl = Math.max(0, upper.findIndex((c) => c === 'TGL' || c === 'TANGGAL'));
      colTitle = idxTitle;
      colCategory = upper.findIndex((c) => c === 'KATEGORI');
      colIncome = idxInc;
      colExpense = idxExp;
      const idxKet = upper.findIndex((c) => c === 'KETERANGAN' || c === 'STATUS');
      colStatus = idxKet !== -1 ? idxKet : colExpense + 2;
      break;
    }
  }

  const startIdx = headerIdx !== -1 ? headerIdx + 1 : 0;
  const parsed: RawTransactionInput[] = [];

  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const title = (row[colTitle] || '').trim();
    if (!title || title.toUpperCase().includes('TOTAL')) continue;

    const dateInfo = parseDateCell(row[colTgl] || '');
    if (!dateInfo) continue;

    const income = parseRupiahValue(row[colIncome]);
    const expense = parseRupiahValue(row[colExpense]);
    if (income === 0 && expense === 0) continue;

    const statusText = row[colStatus] || '';
    const statusCode = mapStatusFromKeterangan(statusText);

    let category: CategoryCode = inferCategory(title, income > 0);
    if (colCategory !== -1 && row[colCategory]) {
      const catText = row[colCategory].toLowerCase();
      if (catText.includes('konsumsi')) category = 'K';
      else if (catText.includes('atk')) category = 'A';
      else if (catText.includes('transport')) category = 'T';
      else if (catText.includes('transfer')) category = 'F';
      else if (catText.includes('langganan')) category = 'L';
      else if (catText.includes('perlengkapan')) category = 'P';
      else if (catText.includes('pemasukan')) category = 'M';
    }

    parsed.push({
      id: `tx-import-${i}-${dateInfo.day}${dateInfo.month}`,
      day: dateInfo.day,
      month: dateInfo.month,
      year: dateInfo.year,
      title,
      income,
      expense,
      statusCode,
      category,
    });
  }

  return parsed;
}

export function parseLaporanCsv(csvContent: string): RawTransactionInput[] {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows = lines.map(parseCsvLine);
  return parseRowsToTransactions(rows);
}
