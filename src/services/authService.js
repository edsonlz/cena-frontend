import { api } from "./api";

// POST /api/auth/login -> { token, usuario }
export function entrar(login, senha) {
  return api.post("/auth/login", { login, senha });
}

// GET /api/auth/eu -> usuário logado (usado ao recarregar a página)
export function buscarUsuarioLogado(signal) {
  return api.get("/auth/eu", signal);
}

export function trocarSenha(senhaAtual, novaSenha, confirmacao) {
  return api.post("/auth/trocar-senha", { senhaAtual, novaSenha, confirmacao });
}
