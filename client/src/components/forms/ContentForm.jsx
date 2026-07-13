import { useEffect, useState } from "react";
import FormActions from "./FormActions";
import { normalizeSelectValue, resolveOptionLabel, resolveOptionValue } from "./formHelpers";

const initialState = {
  content_type_code: "",
  status_code: "DRAFT",
  author_id: "",
  title: "",
  summary: "",
  slug: "",
  featured_media_id: "",
};

function ContentForm({
  initialData = null,
  contentTypes = [],
  statuses = [],
  authors = [],
  media = [],
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
      content_type_code: normalizeSelectValue(initialData.content_type_code),
      status_code: initialData.status_code ?? "DRAFT",
      author_id: normalizeSelectValue(initialData.author_id),
      title: initialData.title ?? "",
      summary: initialData.summary ?? "",
      slug: initialData.slug ?? "",
      featured_media_id: normalizeSelectValue(initialData.featured_media_id),
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
        Tipo de contenido
        <select name="content_type_code" value={form.content_type_code} onChange={handleChange} required>
          <option value="">Seleccione...</option>
          {contentTypes.map((option) => (
            <option key={resolveOptionValue(option, "code")} value={resolveOptionValue(option, "code")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Estado
        <select name="status_code" value={form.status_code} onChange={handleChange} required>
          {statuses.length === 0 && <option value="DRAFT">Borrador</option>}
          {statuses.map((option) => (
            <option key={resolveOptionValue(option, "code")} value={resolveOptionValue(option, "code")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Autor
        <select name="author_id" value={form.author_id} onChange={handleChange} required>
          <option value="">Seleccione...</option>
          {authors.map((option) => (
            <option key={resolveOptionValue(option, "id_user")} value={resolveOptionValue(option, "id_user")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Titulo
        <input name="title" value={form.title} onChange={handleChange} required />
      </label>

      <label>
        Slug
        <input name="slug" value={form.slug} onChange={handleChange} />
      </label>

      <label>
        Resumen
        <textarea name="summary" value={form.summary} onChange={handleChange} rows={4} />
      </label>

      <label>
        Imagen o archivo destacado
        <select name="featured_media_id" value={form.featured_media_id} onChange={handleChange}>
          <option value="">Sin recurso destacado</option>
          {media.map((option) => (
            <option key={resolveOptionValue(option, "id_media")} value={resolveOptionValue(option, "id_media")}>
              {resolveOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />
    </form>
  );
}

export default ContentForm;
