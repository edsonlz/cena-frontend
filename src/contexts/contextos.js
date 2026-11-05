import { createContext } from "react";

// Context = um jeito de compartilhar dados com QUALQUER componente da árvore,
// sem precisar passar props de pai para filho em cada nível.
//
// Aqui só criamos as "caixas". Quem coloca valor dentro delas são os
// Providers (AuthProvider.jsx e ToastProvider.jsx), e quem lê são os
// hooks useAuth() e useToast() da pasta hooks/.
// (Ficam em arquivos separados por exigência do Fast Refresh do Vite:
// um arquivo .jsx deve exportar só componentes.)
export const AuthContext = createContext(null);
export const ToastContext = createContext(null);
