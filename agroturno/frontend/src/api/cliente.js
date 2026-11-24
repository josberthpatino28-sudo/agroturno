import axios from 'axios';

// Instancia única de Axios: URL base y cabeceras comunes en un solo lugar.
const cliente = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Interceptor de petición: agrega el token JWT si hay sesión iniciada.
cliente.interceptors.request.use((config) => {
  const token = localStorage.getItem('agroturno_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Convierte cualquier error HTTP en un mensaje legible para la interfaz.
export function mensajeDeError(err) {
  return err.response?.data?.error || 'No fue posible conectar con el servidor';
}

export default cliente;
