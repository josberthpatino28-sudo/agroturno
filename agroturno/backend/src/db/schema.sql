-- Esquema de base de datos de AgroTurno (PostgreSQL 14+)
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS usuarios (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  correo        VARCHAR(120) NOT NULL UNIQUE,
  contrasena    VARCHAR(100) NOT NULL,           -- hash bcrypt, nunca texto plano
  rol           VARCHAR(20)  NOT NULL DEFAULT 'productor'
                CHECK (rol IN ('productor', 'administrador')),
  creado_en     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maquinas (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  tipo          VARCHAR(50)  NOT NULL,
  tarifa_hora   NUMERIC(10,2) NOT NULL CHECK (tarifa_hora >= 0),
  estado        VARCHAR(20)  NOT NULL DEFAULT 'disponible'
                CHECK (estado IN ('disponible', 'mantenimiento'))
);

CREATE TABLE IF NOT EXISTS reservas (
  id            SERIAL PRIMARY KEY,
  usuario_id    INT NOT NULL REFERENCES usuarios(id),
  maquina_id    INT NOT NULL REFERENCES maquinas(id),
  inicio        TIMESTAMPTZ NOT NULL,
  fin           TIMESTAMPTZ NOT NULL,
  valor         NUMERIC(12,2) NOT NULL,
  estado        VARCHAR(20) NOT NULL DEFAULT 'activa'
                CHECK (estado IN ('activa', 'cancelada')),
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (fin > inicio),
  -- Regla de negocio central: una máquina no puede tener dos reservas activas que se crucen.
  EXCLUDE USING gist (
    maquina_id WITH =,
    tstzrange(inicio, fin) WITH &&
  ) WHERE (estado = 'activa')
);
