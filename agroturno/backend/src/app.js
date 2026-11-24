const path = require('path');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Documentación interactiva de la API (Swagger UI) en /api/docs
const especificacion = YAML.load(path.join(__dirname, '..', 'openapi.yaml'));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(especificacion));

app.get('/api/salud', (req, res) => res.json({ estado: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/maquinas', require('./routes/maquinas'));
app.use('/api/reservas', require('./routes/reservas'));

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Manejador central de errores: nunca expone detalles internos al cliente
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
