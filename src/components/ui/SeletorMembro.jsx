import { useId, useState } from "react";
import { Search } from "lucide-react";
import { Avatar } from "./Basicos";
import { normalizar } from "../../utils/formatar";

// Campo de busca com lista de sugestões (combobox) para escolher um membro.
// Substitui os "Prompts" do GeneXus (MinisterioMembrosPrompt etc.), que abriam
// outra janela só para escolher alguém: aqui é só digitar e escolher.
//
// Props:
//   membros     -> lista completa [{ codigo, nome, ... }]
//   ocultar     -> Set com códigos que não devem aparecer (já vinculados)
//   aoEscolher  -> função chamada com o membro escolhido
function SeletorMembro({ membros, ocultar, aoEscolher, placeholder = "Buscar membro pelo nome" }) {
  const [texto, setTexto] = useState("");
  const [aberto, setAberto] = useState(false);
  const [destaque, setDestaque] = useState(0);
  const idLista = useId();

  const termo = normalizar(texto.trim());
  const opcoes = membros
    .filter(m => !ocultar?.has(m.codigo))
    .filter(m => !termo || normalizar(m.nome).includes(termo))
    .slice(0, 8);

  function escolher(membro) {
    aoEscolher(membro);
    setTexto("");
    setDestaque(0);
  }

  // Navegação pelo teclado: setas mudam o destaque, Enter escolhe, Esc fecha.
  function teclado(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAberto(true);
      setDestaque(i => Math.min(i + 1, opcoes.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDestaque(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && aberto && opcoes[destaque]) {
      e.preventDefault();
      escolher(opcoes[destaque]);
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setAberto(false);
    }
  }

  return (
    <div className="seletor">
      <div className="busca" style={{ maxWidth: "none" }}>
        <Search aria-hidden="true" />
        <input
          className="entrada"
          role="combobox"
          aria-expanded={aberto}
          aria-controls={idLista}
          aria-autocomplete="list"
          placeholder={placeholder}
          value={texto}
          onChange={e => {
            setTexto(e.target.value);
            setAberto(true);
            setDestaque(0);
          }}
          onFocus={() => setAberto(true)}
          // O atraso deixa o clique na opção acontecer antes de a lista sumir.
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          onKeyDown={teclado}
        />
      </div>

      {aberto && (
        <ul className="seletor__lista" id={idLista} role="listbox">
          {opcoes.length === 0 ? (
            <li className="seletor__vazio">
              {termo ? "Nenhum membro encontrado com esse nome." : "Todos os membros já foram adicionados."}
            </li>
          ) : (
            opcoes.map((membro, i) => (
              <li
                key={membro.codigo}
                role="option"
                aria-selected={i === destaque}
                className="seletor__opcao"
                onMouseDown={e => e.preventDefault()}
                onMouseEnter={() => setDestaque(i)}
                onClick={() => escolher(membro)}
              >
                <Avatar nome={membro.nome} />
                {membro.nome}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default SeletorMembro;
