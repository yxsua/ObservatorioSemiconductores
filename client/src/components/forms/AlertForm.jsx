import { useEffect, useState } from "react";
import FormActions from "./FormActions";
import { normalizeSelectValue, resolveOptionLabel, resolveOptionValue } from "./formHelpers";

const initialState = {
  title: "",
  executive_summary: "",
  generation_date: "",
  creator_id: "",
  level_code: "",
  status_code: "NEW",
  implications: "",
  recommendations: "",
  response_deadline: "",
  notes: "",
};

function AlertForm({
  initialData = null,
  creators = [],
  levels = [],
  statuses = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
}) {
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (!initialData) {
      setForm({
        ...initialState,
        generation_date: new Date().toISOString().slice(0, 10),
      });
      return;
    }

    setForm({
      title: initialData.title ?? "",
      executive_summary: initialData.executive_summary ?? "",
      generation_date: initialData.generation_date ?? "",
      creator_id: normalizeSelectValue(initialData.creator_id ?? initialData.id_creator),
      level_code: normalizeSelectValue(initialData.level_code),
      status_code: initialData.status_code ?? "NEW",
      implications: initialData.implications ?? "",
      recommendations: initialData.recommendations ?? "",
      response_deadline: initialData.response_deadline ?? "",
      notes: initialData.notes ?? "",
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
        Resumen ejecutivo
        <textarea name="executive_summary" value={form.executive_summary} onChange={handleChange} rows={4} required />
      </label>

      <label>
        Fecha de generacion
        <input name="generation_date" type="date" value={form.generation_date} onChange={handleChange} required />
      </label>

      <label>
        Fecha limite de respuesta
        <input name="response_deadline" type="date" value={form.response_deadline} onChange={handleChange} />
      </label>

      <label>
        Nivel
        <select name="level_code" value={form.level_code} onChange={handleChange}>
          <option value="">Seleccione...</option>
          {levels.map((option) => (
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
        Creador
        <select name="creator_id" value={form.creator_id} onChange={handleChange} required>
          <option value="">Seleccione...</option>
          {creators.map((option) => (
            <option key={resolveOptionValue(option, "id_user")} value={resolveOptionValue(option, "id_user")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Implicaciones
        <textarea name="implications" value={form.implications} onChange={handleChange} rows={3} />
      </label>

      <label>
        Recomendaciones
        <textarea name="recommendations" value={form.recommendations} onChange={handleChange} rows={3} />
      </label>

      <label>
        Notas
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} />
      </label>

      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />
    </form>
  );
}

export default AlertForm;
