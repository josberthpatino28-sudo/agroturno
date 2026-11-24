// Crea las tablas y carga datos de ejemplo. Uso: npm run db:init
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function init() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);

  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM maquinas');
  if (rows[0].n === 0) {
    await pool.query(`
      INSERT INTO maquinas (nombre, tipo, tarifa_hora) VALUES
        ('Tractor John Deere 5075E', 'Tractor', 85000),
        ('Rastra de discos 20"', 'Implemento', 30000),
        ('Fumigadora estacionaria', 'Fumigación', 25000),
        ('Motocultor Honda', 'Motocultor', 40000)`);

    const hash = await bcrypt.hash('Admin2026*', 10);
    await pool.query(
      `INSERT INTO usuarios (nombre, correo, contrasena, rol)
       VALUES ('Administrador', 'admin@agroturno.co', $1, 'administrador')`,
      [hash]
    );
  }
  console.log('Base de datos lista.');
  await pool.end();
}

init().catch((err) => {
  console.error(err);
  process.exit(1);
});
