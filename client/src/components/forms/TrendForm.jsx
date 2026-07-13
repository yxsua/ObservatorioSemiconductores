import { useEffect, useState } from "react";
import FormActions from "./FormActions";
import { normalizeSelectValue, resolveOptionLabel, resolveOptionValue } from "./formHelpers";

const initialState = {
  title: "",
  narrative: "",
  analyst_id: "",
  implications: "",
  first_signal_date: "",
  direction_code: "",
  maturity_code: "",
  status_code: "NEW",
};

function TrendForm({
  initialData = null,
  analysts = [],
  directions = [],
  maturityOptions = [],
  statuses = [],
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
      title: initialData.title ?? "",
      narrative: initialData.narrative ?? "",
      analyst_id: normalizeSelectValue(initialData.analyst_id ?? initialData.id_analyst),
      implications: initialData.implications ?? "",
      first_signal_date: initialData.first_signal_date ?? "",
      direction_code: normalizeSelectValue(initialData.direction_code),
      maturity_code: normalizeSelectValue(initialData.maturity_code),
      status_code: initialData.status_code ?? "NEW",
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
    <form className="entity-form entity-form--wide" onSubmit={handleSubmit}>
      <label>
        Titulo
        <input name="title" value={form.title} onChange={handleChange} required />
      </label>

      <label>
        Narrativa
        <textarea name="narrative" value={form.narrative} onChange={handleChange} rows={5} required />
      </label>

      <label>
        Implicaciones
        <textarea name="implications" value={form.implications} onChange={handleChange} rows={3} />
      </label>

      <label>
        Primera senal
        <input name="first_signal_date" type="date" value={form.first_signal_date} onChange={handleChange} />
      </label>

      <label>
        Direccion
        <select name="direction_code" value={form.direction_code} onChange={handleChange}>
          <option value="">Seleccione...</option>
          {directions.map((option) => (
            <option key={resolveOptionValue(option, "code")} value={resolveOptionValue(option, "code")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Madurez
        <select name="maturity_code" value={form.maturity_code} onChange={handleChange}>
          <option value="">Seleccione...</option>
          {maturityOptions.map((option) => (
            <option key={resolveOptionValue(option, "code")} value={resolveOptionValue(option, "code")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Estado
        <select name="status_code" value={form.status_code} onChange={handleChange}>
          {statuses.length === 0 && <option value="NEW">Nueva</option>}
          {statuses.map((option) => (
            <option key={resolveOptionValue(option, "code")} value={resolveOptionValue(option, "code")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Analista
        <select name="analyst_id" value={form.analyst_id} onChange={handleChange}>
          <option value="">Sin asignar</option>
          {analysts.map((option) => (
            <option key={resolveOptionValue(option, "id_user")} value={resolveOptionValue(option, "id_user")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />
    </form>
  );
}

export default TrendForm;
