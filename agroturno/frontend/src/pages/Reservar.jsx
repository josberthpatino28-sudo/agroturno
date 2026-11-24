import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import cliente, { mensajeDeError } from '../api/cliente';

const pesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export default function Reservar() {
  const { maquinaId } = useParams(); // parámetro dinámico de la ruta /reservar/:maquinaId
  const navigate = useNavigate();
  const [maquina, setMaquina] = useState(null);
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [error, setError] = useState('');

  // Se vuelve a ejecutar si cambia el id de la máquina en la URL
  useEffect(() => {
    cliente
      .get(`/maquinas/${maquinaId}`)
      .then(({ data }) => setMaquina(data))
      .catch((err) => setError(mensajeDeError(err)));
  }, [maquinaId]);

  // Valor estimado (el valor definitivo lo calcula el servidor)
  const horas = inicio && fin ? (new Date(fin) - new Date(inicio)) / 3_600_000 : 0;
  const estimado = maquina && horas > 0 ? horas * Number(maquina.tarifa_hora) : 0;

  async function enviar(e) {
    e.preventDefault();
    setError('');
    try {
      await cliente.post('/reservas', {
        maquina_id: Number(maquinaId),
        inicio: new Date(inicio).toISOString(),
        fin: new Date(fin).toISOString(),
      });
      navigate('/reservas', { state: { aviso: 'Reserva creada correctamente' } });
    } catch (err) {
      setError(mensajeDeError(err)); // p. ej. 409: "La máquina ya está reservada en ese horario"
    }
  }

  if (!maquina) return error ? <p className="alerta">{error}</p> : <p>Cargando…</p>;

  return (
    <form className="formulario" onSubmit={enviar}>
      <h1>Reservar: {maquina.nombre}</h1>
      <p>Tarifa: {pesos.format(maquina.tarifa_hora)} por hora</p>
      <label>Inicio
        <input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
      </label>
      <label>Fin
        <input type="datetime-local" value={fin} onChange={(e) => setFin(e.target.value)} required />
      </label>
      {estimado > 0 && <p>Valor estimado: <strong>{pesos.format(estimado)}</strong> ({horas} h)</p>}
      {error && <p className="alerta">{error}</p>}
      <button className="boton">Confirmar reserva</button>
    </form>
  );
}
