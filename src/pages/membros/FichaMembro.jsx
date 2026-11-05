import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Camera, Loader2, MapPin, Save, Trash2, CheckCircle2 } from "lucide-react";
import {
  buscarMembro, cadastrarMembro, atualizarMembro, excluirMembro, verificarCpf, buscarCep
} from "../../services/membroService";
import { listarMinisterios, adicionarVinculo, removerVinculo } from "../../services/ministerioService";
import { cargoService } from "../../services/cadastroService";
import { useBuscarDados } from "../../hooks/useBuscarDados";
import { useToast } from "../../hooks/useToast";
import Campo from "../../components/ui/Campo";
import Botao from "../../components/ui/Botao";
import { Confirmacao } from "../../components/ui/Sobreposicao";
import { Avatar, Aviso, CabecalhoPagina, LinhasCarregando } from "../../components/ui/Basicos";
import VinculosMinisterio from "./VinculosMinisterio";
import {
  mascaraCpf, mascaraTelefone, mascaraCep, somenteDigitos, cpfValido, idade
} from "../../utils/formatar";

const MEMBRO_VAZIO = {
  nome: "", cpf: "", rg: "", sexo: "", dataNascimento: "", cargoSigla: "",
  celular: "", telefone: "", email: "", foto: null,
  cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", uf: ""
};

// Transaction Membros do GeneXus (inclusão e alteração na mesma tela).
// Rota: /membros/novo  ou  /membros/15
//
// Dividida em duas partes:
//   FichaMembro      -> só CARREGA os dados (membro e ministérios)
//   FormularioMembro -> recebe os dados prontos e cuida da edição
// Assim o formulário já nasce preenchido (useState com valor inicial),
// sem precisar de um useEffect copiando dados da API para o estado.
function FichaMembro() {
  const { codigo } = useParams();
  const novo = codigo === "novo";

  // Depende de "codigo": se a URL mudar de /membros/1 para /membros/2, busca de novo.
  const membro = useBuscarDados(
    signal => (novo ? Promise.resolve(null) : buscarMembro(codigo, signal)),
    [codigo]
  );
  const ministerios = useBuscarDados(listarMinisterios);

  if (membro.carregando || ministerios.carregando) return <LinhasCarregando />;
  if (membro.erro || ministerios.erro) return <Aviso tipo="perigo">{membro.erro || ministerios.erro}</Aviso>;

  // key={codigo}: ao trocar de membro (ou depois de cadastrar um novo),
  // o React descarta o formulário antigo e cria outro do zero.
  return <FormularioMembro key={codigo} codigo={codigo} membro={membro.dados} ministerios={ministerios.dados} />;
}

// Converte o membro da API para o formato do formulário (com máscaras e "" no lugar de null).
function paraFormulario(membro) {
  if (!membro) return MEMBRO_VAZIO;
  return {
    ...MEMBRO_VAZIO,
    ...Object.fromEntries(Object.entries(membro).map(([k, v]) => [k, v ?? ""])),
    cpf: mascaraCpf(membro.cpf),
    celular: mascaraTelefone(membro.celular),
    telefone: mascaraTelefone(membro.telefone),
    cep: mascaraCep(membro.cep),
    foto: membro.foto
  };
}

