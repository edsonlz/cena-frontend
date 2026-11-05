import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Crown, Pencil, Trash2, Users, X, Check } from "lucide-react";
import { useBuscarDados } from "../../hooks/useBuscarDados";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
import {
  buscarMinisterio, atualizarMinisterio, excluirMinisterio, adicionarVinculo, removerVinculo
} from "../../services/ministerioService";
import { listarMembros } from "../../services/membroService";
import Botao from "../../components/ui/Botao";
import SeletorMembro from "../../components/ui/SeletorMembro";
import { Confirmacao } from "../../components/ui/Sobreposicao";
import { Avatar, Aviso, CabecalhoPagina, EstadoVazio, LinhasCarregando } from "../../components/ui/Basicos";
import { mascaraTelefone } from "../../utils/formatar";

// Transaction Ministerio do GeneXus, com seus dois níveis (Lideres e Membros).
// Adicionar alguém é: digitar o nome, escolher, pronto — já fica gravado.
function DetalheMinisterio() {
  const { id } = useParams();
  const navegar = useNavigate();
  const toast = useToast();
  const { pode } = useAuth();

  const { dados: ministerio, setDados: setMinisterio, carregando, erro, recarregar } = useBuscarDados(
    signal => buscarMinisterio(id, signal),
    [id]
  );
  // A lista de membros só é necessária para o campo "adicionar".
  const { dados: membros } = useBuscarDados(signal => (pode("membrosww") ? listarMembros(signal) : Promise.resolve([])));

  const [editandoNome, setEditandoNome] = useState(false);
  const [nome, setNome] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  // Copia o nome atual para o campo só quando a pessoa clica em "Renomear"
  // (em vez de um useEffect sincronizando o tempo todo).
  function comecarRenomear() {
    setNome(ministerio.nome);
    setEditandoNome(true);
  }

  async function salvarNome(e) {
    e.preventDefault();
    try {
      const atualizado = await atualizarMinisterio(id, nome);
      setMinisterio(atualizado);
      setEditandoNome(false);
      toast.sucesso("Nome atualizado.");
    } catch (e) {
      toast.erro(e.message);
    }
  }

  // papel: "membro" ou "lider". A lista do estado se chama "membros" ou "lideres".
  async function adicionar(membro, papel) {
    try {
      await adicionarVinculo(id, membro.codigo, papel);
      recarregar();
      toast.sucesso(`${membro.nome} adicionado(a) como ${papel === "lider" ? "líder" : "membro"}.`);
    } catch (e) {
      toast.erro(e.message);
    }
  }

  async function remover(pessoa, papel) {
    try {
      await removerVinculo(id, pessoa.codigo, papel);
      const lista = papel === "lider" ? "lideres" : "membros";
      setMinisterio(m => ({ ...m, [lista]: m[lista].filter(p => p.codigo !== pessoa.codigo) }));
      toast.sucesso(`${pessoa.nome} removido(a).`);
    } catch (e) {
      toast.erro(e.message);
    }
  }

  async function excluir() {
    try {
      setExcluindo(true);
      await excluirMinisterio(id);
      toast.sucesso("Ministério excluído.");
      navegar("/ministerios");
    } catch (e) {
      toast.erro(e.message);
      setExcluindo(false);
      setConfirmando(false);
    }
  }

  if (carregando && !ministerio) return <LinhasCarregando />;
  if (erro) return <Aviso tipo="perigo">{erro}</Aviso>;

  return (
    <>
      <CabecalhoPagina
        voltar={{ para: "/ministerios", texto: "Ministérios" }}
        titulo={
          editandoNome ? (
            <form className="titulo-editavel" onSubmit={salvarNome}>
              <input className="entrada" aria-label="Nome do ministério" maxLength={40} value={nome} onChange={e => setNome(e.target.value)} autoFocus />
              <Botao type="submit" variante="primario" icone={Check} aria-label="Salvar nome" />
              <Botao icone={X} aria-label="Cancelar" onClick={() => { setNome(ministerio.nome); setEditandoNome(false); }} />
            </form>
          ) : (
            ministerio.nome
          )
        }
        descricao={`${ministerio.lideres.length} ${ministerio.lideres.length === 1 ? "líder" : "líderes"} · ${ministerio.membros.length} ${ministerio.membros.length === 1 ? "membro" : "membros"}`}
      >
        {!editandoNome && <Botao icone={Pencil} onClick={comecarRenomear}>Renomear</Botao>}
        <Botao variante="perigo-suave" icone={Trash2} onClick={() => setConfirmando(true)}>Excluir</Botao>
      </CabecalhoPagina>

      <div className="equipes">
        <ListaEquipe
          titulo="Líderes"
          icone={Crown}
          pessoas={ministerio.lideres}
          papel="lider"
          membros={membros}
          aoAdicionar={adicionar}
          aoRemover={remover}
        />
        <ListaEquipe
          titulo="Membros"
          icone={Users}
          pessoas={ministerio.membros}
          papel="membro"
          membros={membros}
          aoAdicionar={adicionar}
          aoRemover={remover}
        />
      </div>

      <Confirmacao
        aberto={confirmando}
        titulo={`Excluir o ministério ${ministerio.nome}?`}
        mensagem="Os vínculos de líderes e membros com este ministério também serão apagados. As fichas dos membros continuam intactas."
        textoConfirmar="Excluir ministério"
        processando={excluindo}
        aoConfirmar={excluir}
        aoCancelar={() => setConfirmando(false)}
      />
    </>
  );
}

// Um painel (Líderes ou Membros) com o campo de adicionar e a lista.
function ListaEquipe({ titulo, icone: Icone, pessoas, papel, membros, aoAdicionar, aoRemover }) {
  // Set = conjunto para checar rápido "já está na lista?"
  const jaNaLista = new Set(pessoas.map(p => p.codigo));

  return (
    <section className="cartao">
      <div className="cartao__cabecalho">
        <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icone size={18} aria-hidden="true" className="suave" /> {titulo}
          <span className="etiqueta mono">{pessoas.length}</span>
        </h2>
      </div>

      {membros && membros.length > 0 && (
        <div style={{ padding: "16px 20px 0" }}>
          <SeletorMembro
            membros={membros}
            ocultar={jaNaLista}
            aoEscolher={m => aoAdicionar(m, papel)}
            placeholder={`Adicionar ${papel === "lider" ? "líder" : "membro"}: digite o nome`}
          />
        </div>
      )}

      {pessoas.length === 0 ? (
        <EstadoVazio titulo={`Nenhum ${papel === "lider" ? "líder" : "membro"} ainda`} texto="Use o campo acima para adicionar." />
      ) : (
        <ul className="equipe">
          {pessoas.map(p => (
            <li key={p.codigo}>
              <Avatar nome={p.nome} />
              <div className="equipe__nome">
                <Link to={`/membros/${p.codigo}`}>{p.nome}</Link>
                {p.celular && <span className="mono">{mascaraTelefone(p.celular)}</span>}
              </div>
              <Botao pequeno variante="fantasma" icone={X} aria-label={`Remover ${p.nome}`} title="Remover" onClick={() => aoRemover(p, papel)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default DetalheMinisterio;
