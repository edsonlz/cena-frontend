import {
  LayoutDashboard, Users, Church, BadgeCheck, FileText, UserCog, ShieldCheck, AppWindow
} from "lucide-react";

// Mesmo menu do GeneXus (MenuOptionsData): Início, Secretaria e Segurança,
// mais o grupo Relatórios (no GeneXus os relatórios não estavam no menu).
// "programas" = códigos que liberam o item. O item só aparece se o
// perfil do usuário tiver acesso a pelo menos um deles.
export const MENU = [
  {
    grupo: null,
    itens: [{ para: "/", texto: "Início", icone: LayoutDashboard }]
  },
  {
    grupo: "Secretaria",
    itens: [
      { para: "/membros", texto: "Membros", icone: Users, programas: ["membrosww"] },
      { para: "/ministerios", texto: "Ministérios", icone: Church, programas: ["ministerioww"] },
      { para: "/cargos", texto: "Cargos", icone: BadgeCheck, programas: ["cargosww"] }
    ]
  },
  {
    grupo: "Relatórios",
    itens: [
      { para: "/relatorios", texto: "Relatórios", icone: FileText, programas: ["wprelmembrosministerio", "wprelatoriocargos"] }
    ]
  },
  {
    grupo: "Segurança",
    itens: [
      { para: "/usuarios", texto: "Usuários", icone: UserCog, programas: ["usuariosww"] },
      { para: "/perfis", texto: "Perfis de acesso", icone: ShieldCheck, programas: ["perfilww"] },
      { para: "/programas", texto: "Programas", icone: AppWindow, programas: ["programasww"] }
    ]
  }
];
