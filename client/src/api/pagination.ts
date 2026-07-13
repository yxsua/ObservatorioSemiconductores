export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: Pagination;
}

export function canGoToPreviousPage(pagination: Pagination) {
  return pagination.page > 1;
}

export function canGoToNextPage(pagination: Pagination) {
  return pagination.page < pagination.totalPages;
}
