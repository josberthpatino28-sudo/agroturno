import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import cliente, { mensajeDeError } from '../api/cliente';
import { useAuth } from '../context/AuthContext';

const pesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fecha = (iso) => new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

export default function MisReservas() {
  const { esAdmin } = useAuth();
  const { state } = useLocation(); // aviso enviado desde la página Reservar
  const [reservas, setReservas] = useState([]);
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    cliente
      .get('/reservas')
      .then(({ data }) => setReservas(data))
      .catch((err) => setError(mensajeDeError(err)));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function cancelar(id) {
    if (!window.confirm('¿Cancelar esta reserva?')) return;
    try {
      await cliente.patch(`/reservas/${id}/cancelar`);
      cargar();
    } catch (err) {
      setError(mensajeDeError(err));
    }
  }

  return (
    <section>
      <h1>{esAdmin ? 'Todas las reservas' : 'Mis reservas'}</h1>
      {state?.aviso && <p className="exito">{state.aviso}</p>}
      {error && <p className="alerta">{error}</p>}
      {reservas.length === 0 ? (
        <p>No hay reservas registradas.</p>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th>Máquina</th>{esAdmin && <th>Productor</th>}<th>Inicio</th><th>Fin</th>
              <th>Valor</th><th>Estado</th><th></th>
            </tr>
          </thead>
          <tbody>
            {reservas.map((r) => (
              <tr key={r.id} className={r.estado === 'cancelada' ? 'cancelada' : ''}>
                <td>{r.maquina}</td>{esAdmin && <td>{r.productor}</td>}
                <td>{fecha(r.inicio)}</td><td>{fecha(r.fin)}</td>
                <td>{pesos.format(r.valor)}</td><td>{r.estado}</td>
                <td>{r.estado === 'activa' && (
                  <button className="boton-enlace" onClick={() => cancelar(r.id)}>Cancelar</button>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
