import { useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { useBuscarDados } from "../hooks/useBuscarDados";
import { useToast } from "../hooks/useToast";
import Tabela from "./ui/Tabela";
import Botao from "./ui/Botao";
import Campo from "./ui/Campo";
import { Gaveta, Confirmacao } from "./ui/Sobreposicao";
import { Aviso, CabecalhoPagina, EstadoVazio, LinhasCarregando } from "./ui/Basicos";
import { normalizar } from "../utils/formatar";

// Página completa de cadastro para tabelas simples (chave + descrição),
// como Cargos e Programas. Cada página só descreve O QUE muda:
//
//   <CadastroSimples
//     titulo="Cargos" singular="cargo" service={cargoService}
//     chave="sigla" campos={[...]} colunas={[...]} />
//
// campos: [{ id, rotulo, maxLength, chave: true (só na inclusão), dica, mono, transformar }]
function CadastroSimples({ titulo, descricao, singular, icone, service, chave, campos, colunas, textoExclusao }) {
  const toast = useToast();
  const { dados: itens, setDados: setItens, carregando, erro } = useBuscarDados(service.listar);

  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState(null); // null = gaveta fechada; {} = novo; item = alteração
  const [form, setForm] = useState({});
  const [erroForm, setErroForm] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [excluir, setExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const novo = editando && editando[chave] === undefined;

  function abrir(item) {
    setEditando(item);
    setForm(item);
    setErroForm("");
  }

  async function salvar(e) {
    e.preventDefault();
    const faltando = campos.find(c => !String(form[c.id] ?? "").trim());
    if (faltando) return setErroForm(`Preencha o campo "${faltando.rotulo}".`);

    try {
      setSalvando(true);
      if (novo) {
        const criado = await service.cadastrar(form);
        setItens(lista => [...lista, criado]);
        toast.sucesso(`${capitalizar(singular)} cadastrado.`);
      } else {
        const atualizado = await service.atualizar(editando[chave], form);
        setItens(lista => lista.map(i => (i[chave] === editando[chave] ? { ...i, ...atualizado } : i)));
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
      await service.excluir(excluir[chave]);
      setItens(lista => lista.filter(i => i[chave] !== excluir[chave]));
      toast.sucesso(`${capitalizar(singular)} excluído.`);
      setEditando(null);
    } catch (e) {
      toast.erro(e.message);
    } finally {
      setExcluindo(false);
      setExcluir(null);
    }
  }

  const termo = normalizar(busca.trim());
  const filtrados = (itens ?? []).filter(i => !termo || campos.some(c => normalizar(i[c.id]).includes(termo)));

  return (
    <>
      <CabecalhoPagina titulo={titulo} descricao={descricao}>
        <Botao variante="primario" icone={Plus} onClick={() => abrir({})}>Novo {singular}</Botao>
      </CabecalhoPagina>

      {erro && <Aviso tipo="perigo">{erro}</Aviso>}

      <section className="cartao">
        <div className="barra-ferramentas">
          <div className="busca">
            <Search aria-hidden="true" />
            <input className="entrada" type="search" placeholder="Buscar" aria-label={`Buscar ${titulo.toLowerCase()}`} value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          {itens && <span className="barra-ferramentas__info"><span className="mono">{filtrados.length}</span> {titulo.toLowerCase()}</span>}
        </div>

        {carregando ? (
          <LinhasCarregando linhas={4} />
        ) : itens?.length === 0 ? (
          <EstadoVazio icone={icone} titulo={`Nenhum ${singular} cadastrado`}>
            <Botao variante="primario" icone={Plus} onClick={() => abrir({})}>Cadastrar {singular}</Botao>
          </EstadoVazio>
        ) : filtrados.length === 0 ? (
          <EstadoVazio icone={Search} titulo="Nada encontrado" texto="Tente outro termo de busca." />
        ) : (
          <Tabela colunas={colunas} linhas={filtrados} chave={i => i[chave]} aoClicarLinha={abrir} />
        )}
      </section>

      <Gaveta
        aberto={Boolean(editando)}
        titulo={novo ? `Novo ${singular}` : `Editar ${singular}`}
        aoFechar={() => setEditando(null)}
        onSubmit={salvar}
        rodape={
          <>
            {!novo && (
              <Botao variante="perigo-suave" icone={Trash2} onClick={() => setExcluir(editando)}>Excluir</Botao>
            )}
            <span className="espaco" />
            <Botao onClick={() => setEditando(null)}>Cancelar</Botao>
            <Botao type="submit" variante="primario" carregando={salvando}>{novo ? "Cadastrar" : "Salvar"}</Botao>
          </>
        }
      >
        {erroForm && <Aviso tipo="perigo">{erroForm}</Aviso>}
        {campos.map(c => (
          <Campo
            key={c.id}
            id={`campo-${c.id}`}
            rotulo={c.rotulo}
            obrigatorio
            dica={c.chave && !novo ? "Não pode ser alterado depois de criado." : c.dica}
          >
            <input
              id={`campo-${c.id}`}
              className={`entrada ${c.mono ? "mono" : ""}`}
              maxLength={c.maxLength}
              // A chave (sigla/código) não muda na alteração — regra noaccept() do GeneXus.
              readOnly={c.chave && !novo}
              value={form[c.id] ?? ""}
              onChange={e => setForm({ ...form, [c.id]: c.transformar ? c.transformar(e.target.value) : e.target.value })}
            />
          </Campo>
        ))}
      </Gaveta>

      <Confirmacao
        aberto={Boolean(excluir)}
        titulo={`Excluir ${singular}?`}
        mensagem={textoExclusao}
        processando={excluindo}
        aoConfirmar={confirmarExclusao}
        aoCancelar={() => setExcluir(null)}
      />
    </>
  );
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default CadastroSimples;
