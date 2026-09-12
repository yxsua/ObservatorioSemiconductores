import { useState } from "react";
import type { CatalogOption } from "./catalogs.service";
import { TaxonomyFilter } from "./TaxonomyFilter";

export function useTaxonomyFilters(filters: { fcvCodes?: string; fcv?: string; categoryIds?: string; categoryId?: number }, catalogs?: { fcv: CatalogOption[]; categories: CatalogOption[] }) {
  const [fcvs, setFcvs] = useState((filters.fcvCodes ?? filters.fcv ?? "").split(",").filter(Boolean));
  const [categories, setCategories] = useState((filters.categoryIds ?? String(filters.categoryId ?? "")).split(",").filter(Boolean));
  const changeFcvs = (values: string[]) => {
    setFcvs(values);
    setCategories(current => current.filter(id => catalogs?.categories.some(option => String(option.id) === id && (!values.length || values.includes(option.fcvCode ?? "")))));
  };
  return {
    factor: <TaxonomyFilter label="Factores críticos" name="fcvCodes" selected={fcvs} onChange={changeFcvs} loading={!catalogs} options={catalogs?.fcv.flatMap(option => option.code ? [{ value: option.code, name: option.name }] : []) ?? []} />,
    category: <TaxonomyFilter label="Categorías" name="categoryIds" selected={categories} onChange={setCategories} loading={!catalogs} options={catalogs?.categories.filter(option => !fcvs.length || fcvs.includes(option.fcvCode ?? "")).flatMap(option => option.id ? [{ value: String(option.id), name: option.name }] : []) ?? []} />
  };
}
