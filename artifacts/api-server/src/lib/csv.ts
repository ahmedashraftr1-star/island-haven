import type { Response } from "express";

// Minimal, dependency-free CSV builder for admin data exports. RFC-4180 quoting:
// wrap a field in double-quotes and double any inner quote whenever it contains a
// comma, quote, or newline. A leading UTF-8 BOM makes Excel open Arabic correctly.

function cell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const lines = [headers.map(cell).join(",")];
  for (const r of rows) lines.push(r.map(cell).join(","));
  return "﻿" + lines.join("\r\n");
}

/** Send a CSV body as a downloadable attachment. */
export function sendCsv(res: Response, filename: string, csv: string): void {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
}
