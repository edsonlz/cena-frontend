import { Routes, Route } from "react-router-dom";
import { Compass } from "lucide-react";
import Layout from "./components/layout/Layout";
import RotaProtegida from "./components/layout/RotaProtegida";
import { EstadoVazio } from "./components/ui/Basicos";
import Login from "./pages/Login";
import Inicio from "./pages/Inicio";
import ListaMembros from "./pages/membros/ListaMembros";
import FichaMembro from "./pages/membros/FichaMembro";
import ListaMinisterios from "./pages/ministerios/ListaMinisterios";
import DetalheMinisterio from "./pages/ministerios/DetalheMinisterio";
import Cargos from "./pages/Cargos";
import Relatorios from "./pages/Relatorios";
import Usuarios from "./pages/seguranca/Usuarios";
import Perfis from "./pages/seguranca/Perfis";
import Programas from "./pages/seguranca/Programas";

// Mapa de páginas do sistema.
// No treinamento-react o App tinha toda a lógica; aqui ele só decide
// QUAL página aparece para cada endereço. Cada página cuida dos seus dados.
//
// As rotas de dentro ficam "aninhadas" na rota do Layout: o Layout é
// desenhado sempre e a página da vez aparece no <Outlet /> dele.
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RotaProtegida>
            <Layout />
          </RotaProtegida>
        }
      >
        <Route index element={<Inicio />} />

        <Route path="membros" element={<RotaProtegida programas={["membrosww"]}><ListaMembros /></RotaProtegida>} />
        {/* :codigo é um parâmetro: em /membros/15, useParams() devolve { codigo: "15" } */}
        <Route path="membros/:codigo" element={<RotaProtegida programas={["membrosww"]}><FichaMembro /></RotaProtegida>} />

        <Route path="ministerios" element={<RotaProtegida programas={["ministerioww"]}><ListaMinisterios /></RotaProtegida>} />
        <Route path="ministerios/:id" element={<RotaProtegida programas={["ministerioww"]}><DetalheMinisterio /></RotaProtegida>} />

        <Route path="cargos" element={<RotaProtegida programas={["cargosww"]}><Cargos /></RotaProtegida>} />
        <Route path="relatorios" element={<RotaProtegida programas={["wprelmembrosministerio", "wprelatoriocargos"]}><Relatorios /></RotaProtegida>} />

        <Route path="usuarios" element={<RotaProtegida programas={["usuariosww"]}><Usuarios /></RotaProtegida>} />
        <Route path="perfis" element={<RotaProtegida programas={["perfilww"]}><Perfis /></RotaProtegida>} />
        <Route path="programas" element={<RotaProtegida programas={["programasww"]}><Programas /></RotaProtegida>} />

        {/* "*" = qualquer endereço que não bateu com os de cima */}
        <Route path="*" element={<EstadoVazio icone={Compass} titulo="Página não encontrada" texto="O endereço digitado não existe. Use o menu ao lado para navegar." />} />
      </Route>
    </Routes>
  );
}

export default App;
