import { createContext, useContext, useReducer } from 'react';
import cliente from '../api/cliente';

const AuthContext = createContext(null);

// Estado inicial: se recupera la sesión guardada para no perderla al recargar.
function estadoInicial() {
  const guardado = localStorage.getItem('agroturno_usuario');
  return { usuario: guardado ? JSON.parse(guardado) : null };
}

// useReducer centraliza las transiciones del estado de sesión.
function authReducer(estado, accion) {
  switch (accion.type) {
    case 'INICIAR_SESION':
      return { usuario: accion.usuario };
    case 'CERRAR_SESION':
      return { usuario: null };
    default:
      return estado;
  }
}

export function AuthProvider({ children }) {
  const [estado, dispatch] = useReducer(authReducer, undefined, estadoInicial);

  function guardarSesion({ usuario, token }) {
    localStorage.setItem('agroturno_token', token);
    localStorage.setItem('agroturno_usuario', JSON.stringify(usuario));
    dispatch({ type: 'INICIAR_SESION', usuario });
  }

  async function login(correo, contrasena) {
    const { data } = await cliente.post('/auth/login', { correo, contrasena });
    guardarSesion(data);
  }

  async function registrar(nombre, correo, contrasena) {
    const { data } = await cliente.post('/auth/registro', { nombre, correo, contrasena });
    guardarSesion(data);
  }

  function logout() {
    localStorage.removeItem('agroturno_token');
    localStorage.removeItem('agroturno_usuario');
    dispatch({ type: 'CERRAR_SESION' });
  }

  const valor = {
    usuario: estado.usuario,
    esAdmin: estado.usuario?.rol === 'administrador',
    login,
    registrar,
    logout,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

// Hook personalizado: cualquier componente obtiene la sesión con useAuth().
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return contexto;
}
