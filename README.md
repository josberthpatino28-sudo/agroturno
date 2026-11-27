# AgroTurno — Reserva de maquinaria agrícola compartida

Aplicación web para que los productores de una asociación de las veredas de Mosquera (organización ficticia) reserven tractores e implementos compartidos. El sistema impide las reservas cruzadas y calcula el cobro con una sola regla.

Proyecto académico del módulo **Desarrollo de Aplicaciones Web**, actividad 4.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Front-end | React 19, Vite, React Router, Axios, Context API y hooks |
| Back-end | Node.js 22, Express, JWT y bcrypt |
| Base de datos | PostgreSQL 16 (restricción `EXCLUDE` contra cruces de horario) |
| Documentación de la API | OpenAPI 3 + Swagger UI (`/api/docs`) |
| Despliegue | Docker Compose: PostgreSQL + API + Nginx |

## Estructura

```
agroturno/
├── backend/
│   ├── openapi.yaml          # contrato de la API (Swagger)
│   ├── src/
│   │   ├── app.js            # configuración de Express
│   │   ├── server.js         # punto de entrada
│   │   ├── db/               # esquema SQL, conexión y datos iniciales
│   │   ├── middleware/auth.js# autenticación JWT y autorización por rol
│   │   └── routes/           # auth, maquinas, reservas
│   └── test/api.test.js      # 13 pruebas de integración
├── frontend/
│   └── src/
│       ├── api/cliente.js    # instancia de Axios + interceptor del token
│       ├── context/AuthContext.jsx  # Context API + useReducer
│       ├── components/       # Navbar, RutaProtegida
│       └── pages/            # Catalogo, Login, Registro, Reservar, MisReservas
├── docs/                     # documento de la actividad
└── docker-compose.yml
```

## Ejecución en desarrollo

Requisitos: Node.js 20 o superior y PostgreSQL 14 o superior.

```bash
# 1. Base de datos
createdb agroturno

# 2. Backend
cd backend
cp .env.example .env      # ajustar DATABASE_URL y JWT_SECRET
npm install
npm run db:init           # crea tablas y carga máquinas de ejemplo
npm run dev               # http://localhost:3000  ·  Swagger: http://localhost:3000/api/docs

# 3. Frontend (otra terminal)
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Usuario administrador de prueba: `admin@agroturno.co` / `Admin2026*`. Los productores pueden registrarse desde la aplicación.

## Pruebas

```bash
cd backend
npm test
```

Las pruebas borran la tabla `reservas`, así que deben correr sobre una base de desarrollo, no sobre la de producción.

## Despliegue con Docker

```bash
JWT_SECRET=una-clave-larga-y-aleatoria docker compose up -d --build
```

- Aplicación: http://localhost
- Swagger: http://localhost/api/docs

## Endpoints principales

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/registro` | Público | Registrar un productor |
| POST | `/api/auth/login` | Público | Iniciar sesión (devuelve un JWT) |
| GET | `/api/maquinas` | Público | Catálogo de máquinas |
| POST/PUT/DELETE | `/api/maquinas/:id` | Administrador | Gestionar el catálogo |
| GET | `/api/reservas` | Con sesión | Reservas propias (todas si es administrador) |
| POST | `/api/reservas` | Con sesión | Reservar; responde 409 si hay cruce de horario |
| PATCH | `/api/reservas/:id/cancelar` | Dueño o administrador | Cancelar una reserva |
