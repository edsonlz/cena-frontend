import { useState } from "react";
import { Plus, ShieldCheck, Save, Trash2, Users } from "lucide-react";
import { useBuscarDados } from "../../hooks/useBuscarDados";
import { useToast } from "../../hooks/useToast";
import { perfilService, programaService } from "../../services/cadastroService";
import Botao from "../../components/ui/Botao";
import Campo from "../../components/ui/Campo";
import Interruptor from "../../components/ui/Interruptor";
import { Modal, Confirmacao } from "../../components/ui/Sobreposicao";
import { Aviso, CabecalhoPagina, EstadoVazio, LinhasCarregando } from "../../components/ui/Basicos";

// PerfilWW + Transaction Perfil + PerfilLiberacaoAcessoAssociation do GeneXus.
//
// Antes: abrir o perfil, ir na aba de liberações, abrir a tela de associação,
// mover programas de uma lista para outra, confirmar.
// Agora: escolher o perfil à esquerda e ligar/desligar cada programa à direita.
function Perfis() {
  const toast = useToast();
  const { dados: perfis, setDados: setPerfis, carregando, erro } = useBuscarDados(perfilService.listar);
  const { dados: programas } = useBuscarDados(programaService.listar);

  const [selecionado, setSelecionado] = useState(null); // descrição do perfil aberto
  const [criando, setCriando] = useState(false);

  // Se nada foi escolhido ainda, abre o primeiro da lista.
  const atual = perfis?.find(p => p.descricao === selecionado) ?? perfis?.[0];

  function aoSalvar(perfilAtualizado) {
    setPerfis(lista => lista.map(p => (p.descricao === perfilAtualizado.descricao ? { ...p, ...perfilAtualizado } : p)));
  }

  function aoCriar(novo) {
    setPerfis(lista => [...lista, novo].sort((a, b) => a.descricao.localeCompare(b.descricao)));
    setSelecionado(novo.descricao);
    setCriando(false);
    toast.sucesso(`Perfil ${novo.descricao} criado. Agora escolha o que ele pode acessar.`);
  }

  function aoExcluir(descricao) {
    setPerfis(lista => lista.filter(p => p.descricao !== descricao));
    setSelecionado(null);
  }

  return (
    <>
      <CabecalhoPagina titulo="Perfis de acesso" descricao="Defina o que cada grupo de usuários pode abrir no sistema.">
        <Botao variante="primario" icone={Plus} onClick={() => setCriando(true)}>Novo perfil</Botao>
      </CabecalhoPagina>

      {erro && <Aviso tipo="perigo">{erro}</Aviso>}

      {carregando ? (
        <div className="cartao"><LinhasCarregando linhas={4} /></div>
      ) : perfis?.length === 0 ? (
        <div className="cartao">
          <EstadoVazio icone={ShieldCheck} titulo="Nenhum perfil cadastrado">
            <Botao variante="primario" icone={Plus} onClick={() => setCriando(true)}>Criar perfil</Botao>
          </EstadoVazio>
        </div>
      ) : (
        <div className="mestre-detalhe">
          <nav className="cartao mestre" aria-label="Perfis">
            {perfis.map(p => (
              <button
                key={p.descricao}
                type="button"
                className="mestre__item"
                aria-current={p.descricao === atual?.descricao ? "true" : undefined}
                onClick={() => setSelecionado(p.descricao)}
              >
                <strong>{p.descricao}</strong>
                <span>
                  <Users size={13} aria-hidden="true" /> <span className="mono">{p.totalUsuarios ?? 0}</span>
                  {" · "}
                  <span className="mono">{p.programas.length}</span> {p.programas.length === 1 ? "acesso" : "acessos"}
                </span>
              </button>
            ))}
          </nav>

          {/* key: quando troca o perfil, o React cria o painel do zero (zera o formulário) */}
          {atual && (
            <PainelPerfil key={atual.descricao} perfil={atual} programas={programas ?? []} aoSalvar={aoSalvar} aoExcluir={aoExcluir} />
          )}
        </div>
      )}

      <NovoPerfil aberto={criando} aoFechar={() => setCriando(false)} aoCriar={aoCriar} />
    </>
  );
}

