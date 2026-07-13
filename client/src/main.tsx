import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppProviders } from "./app/providers/AppProviders";
import "./styles/tokens.css";
import "./styles/global.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("No se encontró el elemento raíz de la aplicación.");
}

createRoot(root).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>
);
