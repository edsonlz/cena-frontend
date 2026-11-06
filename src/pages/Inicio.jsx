import { Link } from "react-router-dom";
import { Cake, UserPlus, Users, Church, HeartHandshake, UserX } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useBuscarDados } from "../hooks/useBuscarDados";
import { buscarDashboard } from "../services/consultaService";
import { Aviso, EstadoVazio } from "../components/ui/Basicos";
import Indicador from "../components/ui/Indicador";
import { mascaraTelefone, NOMES_MESES } from "../utils/formatar";

// Página inicial. No GeneXus a Home mostrava cartões de exemplo do
// WorkWithPlus; aqui ela responde às perguntas do dia a dia da secretaria:
// quantos membros temos, quem faz aniversário e quem ainda não serve em nenhum ministério.
function Inicio() {
  const { usuario, pode } = useAuth();
  const { dados, carregando, erro } = useBuscarDados(buscarDashboard);
  const mes = NOMES_MESES[new Date().getMonth()];
  const verMembros = pode("membrosww");

  return (
    <>
      <header className="inicio__cabecalho">
        <div>
          <p className="inicio__data">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1>Bom ver você, {usuario.apelido}.</h1>
        </div>
        {verMembros && (
          <Link to="/membros/novo" className="botao botao--primario">
            <UserPlus aria-hidden="true" /> Cadastrar membro
          </Link>
        )}
      </header>

      {erro && <Aviso tipo="perigo">{erro}</Aviso>}

      <section className="indicadores" aria-label="Resumo">
        <Indicador icone={Users} rotulo="Membros cadastrados" valor={dados?.totalMembros} carregando={carregando} link={verMembros && "/membros"} />
        <Indicador icone={Church} rotulo="Ministérios" valor={dados?.totalMinisterios} carregando={carregando} link={pode("ministerioww") && "/ministerios"} />
        <Indicador icone={HeartHandshake} rotulo="Servindo em ministérios" valor={dados?.membrosEmMinisterios} carregando={carregando} />
        <Indicador
          icone={UserX}
          rotulo="Sem nenhum ministério"
          valor={dados?.semMinisterio}
          carregando={carregando}
          link={verMembros && "/membros?filtro=sem-ministerio"}
          destaque={dados?.semMinisterio > 0}
        />
      </section>

      <div className="inicio__grade">
        <section className="cartao">
          <div className="cartao__cabecalho">
            <div>
              <h2>Aniversariantes de {mes}</h2>
              <p>{dados ? `${dados.aniversariantes.length} neste mês` : " "}</p>
            </div>
            <Cake aria-hidden="true" className="suave" size={20} />
          </div>
          {dados && dados.aniversariantes.length === 0 ? (
            <EstadoVazio titulo="Ninguém faz aniversário este mês" texto="Confira se as datas de nascimento estão preenchidas nas fichas dos membros." />
          ) : (
            <ul className="aniversarios">
              {dados?.aniversariantes.map(pessoa => {
                const hoje = pessoa.dia === new Date().getDate();
                return (
                  <li key={pessoa.codigo} className={hoje ? "aniversarios__hoje" : undefined}>
                    <span className="aniversarios__dia mono">{String(pessoa.dia).padStart(2, "0")}</span>
                    <div>
                      {verMembros ? <Link to={`/membros/${pessoa.codigo}`}>{pessoa.nome}</Link> : pessoa.nome}
                      {hoje && <span className="etiqueta etiqueta--primaria" style={{ marginLeft: 8 }}>Hoje</span>}
                    </div>
                    {pessoa.celular && (
                      <a className="mono aniversarios__fone" href={`tel:${pessoa.celular}`}>{mascaraTelefone(pessoa.celular)}</a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="cartao">
          <div className="cartao__cabecalho">
            <div>
              <h2>Membros por ministério</h2>
              <p>Quantidade de membros (sem contar líderes)</p>
            </div>
          </div>
          {dados && dados.ministerios.length === 0 ? (
            <EstadoVazio titulo="Nenhum ministério cadastrado" texto="Cadastre os ministérios para acompanhar quem serve em cada um." />
          ) : (
            <RankingMinisterios ministerios={dados?.ministerios ?? []} />
          )}
        </section>
      </div>
    </>
  );
}

// Barras horizontais de uma série só: uma cor, valor escrito ao lado
// (nunca só pela cor) e title no hover com o texto completo.
function RankingMinisterios({ ministerios }) {
  const maior = Math.max(1, ...ministerios.map(m => m.membros));
  return (
    <ul className="ranking">
      {ministerios.map(m => (
        <li key={m.id} title={`${m.nome}: ${m.membros} membro(s)`}>
          <span className="ranking__nome">{m.nome}</span>
          <span className="ranking__trilho">
            <span className="ranking__barra" style={{ width: `${(m.membros / maior) * 100}%` }} />
          </span>
          <span className="ranking__valor mono">{m.membros}</span>
        </li>
      ))}
    </ul>
  );
}

export default Inicio;
