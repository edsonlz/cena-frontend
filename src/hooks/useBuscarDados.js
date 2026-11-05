import { useCallback, useEffect, useState } from "react";

// Hook customizado que reúne o padrão de busca do App.jsx do treinamento-react:
// estados carregando/erro/dados + useEffect + AbortController.
// Lá esse código ocupava ~40 linhas; aqui cada tela usa em 1 linha:
//
//   const { dados, carregando, erro, recarregar, setDados } = useBuscarDados(listarMembros);
//
// funcaoBusca: função do service que recebe o signal e devolve uma Promise.
// dependencias: quando algum valor da lista mudar, busca de novo (ex.: [id]).
export function useBuscarDados(funcaoBusca, dependencias = []) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  // Mudar este número força uma nova busca (usado pelo recarregar()).
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function buscar() {
      try {
        setCarregando(true);
        setErro("");
        const resultado = await funcaoBusca(controller.signal);
        if (!controller.signal.aborted) setDados(resultado);
      } catch (e) {
        if (!controller.signal.aborted) setErro(e.message);
      } finally {
        if (!controller.signal.aborted) setCarregando(false);
      }
    }

    buscar();
    return () => controller.abort();
    // A função de busca costuma ser criada a cada renderização,
    // então controlamos a repetição só pelas dependências informadas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, versao]);

  const recarregar = useCallback(() => setVersao(v => v + 1), []);

  return { dados, setDados, carregando, erro, recarregar };
}
