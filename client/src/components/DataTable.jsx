import { useMemo, useState } from "react";

function DataTable({
  columns,
  data = [],
  searchable = false,
  sortable = false,
  paginated = false,
  pageSize = 10,
  emptyMessage = "Sin registros",
  getRowKey,
}) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [page, setPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!searchable || !search.trim()) {
      return data;
    }

    const normalizedSearch = search.toLowerCase();

    return data.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(normalizedSearch),
    );
  }, [data, search, searchable]);

  const sortedData = useMemo(() => {
    if (!sortable || !sortField) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const valueA = a[sortField];
      const valueB = b[sortField];

      if (valueA == null) return 1;
      if (valueB == null) return -1;

      if (valueA < valueB) {
        return sortDirection === "asc" ? -1 : 1;
      }

      if (valueA > valueB) {
        return sortDirection === "asc" ? 1 : -1;
      }

      return 0;
    });
  }, [filteredData, sortable, sortField, sortDirection]);

  const totalPages = paginated
    ? Math.max(1, Math.ceil(sortedData.length / pageSize))
    : 1;

  const visibleData = useMemo(() => {
    if (!paginated) {
      return sortedData;
    }

    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize, paginated]);

  const handleSort = (field) => {
    if (!sortable || !field) return;

    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection("asc");
  };

  const resolveRowKey = (row, rowIndex) => {
    if (getRowKey) {
      return getRowKey(row, rowIndex);
    }

    return (
      row.id ??
      row.id_signal ??
      row.id_trend ??
      row.id_alert ??
      row.id_content ??
      row.id_source ??
      row.id_user ??
      row.id_category ??
      rowIndex
    );
  };

  return (
    <section className="data-table-shell">
      {searchable && (
        <div className="data-table-toolbar">
          <input
            type="search"
            placeholder="Buscar..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="data-table-search"
          />
        </div>
      )}

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className={sortable ? "data-table-sortable" : undefined}
                  scope="col"
                >
                  <span>{column.title}</span>
                  {sortable && sortField === column.key && (
                    <span aria-hidden="true">
                      {sortDirection === "asc" ? " ^" : " v"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visibleData.length === 0 ? (
              <tr>
                <td className="data-table-empty" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visibleData.map((row, rowIndex) => (
                <tr key={resolveRowKey(row, rowIndex)}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {paginated && (
        <div className="data-table-pagination">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </button>

          <span>
            Pagina {page} de {totalPages}
          </span>

          <button
            type="button"
            disabled={page === totalPages}
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
          >
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
}

export default DataTable;
