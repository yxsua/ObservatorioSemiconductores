import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import useObservatoryResource from "../hooks/useObservatoryResource";
import { getObservatoryCatalogs } from "../services/observatoryApi";
import DataTable from "./DataTable";
import LoadingSpinner from "./LoadingSpinner";
import SectionFilters from "./SectionFilters";
import ToneBullet from "./ToneBullet";

function ObservatorySection({
  catalogSection,
  columns,
  description,
  emptyMessage,
  filters = [],
  highlights = [],
  loader,
  title,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterValues, setFilterValues] = useState({});

  const filterNames = useMemo(
    () => filters.map((filter) => filter.name),
    [filters],
  );

  const activeFilters = useMemo(() => {
    return filterNames.reduce((currentFilters, name) => {
      const value = searchParams.get(name);

      if (value) {
        currentFilters[name] = value;
      }

      return currentFilters;
    }, {});
  }, [filterNames, searchParams]);

  const activeFilterKey = JSON.stringify(activeFilters);

  useEffect(() => {
    setFilterValues(activeFilters);
  }, [activeFilterKey]);

  const loadData = useCallback(
    () => loader(activeFilters),
    [activeFilterKey, loader],
  );

  const { data, error, isLoading } = useObservatoryResource(loadData, []);
  const {
    data: catalogs,
    error: catalogError,
    isLoading: isCatalogLoading,
  } = useObservatoryResource(getObservatoryCatalogs, {});

  const catalogOptions = catalogSection ? catalogs?.[catalogSection] : {};

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilterValues((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();

    const nextSearchParams = new URLSearchParams();

    filterNames.forEach((name) => {
      const value = filterValues[name];

      if (value) {
        nextSearchParams.set(name, value);
      }
    });

    setSearchParams(nextSearchParams);
  };

  const handleFilterReset = () => {
    setFilterValues({});
    setSearchParams(new URLSearchParams());
  };

  return (
    <section className="page-section">
      <div className="section-heading">
        <p className="eyebrow">Datos desde PostgreSQL</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {highlights.length > 0 && (
        <div className="section-bullets">
          {highlights.map((item) => (
            <ToneBullet
              key={item.label}
              label={item.label}
              tone={item.tone}
              value={item.value}
            />
          ))}
        </div>
      )}

      <SectionFilters
        catalogOptions={catalogOptions}
        filters={filters}
        isLoading={isCatalogLoading}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
        onSubmit={handleFilterSubmit}
        values={filterValues}
      />

      {catalogError && <div className="auth-error">{catalogError}</div>}

      {isLoading ? (
        <LoadingSpinner label="Cargando registros..." />
      ) : error ? (
        <div className="auth-error">{error}</div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          emptyMessage={emptyMessage}
          paginated
          sortable
        />
      )}
    </section>
  );
}

export default ObservatorySection;
