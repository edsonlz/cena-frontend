import { Link } from "react-router-dom";

// Cartão de número (stat tile), usado no Início e na lista de Membros.
//   detalhe  -> texto pequeno embaixo do número (ex.: "82% dos membros")
//   link     -> o cartão inteiro vira um link
//   destaque -> rótulo na cor de alerta (ex.: quando há gente sem ministério)
function Indicador({ icone: Icone, rotulo, valor, detalhe, carregando, link, destaque }) {
  const conteudo = (
    <>
      <span className="indicador__rotulo">
        <Icone aria-hidden="true" /> {rotulo}
      </span>
      {carregando ? (
        <span className="esqueleto" style={{ width: 64, height: 32 }} />
      ) : (
        <strong className="indicador__valor mono">{valor ?? "–"}</strong>
      )}
      {detalhe && !carregando && <span className="indicador__detalhe">{detalhe}</span>}
    </>
  );
  const classe = `indicador cartao ${destaque ? "indicador--destaque" : ""}`;
  return link ? (
    <Link to={link} className={`${classe} indicador--link`}>{conteudo}</Link>
  ) : (
    <div className={classe}>{conteudo}</div>
  );
}

export default Indicador;
