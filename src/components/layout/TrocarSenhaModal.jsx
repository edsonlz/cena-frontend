import { useState } from "react";
import { Modal } from "../ui/Sobreposicao";
import Campo from "../ui/Campo";
import Botao from "../ui/Botao";
import { Aviso } from "../ui/Basicos";
import { trocarSenha } from "../../services/authService";
import { useToast } from "../../hooks/useToast";

const VAZIO = { senhaAtual: "", novaSenha: "", confirmacao: "" };

// Troca da própria senha (Transaction TrocaSenha do GeneXus).
// Antes era uma tela própria no menu; agora fica no menu do usuário.
function TrocarSenhaModal({ aberto, aoFechar }) {
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const toast = useToast();

  // Atualiza um campo do formulário mantendo os outros (spread ...).
  const alterar = campo => e => setForm({ ...form, [campo]: e.target.value });

  function fechar() {
    setForm(VAZIO);
    setErro("");
    aoFechar();
  }

  async function salvar(e) {
    e.preventDefault();
    // Mesmas regras do GeneXus, conferidas antes de chamar a API.
    if (!form.novaSenha) return setErro("Informe a nova senha.");
    if (form.novaSenha !== form.confirmacao) return setErro("A confirmação não é igual à nova senha.");

    try {
      setSalvando(true);
      setErro("");
      await trocarSenha(form.senhaAtual, form.novaSenha, form.confirmacao);
      toast.sucesso("Senha alterada.");
      fechar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal aberto={aberto} titulo="Trocar minha senha" descricao="Use pelo menos 6 caracteres." aoFechar={fechar}>
      <form onSubmit={salvar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {erro && <Aviso tipo="perigo">{erro}</Aviso>}
        <Campo id="senha-atual" rotulo="Senha atual" obrigatorio>
          <input id="senha-atual" className="entrada" type="password" autoComplete="current-password" value={form.senhaAtual} onChange={alterar("senhaAtual")} />
        </Campo>
        <Campo id="senha-nova" rotulo="Nova senha" obrigatorio>
          <input id="senha-nova" className="entrada" type="password" autoComplete="new-password" value={form.novaSenha} onChange={alterar("novaSenha")} />
        </Campo>
        <Campo id="senha-confirmacao" rotulo="Repita a nova senha" obrigatorio>
          <input id="senha-confirmacao" className="entrada" type="password" autoComplete="new-password" value={form.confirmacao} onChange={alterar("confirmacao")} />
        </Campo>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <Botao onClick={fechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={salvando}>Trocar senha</Botao>
        </div>
      </form>
    </Modal>
  );
}

export default TrocarSenhaModal;
