import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import Botao from "./Botao";
import { normalizar } from "../../utils/formatar";

// Tabela reutilizável com ordenação por coluna e paginação.
// Substitui o "Grid + DDO + PaginationBar" do WorkWithPlus.
//
// colunas: lista de objetos que descrevem cada coluna:
//   { id: "nome", titulo: "Nome", valor: linha => linha.nome, render: linha => <b>{linha.nome}</b> }
//   - valor:  usado para ORDENAR (se não tiver, a coluna não é ordenável)
//   - render: o que aparece na célula (se não tiver, mostra o valor)
// linhas: os dados
// chave:  função que devolve o identificador único da linha (para a "key" do React)
function Tabela({ colunas, linhas, chave, aoClicarLinha, porPagina = 20, ordemInicial }) {
  const [ordem, setOrdem] = useState(ordemInicial ?? { coluna: null, crescente: true });
  const [pagina, setPagina] = useState(1);

  // ---- Ordenação ----
  const colunaOrdem = colunas.find(c => c.id === ordem.coluna);
  const ordenadas = colunaOrdem?.valor
    ? [...linhas].sort((a, b) => {
        const va = colunaOrdem.valor(a);
        const vb = colunaOrdem.valor(b);
        const comparacao =
          typeof va === "number" && typeof vb === "number"
            ? va - vb
            : normalizar(va).localeCompare(normalizar(vb), "pt-BR");
        return ordem.crescente ? comparacao : -comparacao;
      })
    : linhas;

  // ---- Paginação ----
  const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / porPagina));
  // Se um filtro reduziu a lista, a página atual pode não existir mais.
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * porPagina;
  const visiveis = ordenadas.slice(inicio, inicio + porPagina);

  function alternarOrdem(id) {
    setOrdem(atual => ({ coluna: id, crescente: atual.coluna === id ? !atual.crescente : true }));
  }

  return (
    <>
      <div className="tabela-container">
        <table className="tabela">
          <thead>
            <tr>
              {colunas.map(coluna => (
                <th
                  key={coluna.id}
                  className={coluna.classe}
                  aria-sort={ordem.coluna === coluna.id ? (ordem.crescente ? "ascending" : "descending") : undefined}
                >
                  {coluna.valor ? (
                    <button type="button" onClick={() => alternarOrdem(coluna.id)}>
                      {coluna.titulo}
                      {ordem.coluna === coluna.id && (ordem.crescente ? <ArrowUp /> : <ArrowDown />)}
                    </button>
                  ) : (
                    coluna.titulo
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.map(linha => (
              <tr
                key={chave(linha)}
                className={aoClicarLinha ? "clicavel" : undefined}
                onClick={aoClicarLinha ? () => aoClicarLinha(linha) : undefined}
              >
                {colunas.map(coluna => (
                  <td key={coluna.id} className={coluna.classe}>
                    {coluna.render ? coluna.render(linha) : coluna.valor?.(linha)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ordenadas.length > porPagina && (
        <div className="paginacao">
          <span>
            <span className="mono">{inicio + 1}–{Math.min(inicio + porPagina, ordenadas.length)}</span> de{" "}
            <span className="mono">{ordenadas.length}</span>
          </span>
          <div className="paginacao__botoes">
            <Botao pequeno icone={ChevronLeft} aria-label="Página anterior" disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)} />
            <Botao pequeno icone={ChevronRight} aria-label="Próxima página" disabled={paginaAtual === totalPaginas} onClick={() => setPagina(paginaAtual + 1)} />
          </div>
        </div>
      )}
    </>
  );
}

export default Tabela;
