function Modal({
  isOpen,
  title,
  children,
  onClose,
  footer,
  size = "medium",
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="presentation">
      <section
        className={`modal-window modal-window--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal-header">
          <h2>{title}</h2>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            X
          </button>
        </header>

        <div className="modal-body">{children}</div>

        {footer && <footer className="modal-footer">{footer}</footer>}
      </section>
    </div>
  );
}

export default Modal;
