import { Loader2 } from "lucide-react";

// Botão reutilizável — a evolução do BotaoAcao do treinamento-react.
// Props:
//   variante    -> "primario" | "secundario" | "fantasma" | "perigo" | "perigo-suave"
//   pequeno     -> versão compacta
//   icone       -> componente de ícone do lucide-react (ex.: icone={Plus})
//   carregando  -> mostra um spinner e desabilita (evita clique duplo ao salvar)
//   ...props    -> "resto" das props (onClick, type, disabled, aria-label...) repassado ao <button>
function Botao({ variante = "secundario", pequeno, icone: Icone, carregando, children, className = "", ...props }) {
  const classes = [
    "botao",
    `botao--${variante}`,
    pequeno && "botao--pequeno",
    !children && "botao--icone",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={classes} disabled={carregando || props.disabled} {...props}>
      {carregando ? <Loader2 className="girando" aria-hidden="true" /> : Icone && <Icone aria-hidden="true" />}
      {children}
    </button>
  );
}

export default Botao;
