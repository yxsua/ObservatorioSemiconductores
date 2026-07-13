function FormActions({
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  onCancel,
  isSubmitting = false,
}) {
  return (
    <div className="form-actions">
      {onCancel && (
        <button type="button" className="button button--secondary" onClick={onCancel}>
          {cancelLabel}
        </button>
      )}

      <button type="submit" className="button button--primary" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : submitLabel}
      </button>
    </div>
  );
}

export default FormActions;
