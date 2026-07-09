import { api } from "@/lib/api";

// Fetch an authenticated CSV endpoint (cookies via the shared api() client — a
// text/csv body comes back as a string) and trigger a browser download.
export async function downloadCsv(path: string, filename: string): Promise<void> {
  const csv = await api<string>(path);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
