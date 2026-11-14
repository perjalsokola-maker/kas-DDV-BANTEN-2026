import type {
  BudgetConfig,
  CategoryCode,
  RawTransactionInput,
  ReimburseSourceCode,
  ReimburseStatus,
  Transaction,
} from '../types/kas';

export const CATEGORY_LABELS: Record<CategoryCode, string> = {
  K: 'Konsumsi',
  A: 'ATK & Cetak',
  T: 'Transport',
  F: 'Transfer Dana',
  L: 'Langganan & Admin',
  P: 'Perlengkapan',
  M: 'Pemasukan',
};

export const CATEGORY_SHORT: Record<CategoryCode, string> = {
  K: 'Ko',
  A: 'AT',
  T: 'Tr',
  F: 'TF',
  L: 'La',
  P: 'Pe',
  M: 'Pe',
};

export const REIMBURSE_SOURCES: Record<ReimburseSourceCode, string> = {
  u: 'Umum',
  m: 'Mangrove',
  d: 'DMC',
  c: 'Pusat & Cabang',
};

export const MONTH_NAMES = [
  '',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export const MONTH_FULL_NAMES = [
  '',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const RAW = `2404|Dana dari Teh Nurul|500000|0|_|M
2404|Pengembalian dana Farha yang minus|0|43000|_|F
2504|Makan siang 7 orang, wawancara oprec|0|84000|pu|K
2504|Snack 7 orang, wawancara oprec|0|20000|pu|K
2604|Makan siang 5 relawan, wawancara|0|61000|pu|K
2604|Snack 5 relawan, wawancara|0|30000|pu|K
0105|Balon 10 pcs, first meet|0|10000|pu|P
0205|Dana dari Teh Nurul|500000|0|_|M
0205|Snack first meet|0|50000|pu|K
0205|Makan siang 15 relawan, first meet|0|195000|pu|K
0205|Makan siang 8 relawan, first meet|0|104000|pu|K
1505|Buku absensi relawan|0|20000|pu|A
1505|Lem tembak 18 pcs, kostum|0|30000|pu|P
1505|Kerudung pashmina 3 pcs, kostum|0|105000|pu|P
1505|Pengembalian reimburse dari dana upgrading|135000|0|_|M
1505|Snack rapat THK|0|70000|s|K
1805|Nota dan kuitansi|0|9000|s|A
1805|CapCut Pro 1 bulan|0|10000|s|L
2205|Pemasukan sisa dana upgrading|1124500|0|_|M
2405|Snack rapat THK|0|30000|s|K
2805|Snack persiapan THK|0|30000|s|K
1605|TF pegangan Jeje, live THK|0|700000|_|F
2205|TF pegangan Jeje, live THK tahap 2|0|500000|_|F
1106|Reimburse agenda live THK dari Teh Nurul|762500|0|_|M
1106|Reimburse persiapan THK dari Teh Nurul|149000|0|_|M
1106|Sisa kemasan sedekah daging|170070|0|_|M
1106|Sisa uang kurban asik dari Ojan|132710|0|_|M
1306|CapCut Pro 1 bulan, 2 device|0|55000|rr|L
1506|Dana bazar baju kurban asik|340000|0|_|M
1806|2 paket buku TBM|0|206522|rr|P
1806|Pompa air TBM|0|25999|rr|P
1806|Metode pembelajaran TBM 5 pcs|0|18994|rr|A
1906|Papan tulis 3 pcs TBM|0|126391|rr|P
1906|Pulpen Joyko TBM|0|26632|rr|A
1906|Refil tinta spidol 2 pcs TBM|0|35735|rr|A
1906|Pensil Joyko TBM|0|10912|rr|A
2106|Snack bincang relawan|0|35000|rr|K
2106|Makan siang 2 relawan setelah TBM|0|26000|rr|K
2306|Nametag 100 pcs TBM|0|126660|rr|A
2606|Snack rapat oprec kakak pengajar|0|30000|rr|K
2606|FC kebutuhan oprec kakak pengajar|0|17500|rr|A
2706|Air gunung gelas 1 dus|0|21500|rr|K
2706|Makan siang 4 relawan, wawancara pengajar|0|52000|rr|K
2806|Makan siang 4 relawan, wawancara hari 2|0|52000|rr|K
2806|Snack rapat fidyah|0|30000|rr|K
3006|Biaya admin notifikasi SMS|0|7500|rr|L
0207|Snack rapat kegiatan fidyah|0|30000|rr|K
0307|FC kebutuhan first meet kakak pengajar|0|19000|rr|A
0307|Air minum galon|0|8500|rr|K
0407|Snack first meet kakak pengajar|0|50000|rr|K
0407|Makan siang 14 relawan, first meet pengajar|0|182000|rr|K
0407|Makan siang 1 relawan, first meet pengajar|0|14000|rr|K
0807|Snack rapat fidyah|0|30500|rt|K
0807|Dana reward lomba kurban asik tanpa sampah plastik|1000000|0|_|M
0907|Konsumsi 2 relawan, survey fidyah|0|30500|rt|K
1307|CapCut Pro 3 device|0|55000|rt|L
1407|Reimburse dana rapat fidyah dan tanam pohon|30000|0|_|M
2007|Dana TF sisa penanaman pohon|1063500|0|_|M
2107|Reimburse talangan perlengkapan TBM|1207845|0|_|M
2207|Reimburse dana sertijab DDV 2026|1910000|0|_|M
2807|Biaya admin notifikasi SMS|0|3000|_|L
0108|Snack rapat kakak pengajar|0|30500|pm|K
0108|FC materi pembelajaran dan gunting kuku|0|30500|pm|A
0808|Briefing kakak pengajar TBM roadshow Tegal Maja|0|30000|pm|K
2808|Tabung gas untuk sekre DDV|0|230000|_|P
0109|Biaya admin notifikasi SMS|0|3750|_|L
0409|Kertas kado dan tumbler, best volunteer|0|81000|_|P
0509|Konsumsi bonding relawan|0|64500|_|K
0509|Admin pemindahan rekening|0|2000|_|L
0509|Gula putih 1/4|0|5000|_|K
0709|CapCut Pro sebulan|0|27000|_|L
1109|Snack rapat penanaman mangrove|0|30000|_|K
1209|Snack bonding relawan|0|31000|_|K
1209|Snack 2 pack untuk TBM|0|19500|rr|K
1209|Print pembelajaran 24 pcs TBM|0|5000|rr|A
1209|Snack hadiah kakak pengajar 2 pack|0|18000|rr|K
1309|Reimburse persiapan TBM|42500|0|_|M
1909|Snack rapat mangrove|0|30000|pm|K
2409|Gosend rompi dari Farha|0|14000|_|T
2409|Makan siang 3 relawan, survey mangrove|0|36000|pm|K
2509|Air galon isi ulang, campaign Satu Asa|0|3000|_|K
2509|Baterai ABC, campaign Satu Asa|0|15000|_|P
2509|Mini gift campaign Satu Asa|0|35000|_|P
2509|Karton, pita, sticky note campaign|0|39000|_|A
2509|FC gambar campaign|0|20000|_|A
2509|Cetak print A3 campaign|0|157500|_|A
2509|Maxim|0|10000|_|T
2609|Print kebutuhan TBM|0|3000|rr|A
2609|Konsumsi rapat campaign Satu Asa|0|20000|_|K
2609|Doubletip campaign|0|20000|_|P
2609|Mini gift campaign|0|30000|_|P
2609|Gorengan persiapan campaign|0|20000|_|K
2609|Air minum 1 dus|0|22000|_|K
2609|Print kegiatan campaign|0|11000|_|A
2709|E-toll campaign Satu Asa|0|38000|_|T
2709|Bensin transport campaign|0|100000|_|T
2709|Sarapan driver campaign|0|15000|_|K
2709|Roti sarapan relawan|0|32000|_|K
2709|Makan siang 11 relawan, campaign Satu Asa|0|165000|_|K
2709|Pembayaran driver campaign Satu Asa|0|100000|_|T
2809|Reimburse print pembelajaran TBM|3000|0|_|M
2909|Makan siang kegiatan donasi Satu Asa|0|21000|_|K
0210|Konsumsi rapat penanaman mangrove|0|30000|pc|K
0310|TF ke Windy, keperluan tanam mangrove|0|2000000|pc|F
0610|Reimburse Teh Nurul, konsumsi kegiatan mangrove|0|43500|pc|K
1110|ID card relawan DDV 2026, 27 paket|0|192102|pm|A
1310|Print dan stiker T&J, side event|0|21000|pd|A
1310|Sticky note 2 pcs|0|8000|pd|A
1310|Laundry rompi DDV|0|24000|pm|P
1510|Karung goni 2 pcs, kegiatan PRB|0|20000|pd|P
1510|Bensin mobil DD Banten, acara PRB|0|100000|pd|T
1510|Bensin Pertamax, acara PRB|0|20000|pd|T
1510|Gorengan acara PRB|0|20000|pd|K
3010|Konsumsi rapat Siaga Bumi|0|40000|_|K`;

export function formatRp(value: number): string {
  const rounded = Math.round(Math.abs(value));
  const formatted = rounded.toLocaleString('id-ID').replace(/,/g, '.');
  return `${value < 0 ? '−' : ''}Rp${formatted}`;
}

export function parseStatus(code: string): ReimburseStatus | null {
  if (!code || code === '_') return null;
  if (code[0] === 'p') {
    const srcCode = code[1] as ReimburseSourceCode;
    const srcName = REIMBURSE_SOURCES[srcCode] || 'Umum';
    return {
      kind: 'p',
      label: `Proses reimburse ${srcName}`,
      sourceCode: srcCode,
      sourceName: srcName,
    };
  }
  if (code === 's') {
    return {
      kind: 's',
      label: 'Sudah kembali (THK)',
    };
  }
  if (code[0] === 'r') {
    return {
      kind: 'r',
      label: `Reimburse ${code[1] === 'r' ? 'RM' : 'Tanam Pohon'}`,
    };
  }
  return null;
}

export function detectProgram(title: string, statusCode: string): string {
  const t = title.toLowerCase();
  if (t.includes('satu asa') || t.includes('campaign')) return 'Campaign Satu Asa';
  if (t.includes('tbm') || t.includes('kakak pengajar')) return 'TBM & Kakak Pengajar';
  if (t.includes('mangrove') || statusCode === 'pm' || statusCode === 'pc') return 'Penanaman Mangrove';
  if (t.includes('thk') || t.includes('kurban') || t.includes('daging') || statusCode === 's') return 'THK & Kurban Asik';
  if (t.includes('prb') || t.includes('siaga bumi') || t.includes('side event') || statusCode === 'pd') return 'PRB, DMC & Siaga Bumi';
  if (t.includes('oprec') || t.includes('first meet') || t.includes('wawancara') || t.includes('upgrading') || t.includes('sertijab') || t.includes('bonding') || t.includes('best volunteer')) return 'Oprec, Upgrading & Relawan';
  if (t.includes('fidyah') || t.includes('tanam pohon')) return 'Fidyah & Tanam Pohon';
  return 'Operasional & Dana Kas';
}

export function getInitialRawTransactions(): RawTransactionInput[] {
  return RAW.trim()
    .split('\n')
    .map((line, idx) => {
      const [dm, title, inc, exp, statusCode, cat] = line.split('|');
      return {
        id: `tx-init-${idx + 1}`,
        day: dm.slice(0, 2),
        month: Number(dm.slice(2)),
        year: 2026,
        title,
        income: Number(inc),
        expense: Number(exp),
        statusCode,
        category: cat as CategoryCode,
      };
    });
}

export function hydrateTransactions(inputs: RawTransactionInput[]): Transaction[] {
  let runningBalance = 0;
  return inputs.map((item) => {
    runningBalance += item.income - item.expense;
    return {
      ...item,
      balanceAfter: runningBalance,
      status: parseStatus(item.statusCode),
      program: detectProgram(item.title, item.statusCode),
    };
  });
}

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  monthlyLimit: 2500000,
  reserveTarget: 3000000,
};
