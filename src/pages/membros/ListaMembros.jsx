import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Search, UserPlus, Users, Crown, X } from "lucide-react";
import { useBuscarDados } from "../../hooks/useBuscarDados";
import { listarMembros } from "../../services/membroService";
import { listarMinisterios } from "../../services/ministerioService";
import { cargoService } from "../../services/cadastroService";
import Tabela from "../../components/ui/Tabela";
import Botao from "../../components/ui/Botao";
import { Avatar, CabecalhoPagina, EstadoVazio, LinhasCarregando, Aviso } from "../../components/ui/Basicos";
import { mascaraTelefone, mascaraCpf, normalizar, somenteDigitos } from "../../utils/formatar";

// MembrosWW do GeneXus: a lista de membros.
// Novidades: os ministérios de cada pessoa aparecem na própria linha,
// e há filtros por ministério/cargo (inclusive "sem ministério").
function ListaMembros() {
  const navegar = useNavigate();

  // Os filtros ficam na URL (?busca=ana&ministerio=2). Vantagens:
  // ao abrir um membro e voltar, os filtros continuam; e dá para mandar o link.
  const [parametros, setParametros] = useSearchParams();
  const busca = parametros.get("busca") ?? "";
  const ministerio = parametros.get("ministerio") ?? (parametros.get("filtro") === "sem-ministerio" ? "nenhum" : "");
  const cargo = parametros.get("cargo") ?? "";

  const { dados: membros, carregando, erro } = useBuscarDados(listarMembros);
  const { dados: ministerios } = useBuscarDados(listarMinisterios);
  const { dados: cargos } = useBuscarDados(cargoService.listar);

  function alterarFiltro(nome, valor) {
    const novos = new URLSearchParams(parametros);
    novos.delete("filtro");
    if (valor) novos.set(nome, valor);
    else novos.delete(nome);
    setParametros(novos, { replace: true });
  }

  // Busca "texto livre" igual ao &FilterFullText do GeneXus:
  // procura em nome, celular, e-mail, CPF, bairro e cidade.
  const termo = normalizar(busca.trim());
  const termoDigitos = somenteDigitos(busca);
  const filtrados = (membros ?? []).filter(m => {
    if (termo) {
      const texto = normalizar([m.nome, m.email, m.bairro, m.cidade].join(" "));
      const numeros = `${m.cpf ?? ""} ${m.celular ?? ""}`;
      if (!texto.includes(termo) && !(termoDigitos.length >= 3 && numeros.includes(termoDigitos))) return false;
    }
    if (ministerio === "nenhum" && m.ministerios.length > 0) return false;
    if (ministerio && ministerio !== "nenhum" && !m.ministerios.some(mi => String(mi.id) === ministerio)) return false;
    if (cargo && m.cargoSigla !== cargo) return false;
    return true;
  });

  const temFiltro = Boolean(busca || ministerio || cargo);

  const colunas = [
    {
      id: "nome",
      titulo: "Membro",
      valor: m => m.nome,
      render: m => (
        <div className="celula-pessoa">
          <Avatar nome={m.nome} />
          <div>
            {/* Link de verdade: permite abrir com o teclado (Tab + Enter) e em nova aba */}
            <strong><Link to={`/membros/${m.codigo}`} className="link-discreto">{m.nome}</Link></strong>
            <span className="mono">{mascaraCpf(m.cpf)}</span>
          </div>
        </div>
      )
    },
    {
      id: "contato",
      titulo: "Contato",
      render: m => (
        <div className="celula-contato">
          {m.celular && <span className="mono">{mascaraTelefone(m.celular)}</span>}
          {m.email && <span className="suave">{m.email}</span>}
          {!m.celular && !m.email && <span className="suave">—</span>}
        </div>
      )
    },
    { id: "cidade", titulo: "Cidade", valor: m => (m.cidade ? `${m.cidade}${m.uf ? ` / ${m.uf}` : ""}` : "") },
    { id: "cargo", titulo: "Cargo", valor: m => m.cargoDescricao ?? "" },
    {
      id: "ministerios",
      titulo: "Ministérios",
      render: m =>
        m.ministerios.length === 0 ? (
          <span className="etiqueta etiqueta--alerta">Nenhum</span>
        ) : (
          <div className="etiquetas">
            {m.ministerios.map(mi => (
              <span key={mi.id} className={`etiqueta ${mi.lider ? "etiqueta--primaria" : ""}`} title={mi.lider ? `Líder de ${mi.nome}` : `Membro de ${mi.nome}`}>
                {mi.lider && <Crown aria-label="Líder" />}
                {mi.nome}
              </span>
            ))}
          </div>
        )
    }
  ];

  return (
    <>
      <CabecalhoPagina titulo="Membros" descricao="Fichas cadastrais e participação nos ministérios.">
        <Link to="/membros/novo" className="botao botao--primario">
          <UserPlus aria-hidden="true" /> Novo membro
        </Link>
      </CabecalhoPagina>

      {erro && <Aviso tipo="perigo">{erro}</Aviso>}

      <section className="cartao">
        <div className="barra-ferramentas">
          <div className="busca">
            <Search aria-hidden="true" />
            <input
              className="entrada"
              type="search"
              placeholder="Buscar por nome, CPF, celular, cidade…"
              aria-label="Buscar membros"
              value={busca}
              onChange={e => alterarFiltro("busca", e.target.value)}
            />
          </div>

          <select className="entrada" aria-label="Filtrar por ministério" value={ministerio} onChange={e => alterarFiltro("ministerio", e.target.value)}>
            <option value="">Todos os ministérios</option>
            <option value="nenhum">Sem nenhum ministério</option>
            {ministerios?.map(mi => (
              <option key={mi.id} value={mi.id}>{mi.nome}</option>
            ))}
          </select>

          <select className="entrada" aria-label="Filtrar por cargo" value={cargo} onChange={e => alterarFiltro("cargo", e.target.value)}>
            <option value="">Todos os cargos</option>
            {cargos?.map(c => (
              <option key={c.sigla} value={c.sigla}>{c.descricao}</option>
            ))}
          </select>

          {temFiltro && (
            <Botao pequeno variante="fantasma" icone={X} onClick={() => setParametros({}, { replace: true })}>
              Limpar filtros
            </Botao>
          )}

          {membros && (
            <span className="barra-ferramentas__info">
              <span className="mono">{filtrados.length}</span> de <span className="mono">{membros.length}</span>
            </span>
          )}
        </div>

        {carregando ? (
          <LinhasCarregando />
        ) : membros?.length === 0 ? (
          <EstadoVazio icone={Users} titulo="Nenhum membro cadastrado" texto="Comece cadastrando o primeiro membro da igreja.">
            <Link to="/membros/novo" className="botao botao--primario"><UserPlus aria-hidden="true" /> Cadastrar membro</Link>
          </EstadoVazio>
        ) : filtrados.length === 0 ? (
          <EstadoVazio icone={Search} titulo="Nenhum membro encontrado" texto="Tente outro termo de busca ou limpe os filtros.">
            <Botao onClick={() => setParametros({}, { replace: true })}>Limpar filtros</Botao>
          </EstadoVazio>
        ) : (
          <Tabela
            colunas={colunas}
            linhas={filtrados}
            chave={m => m.codigo}
            ordemInicial={{ coluna: "nome", crescente: true }}
            aoClicarLinha={m => navegar(`/membros/${m.codigo}`)}
          />
        )}
      </section>
    </>
  );
}

export default ListaMembros;
