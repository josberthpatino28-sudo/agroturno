const { Pool } = require('pg');

// La cadena de conexión se toma de la variable de entorno DATABASE_URL (archivo .env).
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = pool;
