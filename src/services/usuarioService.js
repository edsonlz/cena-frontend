import { api } from "./api";

export function listarUsuarios(signal) {
  return api.get("/usuarios", signal);
}

export function cadastrarUsuario(dados) {
  return api.post("/usuarios", dados);
}

export function atualizarUsuario(id, dados) {
  return api.put(`/usuarios/${id}`, dados);
}

export function excluirUsuario(id) {
  return api.delete(`/usuarios/${id}`);
}

export function redefinirSenha(id, novaSenha) {
  return api.post(`/usuarios/${id}/redefinir-senha`, { novaSenha });
}
