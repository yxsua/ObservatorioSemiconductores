import type { Pagination } from "@/api";
import styles from "./Surveillance.module.css";

interface Props {
  label: string;
  pagination: Pagination;
  onPageChange: (page: number) => void;
}

export function PublicPagination({ label, pagination, onPageChange }: Props) {
  if (pagination.totalPages <= 1) return null;
  return (
    <nav aria-label={"Paginación de " + label} className={styles.pagination}>
      <button disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)} type="button">← Anterior</button>
      <span>Página <strong>{pagination.page}</strong> de {pagination.totalPages}</span>
      <button disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)} type="button">Siguiente →</button>
    </nav>
  );
}
