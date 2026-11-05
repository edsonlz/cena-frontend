import { api } from "./api";

export function listarMembros(signal) {
  return api.get("/membros", signal);
}

export function buscarMembro(codigo, signal) {
  return api.get(`/membros/${codigo}`, signal);
}

// encodeURIComponent protege caracteres especiais na URL.
export function verificarCpf(cpf, codigo = 0) {
  return api.get(`/membros/verificar-cpf?cpf=${encodeURIComponent(cpf)}&codigo=${codigo}`);
}

export function cadastrarMembro(dados) {
  return api.post("/membros", dados);
}

export function atualizarMembro(codigo, dados) {
  return api.put(`/membros/${codigo}`, dados);
}

export function excluirMembro(codigo) {
  return api.delete(`/membros/${codigo}`);
}

// Consulta de CEP (o back-end chama o ViaCEP).
export function buscarCep(cep) {
  return api.get(`/cep/${cep}`);
}
