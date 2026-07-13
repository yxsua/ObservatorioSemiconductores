import { useEffect, useState } from "react";
import FormActions from "./FormActions";
import { normalizeSelectValue, resolveOptionLabel, resolveOptionValue } from "./formHelpers";

const initialState = {
  fcv_code: "",
  name: "",
  description: "",
  parent_category_id: "",
};

function CategoryForm({
  initialData = null,
  fcvOptions = [],
  parentCategories = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
}) {
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (!initialData) {
      setForm(initialState);
      return;
    }

    setForm({
      fcv_code: normalizeSelectValue(initialData.fcv_code ?? initialData.code_fcv),
      name: initialData.name ?? "",
      description: initialData.description ?? "",
      parent_category_id: normalizeSelectValue(initialData.parent_category_id),
    });
  }, [initialData]);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(form);
  };

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <label>
        FCV
        <select name="fcv_code" value={form.fcv_code} onChange={handleChange} required>
          <option value="">Seleccione...</option>
          {fcvOptions.map((option) => (
            <option key={resolveOptionValue(option, "code")} value={resolveOptionValue(option, "code")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Nombre
        <input name="name" value={form.name} onChange={handleChange} required />
      </label>

      <label>
        Descripcion
        <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
      </label>

      <label>
        Categoria padre
        <select name="parent_category_id" value={form.parent_category_id} onChange={handleChange}>
          <option value="">Sin categoria padre</option>
          {parentCategories.map((option) => (
            <option key={resolveOptionValue(option, "id_category")} value={resolveOptionValue(option, "id_category")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />
    </form>
  );
}

export default CategoryForm;
