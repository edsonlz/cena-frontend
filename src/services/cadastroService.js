import { api } from "./api";

// Cargos, Programas e Perfis seguem o mesmo formato de API:
//   GET /recurso, POST /recurso, PUT /recurso/:chave, DELETE /recurso/:chave
// Esta função cria as quatro funções para qualquer um deles.
function criarService(recurso) {
  return {
    listar: signal => api.get(`/${recurso}`, signal),
    cadastrar: dados => api.post(`/${recurso}`, dados),
    atualizar: (chave, dados) => api.put(`/${recurso}/${encodeURIComponent(chave)}`, dados),
    excluir: chave => api.delete(`/${recurso}/${encodeURIComponent(chave)}`)
  };
}

export const cargoService = criarService("cargos");
export const programaService = criarService("programas");
export const perfilService = criarService("perfis");
