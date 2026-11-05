import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Cross, Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Campo from "../components/ui/Campo";
import Botao from "../components/ui/Botao";
import { Aviso } from "../components/ui/Basicos";

// WebPanel Login do GeneXus.
function Login() {
  const { usuario, login } = useAuth();
  const navegar = useNavigate();
  const local = useLocation();

  const [form, setForm] = useState({ login: "", senha: "" });
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);

  // Já está logado? Não faz sentido ver o login: vai para o início.
  if (usuario) return <Navigate to="/" replace />;

  async function enviar(e) {
    e.preventDefault();
    // Sub 'CheckRequiredFields'
    if (!form.login.trim() || !form.senha) {
      setErro("Informe o login e a senha.");
      return;
    }

    try {
      setEntrando(true);
      setErro("");
      await login(form.login, form.senha);
      // Volta para a página que a pessoa tentou abrir antes do login (ou o início).
      navegar(local.state?.de || "/", { replace: true });
    } catch (e) {
      setErro(e.message);
      setEntrando(false);
    }
  }

  return (
    <div className="login">
      <div className="login__painel">
        <div className="login__marca">
          <span className="sidebar__logo"><Cross aria-hidden="true" /></span>
          <div>
            <strong>CENA</strong>
            <span>Secretaria da igreja</span>
          </div>
        </div>

        <h1>Entrar</h1>
        <p className="suave">Use o login e a senha fornecidos pela secretaria.</p>

        <form className="login__form" onSubmit={enviar} noValidate>
          {erro && <Aviso tipo="perigo">{erro}</Aviso>}

          <Campo id="login" rotulo="Login">
            <input
              id="login"
              className="entrada"
              autoComplete="username"
              autoFocus
              value={form.login}
              onChange={e => setForm({ ...form, login: e.target.value })}
            />
          </Campo>

          <Campo id="senha" rotulo="Senha">
            <input
              id="senha"
              className="entrada"
              type={verSenha ? "text" : "password"}
              autoComplete="current-password"
              value={form.senha}
              onChange={e => setForm({ ...form, senha: e.target.value })}
              style={{ paddingRight: 42 }}
            />
            <Botao
              pequeno
              variante="fantasma"
              icone={verSenha ? EyeOff : Eye}
              aria-label={verSenha ? "Esconder senha" : "Mostrar senha"}
              onClick={() => setVerSenha(!verSenha)}
              style={{ position: "absolute", right: 4 }}
            />
          </Campo>

          <Botao type="submit" variante="primario" icone={LogIn} carregando={entrando} style={{ width: "100%", height: 42 }}>
            Entrar
          </Botao>
        </form>
      </div>

      <div className="login__lateral" aria-hidden="true">
        <blockquote>
          “Cada um exerça o dom que recebeu para servir os outros.”
          <cite>1 Pedro 4.10</cite>
        </blockquote>
      </div>
    </div>
  );
}

export default Login;
