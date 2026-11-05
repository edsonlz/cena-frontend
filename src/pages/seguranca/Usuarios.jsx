import { useState } from "react";
import { Plus, Search, UserCog, Trash2, KeyRound, ShieldCheck } from "lucide-react";
import { useBuscarDados } from "../../hooks/useBuscarDados";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
import {
  listarUsuarios, cadastrarUsuario, atualizarUsuario, excluirUsuario, redefinirSenha
} from "../../services/usuarioService";
import { perfilService } from "../../services/cadastroService";
import Tabela from "../../components/ui/Tabela";
import Botao from "../../components/ui/Botao";
import Campo from "../../components/ui/Campo";
import Interruptor from "../../components/ui/Interruptor";
import { Gaveta, Modal, Confirmacao } from "../../components/ui/Sobreposicao";
import { Avatar, Aviso, CabecalhoPagina, EstadoVazio, LinhasCarregando } from "../../components/ui/Basicos";
import { formatarData, normalizar } from "../../utils/formatar";

const USUARIO_VAZIO = {
  nome: "", apelido: "", login: "", perfil: "", situacao: "A", validadeSenha: "", admin: false, senha: "",
  email: "", contaEmail: "", servidorSaida: "", portaSmtp: 0, nomeConta: "", senhaConta: "", autenticacao: false, seguranca: ""
};

