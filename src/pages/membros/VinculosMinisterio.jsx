import { Church, Crown, Check } from "lucide-react";
import { EstadoVazio } from "../../components/ui/Basicos";

// Participação do membro nos ministérios.
//
// No GeneXus isso eram dois componentes (WCMinisterioMembros e
// WCMinisterioLider), cada um com grid, botão "Inserir" que abria um
// modal e um prompt para escolher o ministério. Aqui cada ministério é
// uma linha com duas chaves: "Membro" e "Líder". Um clique liga ou desliga.
//
// Props:
//   vinculos   -> [{ id, nome, membro: bool, lider: bool }]
//   novo       -> true no cadastro (as marcações são gravadas ao salvar)
//   aoAlternar -> função(ministerioId, "membro" | "lider", marcado)
function VinculosMinisterio({ vinculos, novo, aoAlternar }) {
  const participa = vinculos.filter(v => v.membro || v.lider).length;

  return (
    <section className="cartao vinculos">
      <div className="cartao__cabecalho">
        <div>
          <h2>Ministérios</h2>
          <p>
            {novo
              ? "Marque agora; será gravado ao cadastrar."
              : participa === 0
                ? "Ainda não participa de nenhum."
                : `Participa de ${participa} ${participa === 1 ? "ministério" : "ministérios"}.`}
          </p>
        </div>
      </div>

      {vinculos.length === 0 ? (
        <EstadoVazio icone={Church} titulo="Nenhum ministério cadastrado" />
      ) : (
        <ul className="vinculos__lista">
          {vinculos.map(v => (
            <li key={v.id} className={v.membro || v.lider ? "vinculos__item vinculos__item--ativo" : "vinculos__item"}>
              <span className="vinculos__nome">{v.nome}</span>
              {/* role="group" + aria-label: o leitor de tela anuncia "Louvor, Membro, botão ligado" */}
              <div className="vinculos__chaves" role="group" aria-label={v.nome}>
                <Chave ativo={v.membro} onClick={() => aoAlternar(v.id, "membro", !v.membro)} icone={Check}>
                  Membro
                </Chave>
                <Chave ativo={v.lider} onClick={() => aoAlternar(v.id, "lider", !v.lider)} icone={Crown}>
                  Líder
                </Chave>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Botão que fica "pressionado" (aria-pressed) quando ativo.
function Chave({ ativo, onClick, icone: Icone, children }) {
  return (
    <button type="button" className="chave" aria-pressed={ativo} onClick={onClick}>
      {ativo && <Icone aria-hidden="true" />}
      {children}
    </button>
  );
}

export default VinculosMinisterio;
