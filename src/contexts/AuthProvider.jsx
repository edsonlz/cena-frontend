import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./contextos";
import { lerToken, salvarToken, definirAoExpirarSessao } from "../services/api";
import { entrar, buscarUsuarioLogado } from "../services/authService";

// Guarda quem está logado e oferece entrar() / sair() / pode() para o app todo.
// No GeneXus isso era o WWPContext (UserId, UserName, UserPerfilDescricao, UserAdmin).
function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // Só "verificando" se existe um token salvo para conferir.
  const [verificando, setVerificando] = useState(() => Boolean(lerToken()));

  const sair = useCallback(() => {
    salvarToken(null);
    setUsuario(null);
  }, []);

  // Ao abrir/recarregar a página: se existe token salvo, pergunta para a API
  // quem é o usuário. Se o token venceu, a API responde 401 e caímos no catch.
  useEffect(() => {
    if (!lerToken()) return;

    const controller = new AbortController();
    buscarUsuarioLogado(controller.signal)
      .then(dados => setUsuario(dados))
      .catch(erro => {
        if (erro.name !== "AbortError") sair();
      })
      .finally(() => {
        if (!controller.signal.aborted) setVerificando(false);
      });

    return () => controller.abort();
  }, [sair]);

  // Se qualquer requisição receber 401 (sessão expirada), desloga.
  useEffect(() => {
    definirAoExpirarSessao(() => setUsuario(null));
  }, []);

  const login = useCallback(async (loginInformado, senha) => {
    const resposta = await entrar(loginInformado, senha);
    salvarToken(resposta.token);
    setUsuario(resposta.usuario);
    return resposta.usuario;
  }, []);

  // pode("membrosww") -> true se o perfil tem acesso ao programa
  // (equivale a chamar LiberaAcessoPerfil no GeneXus).
  const pode = useCallback(
    (...codigos) => Boolean(usuario && (usuario.admin || codigos.some(c => usuario.programas.includes(c)))),
    [usuario]
  );

  // useMemo: só cria um objeto novo quando algo muda de verdade,
  // evitando redesenhar todos os componentes que usam o contexto à toa.
  const valor = useMemo(
    () => ({ usuario, verificando, login, sair, pode }),
    [usuario, verificando, login, sair, pode]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
