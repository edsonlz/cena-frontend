import { useState } from "react";
import { Printer, FileText } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useBuscarDados } from "../hooks/useBuscarDados";
import { relatorioMinisterios, relatorioCargos, relatorioMembros } from "../services/consultaService";
import { listarMinisterios } from "../services/ministerioService";
import { cargoService } from "../services/cadastroService";
import Botao from "../components/ui/Botao";
import Campo from "../components/ui/Campo";
import Interruptor from "../components/ui/Interruptor";
import { Aviso, CabecalhoPagina, EstadoVazio, LinhasCarregando } from "../components/ui/Basicos";
import { mascaraTelefone } from "../utils/formatar";

// Junta os três relatórios do GeneXus numa tela só:
//   WPRelMembrosMinisterio -> RelMinistMembros      (aba "Ministérios")
//   WPRelatorioCargos      -> relCargos              (aba "Cargos")
//   RelMembrosOrdemAlfabetica                        (aba "Membros de A a Z")
//
// No GeneXus o relatório só aparecia depois de clicar em "Imprimir" (PDF).
// Aqui a prévia atualiza na hora a cada filtro, e "Imprimir" usa a impressão
// do navegador, que também permite "Salvar como PDF".
function Relatorios() {
  const { pode } = useAuth();

  const abas = [
    pode("wprelmembrosministerio") && { id: "ministerios", titulo: "Ministérios" },
    pode("wprelatoriocargos") && { id: "cargos", titulo: "Cargos" },
    pode("wprelmembrosministerio", "membrosww") && { id: "membros", titulo: "Membros de A a Z" }
  ].filter(Boolean);

  const [aba, setAba] = useState(abas[0]?.id);

  return (
    <>
      <CabecalhoPagina titulo="Relatórios" descricao="Escolha os filtros, confira a prévia e imprima ou salve em PDF.">
        <Botao variante="primario" icone={Printer} onClick={() => window.print()}>Imprimir / salvar PDF</Botao>
      </CabecalhoPagina>

      <div className="abas" role="tablist">
        {abas.map(a => (
          <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} className="abas__aba" onClick={() => setAba(a.id)}>
            {a.titulo}
          </button>
        ))}
      </div>

      {aba === "ministerios" && <RelatorioMinisterios />}
      {aba === "cargos" && <RelatorioCargos />}
      {aba === "membros" && <RelatorioMembros />}
    </>
  );
}

// Folha com cara de papel — é ela que sai na impressão (veja @media print no telas.css).
function Folha({ titulo, subtitulo, carregando, erro, vazio, children }) {
  return (
    <article className="folha">
      <header className="folha__cabecalho">
        <div>
          <span className="folha__marca">CENA · Secretaria</span>
          <h2>{titulo}</h2>
          {subtitulo && <p>{subtitulo}</p>}
        </div>
        <span className="mono suave">{new Date().toLocaleDateString("pt-BR")}</span>
      </header>
      {erro ? <Aviso tipo="perigo">{erro}</Aviso> : carregando ? <LinhasCarregando linhas={5} /> : vazio ? <EstadoVazio icone={FileText} titulo="Nada para mostrar com estes filtros" /> : children}
    </article>
  );
}

function RelatorioMinisterios() {
  const [filtro, setFiltro] = useState({ ministerioId: "", membros: true, lideres: true });
  const { dados: ministerios } = useBuscarDados(listarMinisterios);
  const { dados, carregando, erro } = useBuscarDados(
    signal => relatorioMinisterios(filtro, signal),
    [filtro.ministerioId, filtro.membros, filtro.lideres]
  );

  return (
    <div className="relatorio">
      <div className="relatorio__filtros cartao">
        <Campo id="f-ministerio" rotulo="Ministério">
          <select id="f-ministerio" className="entrada" value={filtro.ministerioId} onChange={e => setFiltro({ ...filtro, ministerioId: e.target.value })}>
            <option value="">Todos os ministérios</option>
            {ministerios?.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </Campo>
        <Interruptor checked={filtro.lideres} onChange={lideres => setFiltro({ ...filtro, lideres })}>Listar líderes</Interruptor>
        <Interruptor checked={filtro.membros} onChange={membros => setFiltro({ ...filtro, membros })}>Listar membros</Interruptor>
      </div>

      <Folha titulo="Ministérios" subtitulo="Líderes e membros por ministério" carregando={carregando} erro={erro} vazio={dados?.length === 0}>
        {dados?.map(m => (
          <section key={m.id} className="folha__secao">
            <h3>{m.nome}</h3>
            {m.lideres && <ListaPessoas titulo="Líderes" pessoas={m.lideres} />}
            {m.membros && <ListaPessoas titulo="Membros" pessoas={m.membros} />}
          </section>
        ))}
      </Folha>
    </div>
  );
}

function ListaPessoas({ titulo, pessoas }) {
  return (
    <table className="folha__tabela">
      <thead>
        <tr><th>{titulo} <span className="mono">({pessoas.length})</span></th><th>Celular</th></tr>
      </thead>
      <tbody>
        {pessoas.length === 0 ? (
          <tr><td colSpan={2} className="suave">Nenhum</td></tr>
        ) : (
          pessoas.map((p, i) => (
            <tr key={i}><td>{p.nome}</td><td className="mono">{mascaraTelefone(p.celular)}</td></tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function RelatorioCargos() {
  const [sigla, setSigla] = useState("");
  const { dados: cargos } = useBuscarDados(cargoService.listar);
  const { dados, carregando, erro } = useBuscarDados(signal => relatorioCargos(sigla, signal), [sigla]);

  // Agrupa as linhas por cargo: { "Diácono": [...], "Pastor": [...] }
  const grupos = (dados ?? []).reduce((acc, linha) => {
    (acc[linha.cargo] ??= []).push(linha);
    return acc;
  }, {});

  return (
    <div className="relatorio">
      <div className="relatorio__filtros cartao">
        <Campo id="f-cargo" rotulo="Cargo">
          <select id="f-cargo" className="entrada" value={sigla} onChange={e => setSigla(e.target.value)}>
            <option value="">Todos os cargos</option>
            {cargos?.map(c => <option key={c.sigla} value={c.sigla}>{c.descricao}</option>)}
          </select>
        </Campo>
      </div>

      <Folha titulo="Membros por cargo" carregando={carregando} erro={erro} vazio={dados?.length === 0}>
        {Object.entries(grupos).map(([cargo, pessoas]) => (
          <section key={cargo} className="folha__secao">
            <h3>{cargo}</h3>
            <ListaPessoas titulo="Membros" pessoas={pessoas} />
          </section>
        ))}
      </Folha>
    </div>
  );
}

function RelatorioMembros() {
  const { dados, carregando, erro } = useBuscarDados(relatorioMembros);

  return (
    <div className="relatorio relatorio--sem-filtro">
      <Folha titulo="Membros de A a Z" subtitulo="Membros que participam de ministérios, com o ministério de cada um" carregando={carregando} erro={erro} vazio={dados?.length === 0}>
        <table className="folha__tabela">
          <thead><tr><th>Membro</th><th>Ministério</th></tr></thead>
          <tbody>
            {dados?.map((l, i) => (
              <tr key={i}><td>{l.nome}</td><td>{l.ministerio}</td></tr>
            ))}
          </tbody>
        </table>
      </Folha>
    </div>
  );
}

export default Relatorios;
