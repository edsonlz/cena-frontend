import { BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import CadastroSimples from "../components/CadastroSimples";
import { cargoService } from "../services/cadastroService";

// CargosWW + Transaction Cargos do GeneXus.
// Toda a lógica está no CadastroSimples; aqui só descrevemos o que é diferente.
function Cargos() {
  return (
    <CadastroSimples
      titulo="Cargos"
      descricao="Funções eclesiásticas atribuídas aos membros."
      singular="cargo"
      icone={BadgeCheck}
      service={cargoService}
      chave="sigla"
      textoExclusao="Só é possível excluir cargos que nenhum membro esteja usando."
      campos={[
        { id: "sigla", rotulo: "Sigla", maxLength: 2, chave: true, mono: true, dica: "2 letras. Ex.: PR, DC.", transformar: v => v.toUpperCase() },
        { id: "descricao", rotulo: "Nome do cargo", maxLength: 40 }
      ]}
      colunas={[
        { id: "sigla", titulo: "Sigla", valor: c => c.sigla, render: c => <span className="etiqueta mono">{c.sigla}</span> },
        { id: "descricao", titulo: "Cargo", valor: c => c.descricao },
        {
          id: "membros",
          titulo: "Membros",
          classe: "direita",
          valor: c => c.totalMembros ?? 0,
          // stopPropagation: o clique no link não abre a gaveta de edição da linha
          render: c => (
            <Link className="mono" to={`/membros?cargo=${c.sigla}`} onClick={e => e.stopPropagation()}>
              {c.totalMembros ?? 0}
            </Link>
          )
        }
      ]}
    />
  );
}

export default Cargos;
