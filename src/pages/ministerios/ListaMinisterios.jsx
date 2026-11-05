import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Church, Plus, Users, Crown, Search } from "lucide-react";
import { useBuscarDados } from "../../hooks/useBuscarDados";
import { useToast } from "../../hooks/useToast";
import { listarMinisterios, cadastrarMinisterio } from "../../services/ministerioService";
import Botao from "../../components/ui/Botao";
import Campo from "../../components/ui/Campo";
import { Modal } from "../../components/ui/Sobreposicao";
import { Aviso, CabecalhoPagina, EstadoVazio, LinhasCarregando } from "../../components/ui/Basicos";
import { normalizar } from "../../utils/formatar";

// MinisterioWW do GeneXus. Em vez de uma grade, cartões: cada ministério
// mostra de cara quantos membros tem e quem lidera.
function ListaMinisterios() {
  const { dados: ministerios, carregando, erro } = useBuscarDados(listarMinisterios);
  const [busca, setBusca] = useState("");
  const [criando, setCriando] = useState(false);

  const filtrados = (ministerios ?? []).filter(m => normalizar(m.nome).includes(normalizar(busca.trim())));

  return (
    <>
      <CabecalhoPagina titulo="Ministérios" descricao="Equipes de serviço, seus líderes e membros.">
        <Botao variante="primario" icone={Plus} onClick={() => setCriando(true)}>Novo ministério</Botao>
      </CabecalhoPagina>

      {erro && <Aviso tipo="perigo">{erro}</Aviso>}

      {ministerios?.length > 6 && (
        <div className="busca" style={{ marginBottom: 16 }}>
          <Search aria-hidden="true" />
          <input className="entrada" type="search" placeholder="Buscar ministério" aria-label="Buscar ministério" value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
      )}

      {carregando ? (
        <div className="cartao"><LinhasCarregando linhas={4} /></div>
      ) : ministerios?.length === 0 ? (
        <div className="cartao">
          <EstadoVazio icone={Church} titulo="Nenhum ministério cadastrado" texto="Crie o primeiro ministério e depois adicione líderes e membros a ele.">
            <Botao variante="primario" icone={Plus} onClick={() => setCriando(true)}>Criar ministério</Botao>
          </EstadoVazio>
        </div>
      ) : (
        <div className="grade-ministerios">
          {filtrados.map(m => (
            <Link key={m.id} to={`/ministerios/${m.id}`} className="cartao ministerio-cartao">
              <h2>{m.nome}</h2>
              <p className="ministerio-cartao__lideres">
                <Crown aria-hidden="true" />
                {m.lideres.length ? m.lideres.join(", ") : <span className="suave">Sem líder definido</span>}
              </p>
              <div className="ministerio-cartao__numeros">
                <span><Users aria-hidden="true" /> <strong className="mono">{m.totalMembros}</strong> {m.totalMembros === 1 ? "membro" : "membros"}</span>
                <span><Crown aria-hidden="true" /> <strong className="mono">{m.totalLideres}</strong> {m.totalLideres === 1 ? "líder" : "líderes"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <NovoMinisterio aberto={criando} aoFechar={() => setCriando(false)} />
    </>
  );
}

// Modal curto: só o nome. Depois de criar, já abre o ministério
// para adicionar as pessoas (um passo a menos).
function NovoMinisterio({ aberto, aoFechar }) {
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const navegar = useNavigate();
  const toast = useToast();

  function fechar() {
    setNome("");
    setErro("");
    aoFechar();
  }

  async function criar(e) {
    e.preventDefault();
    if (!nome.trim()) return setErro("Informe o nome do ministério.");
    try {
      setSalvando(true);
      const criado = await cadastrarMinisterio(nome);
      toast.sucesso(`Ministério ${criado.nome} criado. Agora adicione as pessoas.`);
      navegar(`/ministerios/${criado.id}`);
    } catch (e) {
      setErro(e.message);
      setSalvando(false);
    }
  }

  return (
    <Modal aberto={aberto} titulo="Novo ministério" aoFechar={fechar}>
      <form onSubmit={criar} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Campo id="nome-ministerio" rotulo="Nome" obrigatorio erro={erro} dica="Até 40 caracteres. Ex.: Louvor, Infantil, Recepção.">
          <input id="nome-ministerio" className="entrada" maxLength={40} value={nome} onChange={e => setNome(e.target.value)} />
        </Campo>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Botao onClick={fechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={salvando}>Criar ministério</Botao>
        </div>
      </form>
    </Modal>
  );
}

export default ListaMinisterios;
