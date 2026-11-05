// Chave liga/desliga (switch). Por baixo é um checkbox de verdade,
// então funciona com teclado (Espaço) e leitores de tela.
function Interruptor({ checked, onChange, children, disabled, ...props }) {
  return (
    <label className="interruptor">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        {...props}
      />
      <span className="interruptor__trilho" aria-hidden="true" />
      {children && <span>{children}</span>}
    </label>
  );
}

export default Interruptor;
