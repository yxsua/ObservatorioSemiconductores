function resolveOptions(filter, catalogOptions) {
  if (filter.options) {
    return filter.options;
  }

  if (!filter.catalogKey) {
    return [];
  }

  return catalogOptions?.[filter.catalogKey] ?? [];
}

function SectionFilters({
  catalogOptions,
  filters = [],
  isLoading = false,
  onChange,
  onReset,
  onSubmit,
  values,
}) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <form className="section-filters" onSubmit={onSubmit}>
      <div className="filter-grid">
        {filters.map((filter) => {
          const options = resolveOptions(filter, catalogOptions);

          return (
            <label className="filter-field" key={filter.name}>
              <span>{filter.label}</span>
              {filter.type === "select" ? (
                <select
                  name={filter.name}
                  value={values[filter.name] ?? ""}
                  onChange={onChange}
                  disabled={isLoading}
                >
                  <option value="">{filter.placeholder ?? "Todos"}</option>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name={filter.name}
                  type="search"
                  value={values[filter.name] ?? ""}
                  onChange={onChange}
                  placeholder={filter.placeholder}
                />
              )}
            </label>
          );
        })}
      </div>

      <div className="filter-actions">
        <button type="submit">Aplicar filtros</button>
        <button type="button" onClick={onReset}>
          Limpiar
        </button>
      </div>
    </form>
  );
}

export default SectionFilters;
