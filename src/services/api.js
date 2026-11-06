// Base de toda a comunicação com o back-end.
//
// É a evolução da função "requisicao" do carregamentoService.js do
// treinamento-react. A diferença principal: agora toda requisição leva
// o token JWT no cabeçalho Authorization, porque a API exige login.

const CHAVE_TOKEN = "cena-token";

// ---- Guarda do token ----
// localStorage mantém o token mesmo se a página for recarregada.
// O try/catch evita erro em navegadores com armazenamento bloqueado.
export function lerToken() {
  try {
    return localStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

export function salvarToken(token) {
  try {
    if (token) localStorage.setItem(CHAVE_TOKEN, token);
    else localStorage.removeItem(CHAVE_TOKEN);
  } catch {
    // sem armazenamento disponível: o login vale só até recarregar a página
  }
}

// Quem quiser saber quando a sessão expirou (o AuthContext) se inscreve aqui.
let aoExpirarSessao = () => {};
export function definirAoExpirarSessao(funcao) {
  aoExpirarSessao = funcao;
}

// Endereço da API.
//   - Em desenvolvimento (npm run dev) fica vazio: o proxy do Vite encaminha /api.
//   - No build de produção vem do arquivo .env.production (VITE_API_URL).
const API_URL = import.meta.env.VITE_API_URL || "";

// Função central: faz o fetch, coloca o token, trata erro e converte o JSON.
//   caminho -> ex.: "/membros" (o "/api" é colocado aqui)
//   opcoes  -> { method, body, signal }. body pode ser um objeto: viramos JSON aqui.
export async function requisicao(caminho, opcoes = {}) {
  const { body, ...resto } = opcoes;
  const token = lerToken();

  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${API_URL}/api${caminho}`, {
      ...resto,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch (erro) {
    // Cancelamento pelo AbortController: repassa como está.
    if (erro.name === "AbortError") throw erro;
    // "cause" guarda o erro original, útil para investigar no console.
    throw new Error("Não foi possível falar com o servidor. Verifique se a API está rodando.", { cause: erro });
  }

  // 401 = não autenticado (token vencido ou inválido): volta para o login.
  if (resposta.status === 401 && token) {
    salvarToken(null);
    aoExpirarSessao();
  }

  if (!resposta.ok) {
    const dadosErro = await resposta.json().catch(() => ({}));
    const erro = new Error(dadosErro.erro || `Erro HTTP ${resposta.status}`);
    erro.status = resposta.status; // útil para tratar 403, 404, 409...
    throw erro;
  }

  // 204 = sucesso sem conteúdo (ex.: exclusão). Não há JSON para ler.
  if (resposta.status === 204) return null;

  return resposta.json();
}

// Atalhos para deixar os services mais legíveis.
export const api = {
  get: (caminho, signal) => requisicao(caminho, { signal }),
  post: (caminho, body) => requisicao(caminho, { method: "POST", body }),
  put: (caminho, body) => requisicao(caminho, { method: "PUT", body }),
  delete: caminho => requisicao(caminho, { method: "DELETE" })
};
