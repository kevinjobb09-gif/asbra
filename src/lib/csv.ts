/**
 * Gör en CSV-fil (semikolon, som Excel på svenska förväntar sig). Celler som börjar med
 * = + - @ får en apostrof först, så att Excel inte tolkar dem som formler.
 */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const cell = (value: string | number | null | undefined) => {
    let text = value === null || value === undefined ? "" : String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  // BOM först så att Excel läser å, ä och ö rätt.
  return `﻿${rows.map((row) => row.map(cell).join(";")).join("\r\n")}\r\n`;
}