function PainelPerfil({ perfil, programas, aoSalvar, aoExcluir }) {
  const toast = useToast();
  // Set com os códigos liberados — fácil de ligar/desligar um item.
  const [liberados, setLiberados] = useState(() => new Set(perfil.programas));
  const [periodo, setPeriodo] = useState(perfil.periodoTrocaSenha ?? "");
  const [salvando, setSalvando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const alterado =
    String(periodo) !== String(perfil.periodoTrocaSenha ?? "") ||
    liberados.size !== perfil.programas.length ||
    perfil.programas.some(c => !liberados.has(c));

  function alternar(codigo, ligado) {
    // Cria um Set NOVO: o React só percebe a mudança se o objeto for outro.
    const novo = new Set(liberados);
    if (ligado) novo.add(codigo);
    else novo.delete(codigo);
    setLiberados(novo);
  }

  async function salvar() {
    try {
      setSalvando(true);
      const atualizado = await perfilService.atualizar(perfil.descricao, {
        periodoTrocaSenha: periodo,
        programas: [...liberados]
      });
      aoSalvar(atualizado);
      toast.sucesso("Acessos do perfil salvos.");
    } catch (e) {
      toast.erro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    try {
      setExcluindo(true);
      await perfilService.excluir(perfil.descricao);
      toast.sucesso("Perfil excluído.");
      aoExcluir(perfil.descricao);
    } catch (e) {
      toast.erro(e.message);
      setExcluindo(false);
      setConfirmando(false);
    }
  }

  return (
    <section className="cartao detalhe">
      <div className="cartao__cabecalho">
        <div>
          <h2>{perfil.descricao}</h2>
          <p>{perfil.totalUsuarios ?? 0} usuário(s) com este perfil. Administradores acessam tudo, independentemente do perfil.</p>
        </div>
        <Botao pequeno variante="perigo-suave" icone={Trash2} onClick={() => setConfirmando(true)}>Excluir</Botao>
      </div>

      <div className="cartao__corpo" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Campo id="periodo" rotulo="Período de troca de senha" dica="Em dias. Deixe vazio se não houver prazo." className="campo--curto">
          <input id="periodo" className="entrada mono" type="number" min="0" max="9999" value={periodo} onChange={e => setPeriodo(e.target.value)} />
        </Campo>

        <div>
          <div className="lista-acessos__topo">
            <h3>O que este perfil pode acessar</h3>
            <div style={{ display: "flex", gap: 4 }}>
              <Botao pequeno variante="fantasma" onClick={() => setLiberados(new Set(programas.map(p => p.codigo)))}>Liberar todos</Botao>
              <Botao pequeno variante="fantasma" onClick={() => setLiberados(new Set())}>Nenhum</Botao>
            </div>
          </div>
          <ul className="lista-acessos">
            {programas.map(p => (
              <li key={p.codigo}>
                <Interruptor checked={liberados.has(p.codigo)} onChange={ligado => alternar(p.codigo, ligado)}>
                  {p.descricao}
                </Interruptor>
                <span className="mono suave">{p.codigo}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="gaveta__rodape" style={{ borderRadius: "0 0 var(--raio) var(--raio)" }}>
        <span className="suave" style={{ fontSize: "0.8125rem" }}>{alterado ? "Há alterações não salvas." : "Tudo salvo."}</span>
        <span className="espaco" />
        <Botao variante="primario" icone={Save} carregando={salvando} disabled={!alterado} onClick={salvar}>Salvar acessos</Botao>
      </div>

      <Confirmacao
        aberto={confirmando}
        titulo={`Excluir o perfil ${perfil.descricao}?`}
        mensagem="Perfis com usuários vinculados não podem ser excluídos: troque o perfil desses usuários antes."
        textoConfirmar="Excluir perfil"
        processando={excluindo}
        aoConfirmar={excluir}
        aoCancelar={() => setConfirmando(false)}
      />
    </section>
  );
}

function NovoPerfil({ aberto, aoFechar, aoCriar }) {
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function fechar() {
    setDescricao("");
    setErro("");
    aoFechar();
  }

  async function criar(e) {
    e.preventDefault();
    if (!descricao.trim()) return setErro("Informe o nome do perfil.");
    try {
      setSalvando(true);
      const novo = await perfilService.cadastrar({ descricao, programas: [] });
      setDescricao("");
      setErro("");
      aoCriar(novo);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal aberto={aberto} titulo="Novo perfil de acesso" aoFechar={fechar}>
      <form onSubmit={criar} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Campo id="nome-perfil" rotulo="Nome do perfil" obrigatorio erro={erro} dica="Ex.: Secretaria, Tesouraria, Pastoral. Não pode ser alterado depois.">
          <input id="nome-perfil" className="entrada" maxLength={100} value={descricao} onChange={e => setDescricao(e.target.value)} />
        </Campo>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Botao onClick={fechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={salvando}>Criar perfil</Botao>
        </div>
      </form>
    </Modal>
  );
}

export default Perfis;
