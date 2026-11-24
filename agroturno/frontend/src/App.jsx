import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import RutaProtegida from './components/RutaProtegida';
import Catalogo from './pages/Catalogo';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Reservar from './pages/Reservar';
import MisReservas from './pages/MisReservas';
import NoEncontrada from './pages/NoEncontrada';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="contenedor">
        <Routes>
          <Route path="/" element={<Catalogo />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          {/* Rutas privadas: solo con sesión iniciada */}
          <Route element={<RutaProtegida />}>
            <Route path="/reservar/:maquinaId" element={<Reservar />} />
            <Route path="/reservas" element={<MisReservas />} />
          </Route>
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </main>
    </>
  );
}
