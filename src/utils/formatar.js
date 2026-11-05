// Máscaras e formatações. Equivalem aos WWPActions.Mask_Apply do GeneXus
// ("000.000.000-00", "(99)9999-9999", "(99)99999-9999").
// O banco guarda só os números; a máscara existe apenas na tela.

export function somenteDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

// Aplica a máscara enquanto a pessoa digita: "39053344705" -> "390.533.447-05"
export function mascaraCpf(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

// Celular (11 dígitos) ou fixo (10 dígitos).
export function mascaraTelefone(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function mascaraCep(valor) {
  const d = somenteDigitos(valor).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

// "1990-11-12" -> "12/11/1990" (sem passar por new Date, para não ter erro de fuso).
export function formatarData(texto) {
  if (!texto) return "";
  const [ano, mes, dia] = texto.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export function idade(texto) {
  if (!texto) return null;
  const [ano, mes, dia] = texto.slice(0, 10).split("-").map(Number);
  const hoje = new Date();
  let anos = hoje.getFullYear() - ano;
  if (hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)) anos--;
  return anos;
}

// "Ana Beatriz Souza" -> "AS"
export function iniciais(nome) {
  const partes = String(nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

// Busca sem diferenciar maiúsculas nem acentos: "jose" encontra "José".
export function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Validação dos dígitos verificadores do CPF (só para AVISAR na tela;
// o GeneXus não validava, então não bloqueamos o cadastro por isso).
export function cpfValido(valor) {
  const d = somenteDigitos(valor);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = fim => {
    let soma = 0;
    for (let i = 0; i < fim; i++) soma += Number(d[i]) * (fim + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

export const NOMES_MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];
