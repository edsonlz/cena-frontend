// Ponto de entrada do front-end (igual ao treinamento-react),
// agora com três "envoltórios" em volta do App:
//   BrowserRouter -> permite ter várias páginas com URLs (/membros, /usuarios...)
//   AuthProvider  -> disponibiliza o usuário logado para todo o app
//   ToastProvider -> disponibiliza as notificações ("Membro salvo.")
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/componentes.css";
import "./styles/layout.css";
import "./styles/telas.css";
import App from "./App.jsx";
import AuthProvider from "./contexts/AuthProvider.jsx";
import ToastProvider from "./contexts/ToastProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
