import { Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { EstadoVazio } from "../ui/Basicos";

// Envolve as rotas que exigem login (e, opcionalmente, um programa liberado).
//
//   <RotaProtegida>                     -> só precisa estar logado
//   <RotaProtegida programas={["membrosww"]}>  -> precisa ter acesso a Membros
//
// No GeneXus cada tela chamava LiberaAcessoPerfil e, sem acesso, ia para
// WPAcessoNaoAutorizado. Aqui mostramos o aviso no próprio lugar da página.
function RotaProtegida({ programas, children }) {
  const { usuario, verificando, pode } = useAuth();
  const local = useLocation();

  // Ainda conferindo o token salvo: não decide nada por enquanto.
  if (verificando) return null;

  // Não logado: vai para o login lembrando de onde veio (state.de),
  // para voltar para a mesma página depois de entrar.
  if (!usuario) return <Navigate to="/login" replace state={{ de: local.pathname }} />;

  if (programas && !pode(...programas)) {
    return (
      <EstadoVazio
        icone={ShieldAlert}
        titulo="Sem acesso a esta área"
        texto="Seu perfil não tem permissão para abrir esta página. Se precisar dela, peça a liberação ao administrador."
      />
    );
  }

  return children;
}

export default RotaProtegida;
