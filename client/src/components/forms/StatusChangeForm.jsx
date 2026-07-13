import { useState } from "react";
import FormActions from "./FormActions";
import { resolveOptionLabel, resolveOptionValue } from "./formHelpers";

function StatusChangeForm({
  statuses = [],
  validators = [],
  defaultStatus = "",
  onSubmit,
  onCancel,
  isSubmitting = false,
}) {
  const [form, setForm] = useState({
    status_code: defaultStatus,
    validator_id: "",
    notes: "",
  });

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
        Estado
        <select name="status_code" value={form.status_code} onChange={handleChange} required>
          <option value="">Seleccione...</option>
          {statuses.map((option) => (
            <option key={resolveOptionValue(option, "code")} value={resolveOptionValue(option, "code")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Validador
        <select name="validator_id" value={form.validator_id} onChange={handleChange}>
          <option value="">Sin validador</option>
          {validators.map((option) => (
            <option key={resolveOptionValue(option, "id_user")} value={resolveOptionValue(option, "id_user")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Notas
        <textarea name="notes" value={form.notes} onChange={handleChange} rows={4} />
      </label>

      <FormActions submitLabel="Actualizar estado" onCancel={onCancel} isSubmitting={isSubmitting} />
    </form>
  );
}

export default StatusChangeForm;
