import { api } from "./api";

export function listarMinisterios(signal) {
  return api.get("/ministerios", signal);
}

export function buscarMinisterio(id, signal) {
  return api.get(`/ministerios/${id}`, signal);
}

export function cadastrarMinisterio(nome) {
  return api.post("/ministerios", { nome });
}

export function atualizarMinisterio(id, nome) {
  return api.put(`/ministerios/${id}`, { nome });
}

export function excluirMinisterio(id) {
  return api.delete(`/ministerios/${id}`);
}

// papel: "membro" ou "lider"
export function adicionarVinculo(ministerioId, membroCodigo, papel) {
  return api.post(`/ministerios/${ministerioId}/vinculos`, { membroCodigo, papel });
}

export function removerVinculo(ministerioId, membroCodigo, papel) {
  return api.delete(`/ministerios/${ministerioId}/vinculos/${papel}/${membroCodigo}`);
}