function FormularioMembro({ codigo, membro, ministerios }) {
  const novo = !membro;
  const navegar = useNavigate();
  const toast = useToast();

  // useState(() => ...) calcula o valor inicial uma única vez, na criação.
  const [form, setForm] = useState(() => paraFormulario(membro));
  // Vínculos: os do membro, ou (cadastro novo) todos os ministérios desmarcados.
  const [vinculos, setVinculos] = useState(
    () => membro?.ministerios ?? ministerios.map(m => ({ id: m.id, nome: m.nome, membro: false, lider: false }))
  );
  const [erros, setErros] = useState({});
  const [avisoCpf, setAvisoCpf] = useState("");
  const [cep, setCep] = useState({ buscando: false, mensagem: "", erro: false });
  const [salvando, setSalvando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const { dados: cargos } = useBuscarDados(cargoService.listar);

  // Atualiza um campo. "mascara" é opcional: aplica a formatação ao digitar.
  function alterar(campo, mascara) {
    return e => {
      const valor = mascara ? mascara(e.target.value) : e.target.value;
      setForm(f => ({ ...f, [campo]: valor }));
      if (erros[campo]) setErros(atual => ({ ...atual, [campo]: undefined }));
    };
  }

  // ---------- CPF: valida ao sair do campo (regra verificaCpf do GeneXus) ----------
  async function conferirCpf() {
    const digitos = somenteDigitos(form.cpf);
    setAvisoCpf("");
    if (!digitos) return;
    // Só avisa (não bloqueia): o GeneXus aceitava qualquer CPF preenchido
    // e há cadastros antigos com CPF incompleto.
    if (digitos.length !== 11) setAvisoCpf("CPF incompleto: deveria ter 11 números.");
    else if (!cpfValido(digitos)) setAvisoCpf("Os dígitos deste CPF não conferem. Verifique se foi digitado certo.");

    try {
      const resultado = await verificarCpf(digitos, novo ? 0 : codigo);
      if (resultado.cadastrado) {
        setErros(e => ({ ...e, cpf: `Este CPF já está cadastrado para ${resultado.membro.nome}.`, cpfCodigo: resultado.membro.codigo }));
      }
    } catch {
      // sem conexão: a API confere de novo ao salvar
    }
  }

  // ---------- CEP: preenche o endereço sozinho (ProcBuscaCEP) ----------
  async function alterarCep(e) {
    const valor = mascaraCep(e.target.value);
    setForm(f => ({ ...f, cep: valor }));
    const digitos = somenteDigitos(valor);
    if (digitos.length !== 8) {
      setCep({ buscando: false, mensagem: "", erro: false });
      return;
    }

    setCep({ buscando: true, mensagem: "", erro: false });
    try {
      const endereco = await buscarCep(digitos);
      // Mesma regra do GeneXus: só substitui o campo se o CEP trouxe valor.
      setForm(f => ({
        ...f,
        rua: endereco.rua || f.rua,
        bairro: endereco.bairro || f.bairro,
        cidade: endereco.cidade || f.cidade,
        uf: endereco.uf || f.uf
      }));
      setCep({ buscando: false, mensagem: "Endereço preenchido pelo CEP. Falta só o número.", erro: false });
      document.getElementById("numero")?.focus();
    } catch (e) {
      setCep({ buscando: false, mensagem: e.message, erro: true });
    }
  }

  // ---------- Foto ----------
  const inputFoto = useRef(null);
  async function escolherFoto(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      toast.erro("Escolha um arquivo de imagem (JPG ou PNG).");
      return;
    }
    try {
      const foto = await reduzirImagem(arquivo, 480);
      setForm(f => ({ ...f, foto }));
    } catch {
      toast.erro("Não foi possível ler esta imagem.");
    }
  }

  // ---------- Vínculos com ministérios ----------
  // Membro já existe: grava na hora (sem botão Salvar), como um "interruptor".
  // Membro novo: só marca na tela; grava depois que o membro for criado.
  async function alternarVinculo(ministerioId, papel, marcado) {
    const anterior = vinculos;
    // Atualização "otimista": muda a tela antes da resposta da API...
    setVinculos(lista => lista.map(v => (v.id === ministerioId ? { ...v, [papel]: marcado } : v)));
    if (novo) return;

    try {
      if (marcado) await adicionarVinculo(ministerioId, Number(codigo), papel);
      else await removerVinculo(ministerioId, Number(codigo), papel);
    } catch (e) {
      // ...e desfaz se a API recusar.
      setVinculos(anterior);
      toast.erro(e.message);
    }
  }

  // ---------- Salvar ----------
  function validar() {
    const novosErros = {};
    if (!form.nome.trim()) novosErros.nome = "Informe o nome do membro.";
    if (!somenteDigitos(form.cpf)) novosErros.cpf = "Informe o CPF.";
    else if (erros.cpf) novosErros.cpf = erros.cpf; // CPF repetido (conferido ao sair do campo)
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) novosErros.email = "E-mail inválido.";
    setErros(novosErros);

    // Leva o foco ao primeiro campo com erro.
    const primeiro = Object.keys(novosErros)[0];
    if (primeiro) document.getElementById(primeiro)?.focus();
    return !primeiro;
  }

  async function salvar(e) {
    e.preventDefault();
    if (!validar()) return;

    try {
      setSalvando(true);
      if (novo) {
        const criado = await cadastrarMembro(form);
        // Grava os ministérios marcados antes de salvar.
        for (const v of vinculos) {
          if (v.membro) await adicionarVinculo(v.id, criado.codigo, "membro");
          if (v.lider) await adicionarVinculo(v.id, criado.codigo, "lider");
        }
        toast.sucesso("Membro cadastrado.");
        navegar(`/membros/${criado.codigo}`, { replace: true });
      } else {
        await atualizarMembro(codigo, form);
        toast.sucesso("Alterações salvas.");
      }
    } catch (e) {
      toast.erro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    try {
      setExcluindo(true);
      await excluirMembro(codigo);
      toast.sucesso("Membro excluído.");
      navegar("/membros");
    } catch (e) {
      toast.erro(e.message);
      setExcluindo(false);
      setConfirmandoExclusao(false);
    }
  }

  const anos = idade(form.dataNascimento);

  return (
    <form onSubmit={salvar} noValidate>
      <CabecalhoPagina
        voltar={{ para: "/membros", texto: "Membros" }}
        titulo={novo ? "Novo membro" : form.nome || "Membro"}
        descricao={novo ? "Só o nome e o CPF são obrigatórios. O resto pode ser completado depois." : membro?.cargoDescricao}
      />

      <div className="ficha">
        <div className="ficha__principal">
          <section className="cartao">
            <div className="cartao__cabecalho"><h2>Dados pessoais</h2></div>
            <div className="cartao__corpo grade-campos">
              <Campo id="nome" rotulo="Nome completo" obrigatorio erro={erros.nome} className="col-12">
                <input id="nome" className="entrada" maxLength={150} value={form.nome} onChange={alterar("nome")} aria-invalid={Boolean(erros.nome)} />
              </Campo>
              <Campo
                id="cpf" rotulo="CPF" obrigatorio className="col-4"
                erro={erros.cpf && (
                  <>
                    {erros.cpf}{" "}
                    {erros.cpfCodigo && <Link to={`/membros/${erros.cpfCodigo}`}>Abrir ficha</Link>}
                  </>
                )}
                dica={avisoCpf}
              >
                <input id="cpf" className="entrada mono" inputMode="numeric" placeholder="000.000.000-00" value={form.cpf} onChange={alterar("cpf", mascaraCpf)} onBlur={conferirCpf} aria-invalid={Boolean(erros.cpf)} />
              </Campo>
              <Campo id="rg" rotulo="RG" className="col-4">
                <input id="rg" className="entrada mono" maxLength={20} value={form.rg} onChange={alterar("rg")} />
              </Campo>
              <Campo id="sexo" rotulo="Sexo" className="col-4">
                <select id="sexo" className="entrada" value={form.sexo} onChange={alterar("sexo")}>
                  <option value="">Não informado</option>
                  <option value="F">Feminino</option>
                  <option value="M">Masculino</option>
                </select>
              </Campo>
              <Campo id="dataNascimento" rotulo="Data de nascimento" className="col-4" dica={anos !== null && anos >= 0 ? `${anos} anos` : undefined}>
                <input id="dataNascimento" type="date" className="entrada" value={form.dataNascimento} onChange={alterar("dataNascimento")} />
              </Campo>
              <Campo id="cargoSigla" rotulo="Cargo" className="col-8">
                <select id="cargoSigla" className="entrada" value={form.cargoSigla} onChange={alterar("cargoSigla")}>
                  <option value="">Sem cargo</option>
                  {cargos?.map(c => (
                    <option key={c.sigla} value={c.sigla}>{c.descricao}</option>
                  ))}
                </select>
              </Campo>
            </div>
          </section>

          <section className="cartao">
            <div className="cartao__cabecalho"><h2>Contato</h2></div>
            <div className="cartao__corpo grade-campos">
              <Campo id="celular" rotulo="Celular" className="col-6">
                <input id="celular" className="entrada mono" type="tel" placeholder="(00) 00000-0000" value={form.celular} onChange={alterar("celular", mascaraTelefone)} />
              </Campo>
              <Campo id="telefone" rotulo="Telefone fixo" className="col-6">
                <input id="telefone" className="entrada mono" type="tel" placeholder="(00) 0000-0000" value={form.telefone} onChange={alterar("telefone", mascaraTelefone)} />
              </Campo>
              <Campo id="email" rotulo="E-mail" erro={erros.email} className="col-12">
                <input id="email" className="entrada" type="email" maxLength={100} value={form.email} onChange={alterar("email")} aria-invalid={Boolean(erros.email)} />
              </Campo>
            </div>
          </section>

          <section className="cartao">
            <div className="cartao__cabecalho">
              <div>
                <h2>Endereço</h2>
                <p>Digite o CEP e o endereço é preenchido automaticamente.</p>
              </div>
            </div>
            <div className="cartao__corpo grade-campos">
              <Campo
                id="cep" rotulo="CEP" className="col-4"
                erro={cep.erro ? cep.mensagem : undefined}
                dica={!cep.erro ? cep.mensagem : undefined}
                acessorio={cep.buscando ? <Loader2 className="girando" /> : cep.mensagem && !cep.erro ? <CheckCircle2 /> : <MapPin />}
              >
                <input id="cep" className="entrada mono" inputMode="numeric" placeholder="00000-000" value={form.cep} onChange={alterarCep} />
              </Campo>
              <Campo id="rua" rotulo="Rua" className="col-8">
                <input id="rua" className="entrada" maxLength={150} value={form.rua} onChange={alterar("rua")} />
              </Campo>
              <Campo id="numero" rotulo="Número" className="col-3">
                <input id="numero" className="entrada" maxLength={20} value={form.numero} onChange={alterar("numero")} />
              </Campo>
              <Campo id="complemento" rotulo="Complemento" className="col-4">
                <input id="complemento" className="entrada" maxLength={150} value={form.complemento} onChange={alterar("complemento")} />
              </Campo>
              <Campo id="bairro" rotulo="Bairro" className="col-5" >
                <input id="bairro" className="entrada" maxLength={150} value={form.bairro} onChange={alterar("bairro")} />
              </Campo>
              <Campo id="cidade" rotulo="Cidade" className="col-8">
                <input id="cidade" className="entrada" maxLength={150} value={form.cidade} onChange={alterar("cidade")} />
              </Campo>
              <Campo id="uf" rotulo="UF" className="col-4">
                <input id="uf" className="entrada" maxLength={2} value={form.uf} onChange={alterar("uf", v => v.toUpperCase().replace(/[^A-Z]/g, ""))} />
              </Campo>
            </div>
          </section>
        </div>

        <aside className="ficha__lateral">
          <section className="cartao ficha__foto">
            <Avatar nome={form.nome} foto={form.foto} grande />
            <div className="ficha__foto-acoes">
              <Botao pequeno icone={Camera} onClick={() => inputFoto.current?.click()}>
                {form.foto ? "Trocar foto" : "Adicionar foto"}
              </Botao>
              {form.foto && (
                <Botao pequeno variante="fantasma" onClick={() => setForm(f => ({ ...f, foto: null }))}>Remover</Botao>
              )}
            </div>
            <input ref={inputFoto} type="file" accept="image/*" hidden onChange={escolherFoto} />
          </section>

          <VinculosMinisterio vinculos={vinculos} novo={novo} aoAlternar={alternarVinculo} />
        </aside>
      </div>

      <div className="barra-acoes">
        {!novo && (
          <Botao variante="perigo-suave" icone={Trash2} onClick={() => setConfirmandoExclusao(true)}>
            Excluir membro
          </Botao>
        )}
        <span className="espaco" />
        <Botao onClick={() => navegar("/membros")}>Cancelar</Botao>
        <Botao type="submit" variante="primario" icone={Save} carregando={salvando}>
          {novo ? "Cadastrar membro" : "Salvar alterações"}
        </Botao>
      </div>

      <Confirmacao
        aberto={confirmandoExclusao}
        titulo={`Excluir ${form.nome}?`}
        mensagem="A ficha será apagada definitivamente. Membros que participam de ministérios precisam ser removidos deles antes."
        textoConfirmar="Excluir membro"
        processando={excluindo}
        aoConfirmar={excluir}
        aoCancelar={() => setConfirmandoExclusao(false)}
      />
    </form>
  );
}

// Reduz a foto para no máximo "lado" pixels e converte para JPEG.
// Uma foto de celular (5 MB) vira ~50 KB, o que deixa o cadastro leve.
function reduzirImagem(arquivo, lado) {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.onload = () => {
      const escala = Math.min(1, lado / Math.max(imagem.width, imagem.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(imagem.width * escala);
      canvas.height = Math.round(imagem.height * escala);
      canvas.getContext("2d").drawImage(imagem, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(imagem.src);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    imagem.onerror = reject;
    imagem.src = URL.createObjectURL(arquivo);
  });
}

export default FichaMembro;
