import { useContext } from "react";
import { AuthContext } from "../contexts/contextos";

// Hook customizado: qualquer componente faz
//   const { usuario, sair, pode } = useAuth();
// em vez de importar o contexto e chamar useContext toda vez.
export function useAuth() {
  return useContext(AuthContext);
}
