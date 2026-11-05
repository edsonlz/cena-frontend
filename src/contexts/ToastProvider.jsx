import { useCallback, useMemo, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { ToastContext } from "./contextos";

// Notificações rápidas no canto da tela ("Membro salvo.", erros etc.).
// Substituem o msg() do GeneXus sem travar a tela.
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const proximoId = useRef(1); // useRef guarda um valor sem redesenhar a tela

  const fechar = useCallback(id => {
    setToasts(lista => lista.filter(t => t.id !== id));
  }, []);

  const mostrar = useCallback(
    (tipo, mensagem) => {
      const id = proximoId.current++;
      setToasts(lista => [...lista, { id, tipo, mensagem }]);
      // Sucesso some em 4s; erro fica 7s (mais tempo para ler).
      setTimeout(() => fechar(id), tipo === "erro" ? 7000 : 4000);
    },
    [fechar]
  );

  const valor = useMemo(
    () => ({
      sucesso: mensagem => mostrar("sucesso", mensagem),
      erro: mensagem => mostrar("erro", mensagem)
    }),
    [mostrar]
  );

  return (
    <ToastContext.Provider value={valor}>
      {children}

      {/* aria-live: leitores de tela anunciam as mensagens novas */}
      <div className="toasts" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.tipo}`} role={t.tipo === "erro" ? "alert" : "status"}>
            {t.tipo === "erro" ? <AlertCircle /> : <CheckCircle2 />}
            <p>{t.mensagem}</p>
            <button type="button" onClick={() => fechar(t.id)} aria-label="Fechar aviso">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