// UsuariosWW + Transaction Usuarios do GeneXus.
function Usuarios() {
  const toast = useToast();
  const { usuario: logado } = useAuth();
  const { dados: usuarios, setDados: setUsuarios, carregando, erro } = useBuscarDados(listarUsuarios);
  const { dados: perfis } = useBuscarDados(perfilService.listar);

  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(USUARIO_VAZIO);
  const [erroForm, setErroForm] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [excluir, setExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [senhaPara, setSenhaPara] = useState(null);

  const novo = editando && !editando.id;

  function abrir(usuario) {
    setEditando(usuario);
    setErroForm("");
    // "?? ''" troca null por "" — inputs controlados não aceitam null.
    setForm({ ...USUARIO_VAZIO, ...Object.fromEntries(Object.entries(usuario).map(([k, v]) => [k, v ?? ""])), senha: "", senhaConta: "" });
  }

  const alterar = campo => e => setForm({ ...form, [campo]: e.target.value });

  async function salvar(e) {
    e.preventDefault();
    if (!form.nome.trim()) return setErroForm("Informe o nome.");
    if (!form.login.trim()) return setErroForm("Informe o login.");
    if (!form.perfil) return setErroForm("Escolha o perfil de acesso.");
    if (novo && form.senha.length < 6) return setErroForm("Defina uma senha inicial com pelo menos 6 caracteres.");

    try {
      setSalvando(true);
      if (novo) {
        const criado = await cadastrarUsuario(form);
        setUsuarios(lista => [...lista, criado]);
        toast.sucesso(`Usuário ${criado.login} criado.`);
      } else {
        const atualizado = await atualizarUsuario(editando.id, form);
        setUsuarios(lista => lista.map(u => (u.id === atualizado.id ? atualizado : u)));
        toast.sucesso("Alterações salvas.");
      }
      setEditando(null);
    } catch (e) {
      setErroForm(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    try {
      setExcluindo(true);
      await excluirUsuario(excluir.id);
      setUsuarios(lista => lista.filter(u => u.id !== excluir.id));
      toast.sucesso("Usuário excluído.");
      setEditando(null);
    } catch (e) {
      toast.erro(e.message);
    } finally {
      setExcluindo(false);
      setExcluir(null);
    }
  }

  const termo = normalizar(busca.trim());
  const filtrados = (usuarios ?? []).filter(u => !termo || normalizar(`${u.nome} ${u.login} ${u.perfil}`).includes(termo));

  // Senha vencida = validade anterior a hoje (comparação de texto AAAA-MM-DD funciona).
  const hoje = new Date().toISOString().slice(0, 10);

  const colunas = [
    {
      id: "nome", titulo: "Usuário", valor: u => u.nome,
      render: u => (
        <div className="celula-pessoa">
          <Avatar nome={u.nome} />
          <div>
            <strong>{u.nome}</strong>
            <span className="mono">{u.login}</span>
          </div>
        </div>
      )
    },
    {
      id: "perfil", titulo: "Perfil", valor: u => u.perfil,
      render: u => (
        <div className="etiquetas">
          <span className="etiqueta">{u.perfil}</span>
          {u.admin && <span className="etiqueta etiqueta--primaria"><ShieldCheck /> Administrador</span>}
        </div>
      )
    },
    {
      id: "situacao", titulo: "Situação", valor: u => u.situacao,
      render: u => u.situacao === "A"
        ? <span className="etiqueta etiqueta--sucesso">Ativo</span>
        : <span className="etiqueta etiqueta--perigo">Inativo</span>
    },
    {
      id: "validade", titulo: "Validade da senha", valor: u => u.validadeSenha ?? "",
      render: u => !u.validadeSenha
        ? <span className="suave">Sem prazo</span>
        : <span className={`mono ${u.validadeSenha < hoje ? "texto-perigo" : ""}`}>{formatarData(u.validadeSenha)}{u.validadeSenha < hoje && " · vencida"}</span>
    }
  ];

  return (
    <>
      <CabecalhoPagina titulo="Usuários" descricao="Quem pode entrar no sistema e com qual perfil.">
        <Botao variante="primario" icone={Plus} onClick={() => abrir({})}>Novo usuário</Botao>
      </CabecalhoPagina>

      {erro && <Aviso tipo="perigo">{erro}</Aviso>}

      <section className="cartao">
        <div className="barra-ferramentas">
          <div className="busca">
            <Search aria-hidden="true" />
            <input className="entrada" type="search" placeholder="Buscar por nome, login ou perfil" aria-label="Buscar usuários" value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>
        {carregando ? (
          <LinhasCarregando linhas={3} />
        ) : filtrados.length === 0 ? (
          <EstadoVazio icone={UserCog} titulo="Nenhum usuário encontrado" />
        ) : (
          <Tabela colunas={colunas} linhas={filtrados} chave={u => u.id} ordemInicial={{ coluna: "nome", crescente: true }} aoClicarLinha={abrir} />
        )}
      </section>

      <Gaveta
        aberto={Boolean(editando)}
        titulo={novo ? "Novo usuário" : editando?.nome}
        descricao={novo ? undefined : `Login ${editando?.login}`}
        aoFechar={() => setEditando(null)}
        onSubmit={salvar}
        rodape={
          <>
            {!novo && editando?.id !== logado.id && (
              <Botao variante="perigo-suave" icone={Trash2} onClick={() => setExcluir(editando)}>Excluir</Botao>
            )}
            <span className="espaco" />
            <Botao onClick={() => setEditando(null)}>Cancelar</Botao>
            <Botao type="submit" variante="primario" carregando={salvando}>{novo ? "Criar usuário" : "Salvar"}</Botao>
          </>
        }
      >
        {erroForm && <Aviso tipo="perigo">{erroForm}</Aviso>}

        <div className="secao-form">
          <span className="secao-form__titulo">Acesso</span>
          <div className="grade-campos">
            <Campo id="u-nome" rotulo="Nome" obrigatorio className="col-12">
              <input id="u-nome" className="entrada" maxLength={60} value={form.nome} onChange={alterar("nome")} />
            </Campo>
            <Campo id="u-apelido" rotulo="Apelido" dica="Como aparece no sistema" className="col-6">
              <input id="u-apelido" className="entrada" maxLength={15} value={form.apelido} onChange={alterar("apelido")} />
            </Campo>
            <Campo id="u-login" rotulo="Login" obrigatorio className="col-6">
              <input id="u-login" className="entrada mono" maxLength={15} autoComplete="off" value={form.login} onChange={alterar("login")} />
            </Campo>
            <Campo id="u-perfil" rotulo="Perfil de acesso" obrigatorio className="col-6">
              <select id="u-perfil" className="entrada" value={form.perfil} onChange={alterar("perfil")}>
                <option value="">Escolha…</option>
                {perfis?.map(p => <option key={p.descricao} value={p.descricao}>{p.descricao}</option>)}
              </select>
            </Campo>
            <Campo id="u-validade" rotulo="Senha válida até" dica="Vazio = sem prazo" className="col-6">
              <input id="u-validade" type="date" className="entrada" value={form.validadeSenha} onChange={alterar("validadeSenha")} />
            </Campo>
            {/* Senha só na inclusão (regra do GeneXus). Depois, usa "Redefinir senha". */}
            {novo && (
              <Campo id="u-senha" rotulo="Senha inicial" obrigatorio dica="Mínimo de 6 caracteres. O usuário pode trocá-la depois." className="col-12">
                <input id="u-senha" type="password" className="entrada" autoComplete="new-password" value={form.senha} onChange={alterar("senha")} />
              </Campo>
            )}
          </div>
          <Interruptor checked={form.situacao === "A"} onChange={ativo => setForm({ ...form, situacao: ativo ? "A" : "I" })}>
            Usuário ativo (pode entrar no sistema)
          </Interruptor>
          {logado.admin && (
            <Interruptor checked={Boolean(form.admin)} onChange={admin => setForm({ ...form, admin })}>
              Administrador (acesso total, ignora o perfil)
            </Interruptor>
          )}
          {!novo && logado.admin && (
            <div>
              <Botao pequeno icone={KeyRound} onClick={() => setSenhaPara(editando)}>Redefinir senha</Botao>
            </div>
          )}
        </div>

        <details className="secao-form detalhes">
          <summary className="secao-form__titulo">Envio de e-mail (SMTP)</summary>
          <div className="grade-campos" style={{ marginTop: 14 }}>
            <Campo id="u-email" rotulo="E-mail" className="col-12">
              <input id="u-email" type="email" className="entrada" maxLength={100} value={form.email} onChange={alterar("email")} />
            </Campo>
            <Campo id="u-conta" rotulo="Conta de e-mail" className="col-6">
              <input id="u-conta" className="entrada" maxLength={100} value={form.contaEmail} onChange={alterar("contaEmail")} />
            </Campo>
            <Campo id="u-nomeconta" rotulo="Nome da conta" className="col-6">
              <input id="u-nomeconta" className="entrada" maxLength={60} value={form.nomeConta} onChange={alterar("nomeConta")} />
            </Campo>
            <Campo id="u-servidor" rotulo="Servidor de saída" className="col-8">
              <input id="u-servidor" className="entrada mono" maxLength={60} placeholder="smtp.exemplo.com" value={form.servidorSaida} onChange={alterar("servidorSaida")} />
            </Campo>
            <Campo id="u-porta" rotulo="Conexão segura" className="col-4">
              <select id="u-porta" className="entrada" value={form.portaSmtp} onChange={alterar("portaSmtp")}>
                <option value={0}>Não usa</option>
                <option value={1}>SSL</option>
                <option value={2}>TLS</option>
              </select>
            </Campo>
            <Campo id="u-senhaconta" rotulo="Senha da conta" dica={editando?.temSenhaConta ? "Já cadastrada. Preencha só para trocar." : undefined} className="col-8">
              <input id="u-senhaconta" type="password" className="entrada" maxLength={20} autoComplete="new-password" value={form.senhaConta} onChange={alterar("senhaConta")} />
            </Campo>
            <Campo id="u-seguranca" rotulo="Segurança" className="col-4">
              <input id="u-seguranca" type="number" min="0" max="9" className="entrada mono" value={form.seguranca} onChange={alterar("seguranca")} />
            </Campo>
          </div>
          <Interruptor checked={Boolean(form.autenticacao)} onChange={autenticacao => setForm({ ...form, autenticacao })}>
            Servidor requer autenticação
          </Interruptor>
        </details>
      </Gaveta>

      <Confirmacao
        aberto={Boolean(excluir)}
        titulo={`Excluir o usuário ${excluir?.login}?`}
        mensagem="A pessoa perde o acesso ao sistema. Se for algo temporário, prefira desmarcar “Usuário ativo”."
        processando={excluindo}
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => setExcluir(null)}
      />

      <RedefinirSenha usuario={senhaPara} aoFechar={() => setSenhaPara(null)} />
    </>
  );
}

// O administrador define uma senha nova sem precisar saber a antiga.
function RedefinirSenha({ usuario, aoFechar }) {
  const toast = useToast();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function fechar() {
    setSenha("");
    setErro("");
    aoFechar();
  }

  async function salvar(e) {
    e.preventDefault();
    if (senha.length < 6) return setErro("Use pelo menos 6 caracteres.");
    try {
      setSalvando(true);
      await redefinirSenha(usuario.id, senha);
      toast.sucesso(`Senha de ${usuario.login} redefinida. Informe a nova senha a ele(a).`);
      fechar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal aberto={Boolean(usuario)} titulo={`Redefinir senha de ${usuario?.login}`} descricao="A senha atual deixa de valer imediatamente." aoFechar={fechar}>
      <form onSubmit={salvar} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Campo id="nova-senha" rotulo="Nova senha" obrigatorio erro={erro}>
          <input id="nova-senha" type="password" className="entrada" autoComplete="new-password" value={senha} onChange={e => setSenha(e.target.value)} />
        </Campo>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Botao onClick={fechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={salvando}>Redefinir senha</Botao>
        </div>
      </form>
    </Modal>
  );
}

export default Usuarios;
