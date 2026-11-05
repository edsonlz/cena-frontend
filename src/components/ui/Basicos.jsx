import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { iniciais } from "../../utils/formatar";

// Componentes pequenos de apresentação, agrupados num arquivo só.
// Como são vários "export function", importamos com chaves:
//   import { Avatar, EstadoVazio } from "../components/ui/Basicos";

// Foto do membro ou, sem foto, as iniciais do nome.
export function Avatar({ nome, foto, grande }) {
  return (
    <span className={`avatar ${grande ? "avatar--grande" : ""}`} aria-hidden="true">
      {foto ? <img src={foto} alt="" /> : iniciais(nome)}
    </span>
  );
}

// Título da página + descrição + botões de ação à direita.
export function CabecalhoPagina({ titulo, descricao, voltar, children }) {
  return (
    <header className="cabecalho-pagina">
      <div>
        {voltar && (
          <Link to={voltar.para} className="voltar">
            <ArrowLeft aria-hidden="true" /> {voltar.texto}
          </Link>
        )}
        <h1>{titulo}</h1>
        {descricao && <p>{descricao}</p>}
      </div>
      {children && <div className="cabecalho-pagina__acoes">{children}</div>}
    </header>
  );
}

// Tela vazia que convida a agir ("Nenhum membro ainda. Cadastre o primeiro.").
export function EstadoVazio({ icone: Icone, titulo, texto, children }) {
  return (
    <div className="vazio">
      {Icone && (
        <span className="vazio__icone">
          <Icone aria-hidden="true" />
        </span>
      )}
      <h3>{titulo}</h3>
      {texto && <p>{texto}</p>}
      {children}
    </div>
  );
}

// Linhas "fantasmas" enquanto os dados carregam (em vez de um texto "Carregando...").
export function LinhasCarregando({ linhas = 6 }) {
  return (
    <div style={{ padding: "8px 16px" }} aria-busy="true" aria-label="Carregando">
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", padding: "12px 0" }}>
          <span className="esqueleto" style={{ width: 34, height: 34, borderRadius: "50%" }} />
          <span className="esqueleto" style={{ flex: 2 }} />
          <span className="esqueleto" style={{ flex: 1 }} />
          <span className="esqueleto" style={{ flex: 1 }} />
        </div>
      ))}
    </div>
  );
}

const ICONES_AVISO = { perigo: AlertCircle, alerta: AlertTriangle, info: Info };

// Mensagem em destaque dentro da página (erros de carregamento, avisos).
export function Aviso({ tipo = "info", children }) {
  const Icone = ICONES_AVISO[tipo];
  return (
    <div className={`aviso aviso--${tipo}`} role={tipo === "perigo" ? "alert" : "status"}>
      <Icone aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
