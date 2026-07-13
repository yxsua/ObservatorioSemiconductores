import { useEffect, useState } from "react";
import FormActions from "./FormActions";

const initialState = {
  first_name: "",
  last_name: "",
  email: "",
  occupation: "",
  password_hash: "",
};

function UserForm({
  initialData = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
  requirePassword = true,
}) {
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (!initialData) {
      setForm(initialState);
      return;
    }

    setForm({
      first_name: initialData.first_name ?? "",
      last_name: initialData.last_name ?? "",
      email: initialData.email ?? "",
      occupation: initialData.occupation ?? "",
      password_hash: "",
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
        Nombre
        <input name="first_name" value={form.first_name} onChange={handleChange} required />
      </label>

      <label>
        Apellido
        <input name="last_name" value={form.last_name} onChange={handleChange} required />
      </label>

      <label>
        Correo
        <input name="email" type="email" value={form.email} onChange={handleChange} required />
      </label>

      <label>
        Ocupacion
        <input name="occupation" value={form.occupation} onChange={handleChange} />
      </label>

      <label>
        Password hash
        <input
          name="password_hash"
          value={form.password_hash}
          onChange={handleChange}
          required={requirePassword}
        />
      </label>

      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />
    </form>
  );
}

export default UserForm;
