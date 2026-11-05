import { AppWindow } from "lucide-react";
import CadastroSimples from "../../components/CadastroSimples";
import { programaService } from "../../services/cadastroService";

// ProgramasWW + Transaction Programas do GeneXus.
// Cada programa é uma área do sistema que pode ser liberada por perfil.
function Programas() {
  return (
    <CadastroSimples
      titulo="Programas"
      descricao="Áreas do sistema que podem ser liberadas para cada perfil de acesso."
      singular="programa"
      icone={AppWindow}
      service={programaService}
      chave="codigo"
      textoExclusao="Só é possível excluir programas que não estejam liberados para nenhum perfil."
      campos={[
        {
          id: "codigo", rotulo: "Código", maxLength: 100, chave: true, mono: true,
          dica: "Identificador usado pelo sistema, ex.: membrosww.",
          transformar: v => v.toLowerCase().replace(/\s/g, "")
        },
        { id: "descricao", rotulo: "Descrição", maxLength: 100 }
      ]}
      colunas={[
        { id: "descricao", titulo: "Programa", valor: p => p.descricao },
        { id: "codigo", titulo: "Código", valor: p => p.codigo, render: p => <span className="mono suave">{p.codigo}</span> },
        { id: "perfis", titulo: "Perfis com acesso", classe: "direita", valor: p => p.totalPerfis ?? 0, render: p => <span className="mono">{p.totalPerfis ?? 0}</span> }
      ]}
    />
  );
}

export default Programas;
