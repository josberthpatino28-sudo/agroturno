import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { usuario, esAdmin, logout } = useAuth();
  const navigate = useNavigate();

  function salir() {
    logout();
    navigate('/login');
  }

  return (
    <header className="barra">
      <NavLink to="/" className="marca">🚜 AgroTurno</NavLink>
      <nav>
        <NavLink to="/">Maquinaria</NavLink>
        {usuario ? (
          <>
            <NavLink to="/reservas">{esAdmin ? 'Todas las reservas' : 'Mis reservas'}</NavLink>
            <span className="saludo">Hola, {usuario.nombre}</span>
            <button className="boton-enlace" onClick={salir}>Salir</button>
          </>
        ) : (
          <>
            <NavLink to="/login">Ingresar</NavLink>
            <NavLink to="/registro">Registrarse</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
