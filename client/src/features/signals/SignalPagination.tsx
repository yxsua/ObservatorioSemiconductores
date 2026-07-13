import type { Pagination } from "@/api";
import styles from "./Signals.module.css";

interface SignalPaginationProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}

export function SignalPagination({ pagination, onPageChange }: SignalPaginationProps) {
  if (pagination.totalPages <= 1) return null;
  return (
    <nav aria-label="Paginación de señales" className={styles.pagination}>
      <button
        disabled={pagination.page <= 1}
        onClick={() => onPageChange(pagination.page - 1)}
        type="button"
      >
        ← Anterior
      </button>
      <span>Página <strong>{pagination.page}</strong> de {pagination.totalPages}</span>
      <button
        disabled={pagination.page >= pagination.totalPages}
        onClick={() => onPageChange(pagination.page + 1)}
        type="button"
      >
        Siguiente →
      </button>
    </nav>
  );
}
