import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Botao from "./Botao";

// Base do Modal e da Gaveta: escurece o fundo, fecha com Esc ou clique fora,
// e coloca o foco dentro da janela ao abrir (acessibilidade).
//
// createPortal desenha o conteúdo direto no <body>, fora da árvore visual
// da página, para que nada "corte" a janela (overflow, z-index).
function useJanela(aberto, aoFechar) {
  const ref = useRef(null);

  // Guardamos a função num ref para o efeito abaixo NÃO rodar de novo
  // a cada renderização do pai (o que tiraria o foco do campo digitado).
  const aoFecharRef = useRef(aoFechar);
  useEffect(() => {
    aoFecharRef.current = aoFechar;
  });

  useEffect(() => {
    if (!aberto) return;

    const anterior = document.activeElement; // para devolver o foco depois
    const primeiro = ref.current?.querySelector("input, select, textarea, button:not([data-fechar])");
    primeiro?.focus();

    function tecla(e) {
      if (e.key === "Escape") aoFecharRef.current();
    }
    document.addEventListener("keydown", tecla);
    document.body.style.overflow = "hidden"; // trava a rolagem do fundo

    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = "";
      anterior?.focus?.();
    };
  }, [aberto]);

  return ref;
}

export function Modal({ aberto, titulo, descricao, aoFechar, rodape, children, largura }) {
  const ref = useJanela(aberto, aoFechar);
  if (!aberto) return null;

  return createPortal(
    <div className="sobreposicao sobreposicao--centro" onMouseDown={e => e.target === e.currentTarget && aoFechar()}>
      <div ref={ref} className="modal" style={largura ? { maxWidth: largura } : undefined} role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
        <div className="modal__cabecalho">
          <h2 id="modal-titulo">{titulo}</h2>
          {descricao && <p>{descricao}</p>}
        </div>
        {children && <div className="modal__corpo">{children}</div>}
        {rodape && <div className="modal__rodape">{rodape}</div>}
      </div>
    </div>,
    document.body
  );
}

// Painel que desliza da direita: usado para formulários de cadastro
// sem tirar o usuário da lista (ele continua vendo o contexto).
export function Gaveta({ aberto, titulo, descricao, aoFechar, rodape, children, onSubmit }) {
  const ref = useJanela(aberto, aoFechar);
  if (!aberto) return null;

  // Se recebeu onSubmit, a gaveta inteira vira um <form>:
  // apertar Enter em qualquer campo salva.
  const Conteiner = onSubmit ? "form" : "div";

  return createPortal(
    <div className="sobreposicao sobreposicao--direita" onMouseDown={e => e.target === e.currentTarget && aoFechar()}>
      <Conteiner ref={ref} className="gaveta" role="dialog" aria-modal="true" aria-labelledby="gaveta-titulo" onSubmit={onSubmit} noValidate>
        <div className="gaveta__cabecalho">
          <div>
            <h2 id="gaveta-titulo">{titulo}</h2>
            {descricao && <p>{descricao}</p>}
          </div>
          <Botao variante="fantasma" icone={X} onClick={aoFechar} aria-label="Fechar" data-fechar />
        </div>
        <div className="gaveta__corpo">{children}</div>
        {rodape && <div className="gaveta__rodape">{rodape}</div>}
      </Conteiner>
    </div>,
    document.body
  );
}

// Pergunta de confirmação (ex.: antes de excluir).
export function Confirmacao({ aberto, titulo, mensagem, textoConfirmar = "Excluir", processando, aoConfirmar, aoCancelar }) {
  return (
    <Modal
      aberto={aberto}
      titulo={titulo}
      descricao={mensagem}
      aoFechar={aoCancelar}
      rodape={
        <>
          <Botao onClick={aoCancelar}>Cancelar</Botao>
          <Botao variante="perigo" carregando={processando} onClick={aoConfirmar}>
            {textoConfirmar}
          </Botao>
        </>
      }
    />
  );
}
