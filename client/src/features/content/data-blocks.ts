export type TableCell = string | number | boolean | null;
export type TableColumnType = "text" | "number" | "boolean" | "date";
export interface TableColumn { key: string; label: string; type: TableColumnType; }
export interface TableData { caption: string | null; columns: TableColumn[]; rows: Record<string, TableCell>[]; }
export type ChartType = "bar" | "line" | "area" | "pie";
export interface ChartSeries { name: string; values: number[]; color?: string; }
export interface ChartData { chartType: ChartType; title: string | null; labels: string[]; series: ChartSeries[]; }

const COLUMN_TYPES = new Set<TableColumnType>(["text", "number", "boolean", "date"]);
const CHART_TYPES = new Set<ChartType>(["bar", "line", "area", "pie"]);
const isCell = (value: unknown): value is TableCell => value === null || ["string", "number", "boolean"].includes(typeof value);

export function parseTableData(value: Record<string, unknown>): TableData | null {
  if (!Array.isArray(value.columns) || value.columns.length < 1 || value.columns.length > 20 || !Array.isArray(value.rows) || value.rows.length > 500) return null;
  const columns = value.columns.flatMap<TableColumn>((column) => {
    if (!column || typeof column !== "object") return [];
    const item = column as Record<string, unknown>;
    if (typeof item.key !== "string" || !/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(item.key)
      || typeof item.label !== "string" || !item.label.trim() || item.label.length > 100
      || typeof item.type !== "string" || !COLUMN_TYPES.has(item.type as TableColumnType)) return [];
    return [{ key: item.key, label: item.label, type: item.type as TableColumnType }];
  });
  if (columns.length !== value.columns.length || new Set(columns.map(({ key }) => key)).size !== columns.length) return null;
  const allowed = new Set(columns.map(({ key }) => key));
  const rows = value.rows.flatMap<Record<string, TableCell>>((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return [];
    const entries = Object.entries(row);
    if (entries.some(([key, cell]) => !allowed.has(key) || !isCell(cell))) return [];
    const normalized = Object.fromEntries(entries) as Record<string, TableCell>;
    const valid = columns.every((column) => {
      const cell = normalized[column.key];
      if (cell === undefined || cell === null) return true;
      if (column.type === "date") return typeof cell === "string" && /^\d{4}-\d{2}-\d{2}$/.test(cell);
      if (column.type === "text") return typeof cell === "string";
      return typeof cell === column.type;
    });
    return valid ? [normalized] : [];
  });
  if (rows.length !== value.rows.length) return null;
  const caption = value.caption == null ? null : typeof value.caption === "string" && value.caption.length <= 300 ? value.caption : null;
  if (value.caption != null && caption === null) return null;
  return { caption, columns, rows };
}

export function parseChartData(value: Record<string, unknown>): ChartData | null {
  if (typeof value.chartType !== "string" || !CHART_TYPES.has(value.chartType as ChartType)
    || !Array.isArray(value.labels) || value.labels.length < 1 || value.labels.length > 1000
    || value.labels.some((label) => typeof label !== "string" || !label.trim() || label.length > 100)
    || !Array.isArray(value.series) || value.series.length < 1 || value.series.length > 20) return null;
  const labels = value.labels as string[];
  const series = value.series.flatMap<ChartSeries>((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Record<string, unknown>;
    if (typeof item.name !== "string" || !item.name.trim() || item.name.length > 100
      || !Array.isArray(item.values) || item.values.length !== labels.length
      || item.values.some((number) => typeof number !== "number" || !Number.isFinite(number))
      || (item.color !== undefined && (typeof item.color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(item.color)))) return [];
    return [{ name: item.name, values: item.values as number[], color: item.color as string | undefined }];
  });
  if (series.length !== value.series.length) return null;
  const chartType = value.chartType as ChartType;
  if (chartType === "pie" && (series.length !== 1 || series[0].values.some((number) => number < 0) || series[0].values.every((number) => number === 0))) return null;
  const title = value.title == null ? null : typeof value.title === "string" && value.title.length <= 300 ? value.title : null;
  if (value.title != null && title === null) return null;
  return { chartType, title, labels, series };
}
