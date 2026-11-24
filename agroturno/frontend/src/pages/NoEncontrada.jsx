import { Link } from 'react-router-dom';

export default function NoEncontrada() {
  return (
    <section>
      <h1>Página no encontrada</h1>
      <p><Link to="/">Volver al catálogo</Link></p>
    </section>
  );
}
