const BOM = '﻿';

function escapeCell(value: string | number | boolean | null | undefined): string {
  let str = value == null ? '' : String(value);
  // CSV formula-injection guard: a leading =, +, -, @, tab or CR can be
  // interpreted as a formula by Excel/Sheets. Neutralize with a leading quote.
  if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportCsv(rows: Record<string, unknown>[], filename: string): void {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h] as string | number)).join(',')),
  ];

  const csv = BOM + csvLines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
