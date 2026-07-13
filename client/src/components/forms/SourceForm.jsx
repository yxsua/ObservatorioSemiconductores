import { useEffect, useState } from "react";
import FormActions from "./FormActions";
import { normalizeSelectValue, resolveOptionLabel, resolveOptionValue } from "./formHelpers";

const initialState = {
  source_type_code: "",
  name: "",
  website: "",
  country: "",
  rss_url: "",
  api_url: "",
  reliability: "",
};

function SourceForm({
  initialData = null,
  sourceTypes = [],
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
      source_type_code: normalizeSelectValue(initialData.source_type_code),
      name: initialData.name ?? "",
      website: initialData.website ?? "",
      country: initialData.country ?? "",
      rss_url: initialData.rss_url ?? "",
      api_url: initialData.api_url ?? "",
      reliability: normalizeSelectValue(initialData.reliability),
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
    onSubmit?.({
      ...form,
      reliability: form.reliability === "" ? null : Number(form.reliability),
    });
  };

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <label>
        Tipo de fuente
        <select name="source_type_code" value={form.source_type_code} onChange={handleChange} required>
          <option value="">Seleccione...</option>
          {sourceTypes.map((option) => (
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
        Sitio web
        <input name="website" type="url" value={form.website} onChange={handleChange} />
      </label>

      <label>
        Pais
        <input name="country" value={form.country} onChange={handleChange} />
      </label>

      <label>
        RSS
        <input name="rss_url" type="url" value={form.rss_url} onChange={handleChange} />
      </label>

      <label>
        API
        <input name="api_url" type="url" value={form.api_url} onChange={handleChange} />
      </label>

      <label>
        Confiabilidad
        <input
          name="reliability"
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={form.reliability}
          onChange={handleChange}
        />
      </label>

      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />
    </form>
  );
}

export default SourceForm;
