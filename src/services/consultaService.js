import { api } from "./api";

export function buscarDashboard(signal) {
  return api.get("/dashboard", signal);
}

// URLSearchParams monta a "query string": { a: 1, b: "S" } -> "a=1&b=S"
export function relatorioMinisterios({ ministerioId, membros, lideres }, signal) {
  const parametros = new URLSearchParams({
    ministerioId: ministerioId || "",
    membros: membros ? "S" : "N",
    lideres: lideres ? "S" : "N"
  });
  return api.get(`/relatorios/ministerios?${parametros}`, signal);
}

export function relatorioCargos(sigla, signal) {
  return api.get(`/relatorios/cargos?sigla=${encodeURIComponent(sigla || "")}`, signal);
}

export function relatorioMembros(signal) {
  return api.get("/relatorios/membros-alfabetica", signal);
}
