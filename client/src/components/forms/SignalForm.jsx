import { useEffect, useState } from "react";
import FormActions from "./FormActions";
import { normalizeSelectValue, resolveOptionLabel, resolveOptionValue } from "./formHelpers";

const initialState = {
  title: "",
  summary: "",
  publication_date: "",
  evidence_url: "",
  category_id: "",
  source_id: "",
  signal_type_code: "",
  impact_code: "",
  urgency_code: "",
  scope_code: "",
  analyst_id: "",
  ips: "",
  notes: "",
  status_code: "NEW",
};

function SignalForm({
  initialData = null,
  categories = [],
  sources = [],
  signalTypes = [],
  impacts = [],
  urgencies = [],
  scopes = [],
  analysts = [],
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
      summary: initialData.summary ?? "",
      publication_date: initialData.publication_date ?? "",
      evidence_url: initialData.evidence_url ?? "",
      category_id: normalizeSelectValue(initialData.category_id ?? initialData.id_category),
      source_id: normalizeSelectValue(initialData.source_id ?? initialData.id_source),
      signal_type_code: normalizeSelectValue(initialData.signal_type_code),
      impact_code: normalizeSelectValue(initialData.impact_code),
      urgency_code: normalizeSelectValue(initialData.urgency_code),
      scope_code: normalizeSelectValue(initialData.scope_code),
      analyst_id: normalizeSelectValue(initialData.analyst_id ?? initialData.id_analyst),
      ips: normalizeSelectValue(initialData.ips),
      notes: initialData.notes ?? "",
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
    onSubmit?.({
      ...form,
      ips: form.ips === "" ? null : Number(form.ips),
    });
  };

  return (
    <form className="entity-form entity-form--wide" onSubmit={handleSubmit}>
      <label>
        Titulo
        <input name="title" value={form.title} onChange={handleChange} required />
      </label>

      <label>
        Resumen
        <textarea name="summary" value={form.summary} onChange={handleChange} rows={4} required />
      </label>

      <label>
        Fecha de publicacion
        <input name="publication_date" type="date" value={form.publication_date} onChange={handleChange} required />
      </label>

      <label>
        URL de evidencia
        <input name="evidence_url" type="url" value={form.evidence_url} onChange={handleChange} required />
      </label>

      <label>
        Categoria
        <select name="category_id" value={form.category_id} onChange={handleChange} required>
          <option value="">Seleccione...</option>
          {categories.map((option) => (
            <option key={resolveOptionValue(option, "id_category")} value={resolveOptionValue(option, "id_category")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Fuente
        <select name="source_id" value={form.source_id} onChange={handleChange} required>
          <option value="">Seleccione...</option>
          {sources.map((option) => (
            <option key={resolveOptionValue(option, "id_source")} value={resolveOptionValue(option, "id_source")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Tipo de senal
        <select name="signal_type_code" value={form.signal_type_code} onChange={handleChange} required>
          <option value="">Seleccione...</option>
          {signalTypes.map((option) => (
            <option key={resolveOptionValue(option, "code")} value={resolveOptionValue(option, "code")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Impacto
        <select name="impact_code" value={form.impact_code} onChange={handleChange} required>
          <option value="">Seleccione...</option>
          {impacts.map((option) => (
            <option key={resolveOptionValue(option, "code")} value={resolveOptionValue(option, "code")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Urgencia
        <select name="urgency_code" value={form.urgency_code} onChange={handleChange} required>
          <option value="">Seleccione...</option>
          {urgencies.map((option) => (
            <option key={resolveOptionValue(option, "code")} value={resolveOptionValue(option, "code")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Alcance
        <select name="scope_code" value={form.scope_code} onChange={handleChange} required>
          <option value="">Seleccione...</option>
          {scopes.map((option) => (
            <option key={resolveOptionValue(option, "code")} value={resolveOptionValue(option, "code")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Analista
        <select name="analyst_id" value={form.analyst_id} onChange={handleChange} required>
          <option value="">Seleccione...</option>
          {analysts.map((option) => (
            <option key={resolveOptionValue(option, "id_user")} value={resolveOptionValue(option, "id_user")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label>
        IPS
        <input name="ips" type="number" step="0.01" value={form.ips} onChange={handleChange} />
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
        Notas
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} />
      </label>

      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />
    </form>
  );
}

export default SignalForm;
