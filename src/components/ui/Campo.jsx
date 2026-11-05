// Moldura de um campo de formulário: rótulo, o controle (input/select), dica e erro.
// O controle vem como "children", então serve para qualquer tipo de entrada:
//
//   <Campo id="nome" rotulo="Nome" obrigatorio erro={erros.nome}>
//     <input id="nome" className="entrada" ... />
//   </Campo>
//
// O id liga o <label> ao campo (clicar no rótulo foca o campo) e
// o aria-describedby faz o leitor de tela ler a dica/erro junto.
function Campo({ id, rotulo, obrigatorio, dica, erro, acessorio, className = "", children }) {
  return (
    <div className={`campo ${className}`}>
      {rotulo && (
        <label className="campo__rotulo" htmlFor={id}>
          {rotulo}
          {obrigatorio && <span className="campo__obrigatorio" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="campo__controle">
        {children}
        {acessorio && <span className="campo__acessorio">{acessorio}</span>}
      </div>

      {erro ? (
        <span className="campo__erro" id={`${id}-erro`} role="alert">{erro}</span>
      ) : (
        dica && <span className="campo__dica" id={`${id}-dica`}>{dica}</span>
      )}
    </div>
  );
}

export default Campo;
