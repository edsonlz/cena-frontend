import { useContext } from "react";
import { ToastContext } from "../contexts/contextos";

// Uso: const toast = useToast();  toast.sucesso("Salvo.");  toast.erro("Falhou.");
export function useToast() {
  return useContext(ToastContext);
}
