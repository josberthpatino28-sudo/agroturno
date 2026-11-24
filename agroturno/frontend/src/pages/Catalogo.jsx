import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import cliente, { mensajeDeError } from '../api/cliente';

const pesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export default function Catalogo() {
  const [maquinas, setMaquinas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // useEffect con arreglo de dependencias vacío: se ejecuta una vez al montar el componente.
  useEffect(() => {
    let activo = true;
    cliente
      .get('/maquinas')
      .then(({ data }) => activo && setMaquinas(data))
      .catch((err) => activo && setError(mensajeDeError(err)))
      .finally(() => activo && setCargando(false));
    return () => { activo = false; }; // limpieza: evita actualizar un componente desmontado
  }, []);

  if (cargando) return <p>Cargando maquinaria…</p>;
  if (error) return <p className="alerta">{error}</p>;

  return (
    <section>
      <h1>Maquinaria disponible</h1>
      <div className="rejilla">
        {maquinas.map((m) => (
          <article key={m.id} className="tarjeta">
            <h2>{m.nombre}</h2>
            <p className="tipo">{m.tipo}</p>
            <p className="tarifa">{pesos.format(m.tarifa_hora)} / hora</p>
            {m.estado === 'disponible' ? (
              <Link className="boton" to={`/reservar/${m.id}`}>Reservar</Link>
            ) : (
              <span className="etiqueta">En mantenimiento</span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
