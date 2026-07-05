import React from "react";
import ReactDOM from "react-dom/client";
import { useEffect, useState } from "react";

function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then(setHealth)
      .catch(console.error);
  }, []);

  return (
    <div className="card">
      <h1>Frontend funcionando</h1>

      <pre>{JSON.stringify(health, null, 2)}</pre>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
