import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mensajeDeError } from '../api/cliente';

export default function Registro() {
  const { registrar } = useAuth();
  const navigate = useNavigate();
  // Un solo useState con objeto para todos los campos del formulario
  const [datos, setDatos] = useState({ nombre: '', correo: '', contrasena: '' });
  const [error, setError] = useState('');

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setError('');
    try {
      await registrar(datos.nombre, datos.correo, datos.contrasena);
      navigate('/');
    } catch (err) {
      setError(mensajeDeError(err));
    }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <h1>Registro de productor</h1>
      <label>Nombre completo
        <input name="nombre" value={datos.nombre} onChange={cambiar} required />
      </label>
      <label>Correo
        <input name="correo" type="email" value={datos.correo} onChange={cambiar} required />
      </label>
      <label>Contraseña (mínimo 8 caracteres)
        <input name="contrasena" type="password" minLength={8} value={datos.contrasena} onChange={cambiar} required />
      </label>
      {error && <p className="alerta">{error}</p>}
      <button className="boton">Crear cuenta</button>
    </form>
  );
}
