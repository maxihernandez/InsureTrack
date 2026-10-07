export type Period = { year: number; month: number; start: string; end: string; label: string };

export function parsePeriod(value: string | undefined): Period {
  const today = new Date();
  const match = /^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.exec(value ?? "");
  const year = match ? Number(match[1]) : today.getFullYear();
  const month = match ? Number(match[2]) : today.getMonth() + 1;
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(Date.UTC(year, month, 1));
  const end = endDate.toISOString().slice(0, 10);
  const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${start}T00:00:00Z`));
  return { year, month, start, end, label };
}
