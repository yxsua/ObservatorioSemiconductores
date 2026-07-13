import { formatPublicDate } from "@/features/surveillance/format";
import type { TableCell, TableColumn, TableData } from "./data-blocks";
import styles from "./DataBlocks.module.css";

function cellText(value: TableCell | undefined, column: TableColumn) {
  if (value === null || value === undefined) return "—";
  if (column.type === "boolean") return value ? "Sí" : "No";
  if (column.type === "number") return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 4 }).format(value as number);
  if (column.type === "date") return formatPublicDate(value as string);
  return String(value);
}

export function DataTable({ data, label }: { data: TableData; label?: string }) {
  return (
    <div aria-label={label || data.caption || "Tabla de datos"} className={styles.tableRegion} role="region" tabIndex={0}>
      <table>
        {data.caption && <caption>{data.caption}</caption>}
        <thead><tr>{data.columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}</tr></thead>
        <tbody>{data.rows.map((row, rowIndex) => <tr key={rowIndex}>{data.columns.map((column) => <td key={column.key}>{cellText(row[column.key], column)}</td>)}</tr>)}</tbody>
      </table>
      {data.rows.length === 0 && <p className={styles.emptyTable}>La tabla no contiene registros.</p>}
    </div>
  );
}
