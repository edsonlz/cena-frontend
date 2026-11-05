import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Cross, Menu, Moon, Sun, KeyRound, LogOut, ChevronsUpDown } from "lucide-react";
import { MENU } from "./menu";
import { useAuth } from "../../hooks/useAuth";
import { Avatar } from "../ui/Basicos";
import Botao from "../ui/Botao";
import TrocarSenhaModal from "./TrocarSenhaModal";

// Estrutura comum de todas as telas depois do login:
// barra lateral (menu) + barra de topo + conteúdo da página.
//
// <Outlet /> é onde o React Router desenha a página da rota atual
// (Membros, Ministérios...). O Layout fica fixo e só o Outlet troca.
function Layout() {
  const { usuario, pode } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className={`app ${menuAberto ? "app--menu-aberto" : ""}`}>
      <aside className="sidebar" aria-label="Menu principal">
        <div className="sidebar__marca">
          <span className="sidebar__logo"><Cross aria-hidden="true" /></span>
          <div>
            <strong>CENA</strong>
            <span>Secretaria da igreja</span>
          </div>
        </div>

        {/* No celular, qualquer clique num link do menu fecha o menu.
            O clique "sobe" (bubbling) do link até o <nav>, então basta um onClick aqui. */}
        <nav className="sidebar__nav" onClick={() => setMenuAberto(false)}>
          {MENU.map(secao => {
            // filter: só os itens que o perfil pode acessar.
            const itens = secao.itens.filter(item => !item.programas || pode(...item.programas));
            if (itens.length === 0) return null;

            return (
              <div className="sidebar__grupo" key={secao.grupo ?? "inicio"}>
                {secao.grupo && <div className="sidebar__grupo-titulo">{secao.grupo}</div>}
                {itens.map(item => (
                  // NavLink coloca a classe "active" sozinho quando a rota é a atual.
                  // "end" no Início: senão "/" ficaria ativo em todas as páginas.
                  <NavLink key={item.para} to={item.para} end={item.para === "/"} className="sidebar__link">
                    <item.icone aria-hidden="true" />
                    {item.texto}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar__rodape">
          <MenuUsuario usuario={usuario} />
        </div>
      </aside>

      {menuAberto && <div className="fundo-menu" onClick={() => setMenuAberto(false)} />}

      <div className="principal">
        <header className="topo">
          <Botao className="topo__menu" variante="fantasma" icone={Menu} aria-label="Abrir menu" onClick={() => setMenuAberto(true)} />
          <span className="topo__trilha">
            Olá, <strong>{usuario.apelido}</strong>
          </span>
          <span className="topo__espaco" />
          <AlternarTema />
        </header>

        <main className="conteudo">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Botão claro/escuro. O tema fica no atributo data-theme do <html>
// (as cores mudam pelo tokens.css) e é lembrado no localStorage.
function AlternarTema() {
  const [escuro, setEscuro] = useState(() => document.documentElement.dataset.theme === "dark");

  function alternar() {
    const novo = escuro ? "light" : "dark";
    document.documentElement.dataset.theme = novo;
    try {
      localStorage.setItem("cena-tema", novo);
    } catch {
      // sem armazenamento: o tema vale só nesta visita
    }
    setEscuro(!escuro);
  }

  return (
    <Botao
      variante="fantasma"
      icone={escuro ? Sun : Moon}
      onClick={alternar}
      aria-label={escuro ? "Usar tema claro" : "Usar tema escuro"}
      title={escuro ? "Tema claro" : "Tema escuro"}
    />
  );
}

function MenuUsuario({ usuario }) {
  const { sair } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const ref = useRef(null);

  // Fecha o menu ao clicar fora dele.
  useEffect(() => {
    if (!aberto) return;
    function cliqueFora(e) {
      if (!ref.current?.contains(e.target)) setAberto(false);
    }
    document.addEventListener("mousedown", cliqueFora);
    return () => document.removeEventListener("mousedown", cliqueFora);
  }, [aberto]);

  return (
    <div className="menu-usuario" ref={ref}>
      <button
        type="button"
        className="sidebar__usuario"
        style={{ width: "100%", border: 0, background: "none", cursor: "pointer", textAlign: "left" }}
        aria-expanded={aberto}
        onClick={() => setAberto(!aberto)}
      >
        <Avatar nome={usuario.nome} />
        <div>
          <strong>{usuario.nome}</strong>
          <span>{usuario.admin ? "Administrador" : usuario.perfil}</span>
        </div>
        <ChevronsUpDown size={16} aria-hidden="true" className="suave" />
      </button>

      {aberto && (
        <div className="menu-usuario__lista" role="menu">
          <button type="button" role="menuitem" onClick={() => { setAberto(false); setTrocandoSenha(true); }}>
            <KeyRound aria-hidden="true" /> Trocar minha senha
          </button>
          <button type="button" role="menuitem" onClick={sair}>
            <LogOut aria-hidden="true" /> Sair
          </button>
        </div>
      )}

      <TrocarSenhaModal aberto={trocandoSenha} aoFechar={() => setTrocandoSenha(false)} />
    </div>
  );
}

export default Layout;
