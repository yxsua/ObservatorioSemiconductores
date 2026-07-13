import { useState } from "react";

function ConversationPanel({
  messages = [],
  onSubmit,
  placeholder = "Escribe un comentario...",
}) {
  const [message, setMessage] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanMessage = message.trim();
    if (!cleanMessage) return;

    onSubmit?.(cleanMessage);
    setMessage("");
  };

  return (
    <section className="conversation-panel">
      <div className="conversation-list">
        {messages.length === 0 ? (
          <p className="conversation-empty">Sin comentarios</p>
        ) : (
          messages.map((item, index) => (
            <article className="conversation-item" key={item.id ?? index}>
              <header>
                <strong>{item.author ?? item.user ?? "Usuario"}</strong>
                {item.date && <small>{item.date}</small>}
              </header>

              <p>{item.message ?? item.text}</p>
            </article>
          ))
        )}
      </div>

      <form className="conversation-form" onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={placeholder}
          rows={4}
        />

        <button type="submit">Enviar</button>
      </form>
    </section>
  );
}

export default ConversationPanel;
